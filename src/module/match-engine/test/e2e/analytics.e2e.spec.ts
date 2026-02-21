import * as fs from "node:fs";
import * as path from "node:path";
import { MatchRankingsAnalyticsResponseDto } from "@match-engine/http/dto/analytics-response.dto";
import { MatchEngineModule } from "@match-engine/match-engine.module";
import { frags } from "@match-engine/persistence/entity/frags.entity";
import { match } from "@match-engine/persistence/entity/match.entity";
import { player } from "@match-engine/persistence/entity/player.entity";
import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { DATABASE_CONNECTION } from "@shared/persistence/drizzle/drizzle-persistence.module";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import request from "supertest";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

const logFilePath = path.join(
	process.cwd(),
	"src",
	"module",
	"match-engine",
	"test",
	"resources",
	"match.log",
);

const ingestLogReq = (app: INestApplication) =>
	request(app.getHttpServer()).post("/match-engine/ingest/log");

const getRankingsReq = (app: INestApplication) =>
	request(app.getHttpServer()).get("/match-engine/analytics/rankings");

describe("Analytics Controller (e2e)", () => {
	let app: INestApplication;
	let dbConn: NodePgDatabase;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [MatchEngineModule],
		}).compile();

		app = module.createNestApplication();
		await app.init();

		dbConn = module.get<NodePgDatabase>(DATABASE_CONNECTION);
	});

	afterEach(async () => {
		await dbConn.delete(frags);
		await dbConn.delete(match);
		await dbConn.delete(player);
	});

	afterAll(async () => {
		await app.close();
	});

	describe("GET /match-engine/analytics/rankings", () => {
		it("should return empty result when no matches exist", async () => {
			const response = await getRankingsReq(app).expect(200);

			const body: MatchRankingsAnalyticsResponseDto = response.body;
			expect(body).toEqual({ totalMatches: 0, matches: [] });
		});

		it("should return correctly rankings for all matches", async () => {
			const logContent = fs.readFileSync(logFilePath);

			await ingestLogReq(app)
				.attach("log", logContent, {
					filename: "match.log",
					contentType: "text/plain",
				})
				.expect(201);
			await ingestLogReq(app)
				.attach("log", logContent, {
					filename: "match.log",
					contentType: "text/plain",
				})
				.expect(201);

			const response = await getRankingsReq(app).expect(200);

			const body: MatchRankingsAnalyticsResponseDto = response.body;
			expect(body.totalMatches).toBe(3);
			expect(body.matches).toHaveLength(3);
			expect(body.matches).toMatchSnapshot();
		});

		it("should return analytics with correctly position of player in ranking (players with same kills differences in deaths)", async () => {
			const log = Buffer.from(`
23/04/2019 15:34:22 - New match 999 has started
23/04/2019 15:35:00 - Roman killed Nick using M16
23/04/2019 15:35:10 - Roman killed Marcus using AK47
23/04/2019 15:35:20 - Nick killed Marcus using M16
23/04/2019 15:35:20 - Nick killed Marcus using M16
23/04/2019 15:39:22 - Match 999 has ended
			`);

			await ingestLogReq(app)
				.attach("log", log, {
					filename: "test.log",
					contentType: "text/plain",
				})
				.expect(201);

			const response = await getRankingsReq(app).expect(200);

			const body: MatchRankingsAnalyticsResponseDto = response.body;
			expect(body.totalMatches).toBe(1);

			const ranking = body.matches[0].ranking;
			expect(ranking[0]).toMatchObject({
				position: 1,
				username: "Roman",
				kills: 2,
				deaths: 0,
			});
			expect(ranking[1]).toMatchObject({
				position: 2, // nick has same kills as Roman but more deaths, so should be in position 2
				username: "Nick",
				kills: 2,
				deaths: 1,
			});
			expect(ranking[2]).toMatchObject({
				position: 3,
				username: "Marcus",
				kills: 0,
				deaths: 3,
			});
		});

		it("should return matches with empty ranking for matches without frags", async () => {
			const log = Buffer.from(`
23/04/2019 15:34:22 - New match 1 has started
23/04/2019 15:39:22 - Match 1 has ended
			`);

			await ingestLogReq(app)
				.attach("log", log, {
					filename: "empty.log",
					contentType: "text/plain",
				})
				.expect(201);

			const response = await getRankingsReq(app).expect(200);

			const body: MatchRankingsAnalyticsResponseDto = response.body;
			expect(body.totalMatches).toBe(1);
			expect(body.matches[0]).toMatchObject({
				matchId: "1",
				ranking: [],
			});
		});

		it("should return rankings ordered by kills desc within each match", async () => {
			const log = Buffer.from(`
23/04/2019 15:34:22 - New match 777 has started
23/04/2019 15:35:00 - Alpha killed Beta using M16
23/04/2019 15:35:10 - Alpha killed Gamma using AK47
23/04/2019 15:35:20 - Beta killed Gamma using M16
23/04/2019 15:39:22 - Match 777 has ended
			`);

			await ingestLogReq(app)
				.attach("log", log, { filename: "test.log", contentType: "text/plain" })
				.expect(201);

			const response = await getRankingsReq(app).expect(200);
			const ranking = response.body.matches[0].ranking;

			expect(ranking[0].username).toBe("Alpha");
			expect(ranking[0].kills).toBe(2);
			expect(ranking[1].username).toBe("Beta");
			expect(ranking[1].kills).toBe(1);
			expect(ranking[2].username).toBe("Gamma");
			expect(ranking[2].kills).toBe(0);
		});
	});
});
