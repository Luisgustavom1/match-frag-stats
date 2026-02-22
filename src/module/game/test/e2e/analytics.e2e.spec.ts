import * as fs from "node:fs";
import * as path from "node:path";
import { GameModule } from "@match-engine/game.module";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { MatchRankingsAnalyticsResponseDto } from "@src/module/game/analytics/http/dto/out/analytics-response.dto";
import { frags } from "@src/module/game/shared/persistence/entity/frags.entity";
import { match } from "@src/module/game/shared/persistence/entity/match.entity";
import { player } from "@src/module/game/shared/persistence/entity/player.entity";
import { DATABASE_CONNECTION } from "@src/module/shared/persistence/drizzle/drizzle-persistence.module";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import request from "supertest";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

const logFilePath = path.join(
	process.cwd(),
	"src",
	"module",
	"game",
	"test",
	"resources",
	"match.log",
);

const ingestLogReq = (app: INestApplication) =>
	request(app.getHttpServer()).post("/game/ingest/log");

const getRankingsReq = (app: INestApplication) =>
	request(app.getHttpServer()).get("/game/analytics/rankings");

describe("Analytics Controller (e2e)", () => {
	let app: INestApplication;
	let dbConn: NodePgDatabase;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [GameModule],
		}).compile();

		app = module.createNestApplication();
		app.useGlobalPipes(
			new ValidationPipe({ transform: true, whitelist: true }),
		);
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

	describe("GET /game/analytics/rankings", () => {
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
23/04/2019 15:35:11 - Roman killed Marcus using AK47
23/04/2019 15:35:12 - Roman killed Marcus using AK47
23/04/2019 15:35:21 - Nick killed Marcus using M16
23/04/2019 15:35:22 - Nick killed Marcus using M16
23/04/2019 15:35:23 - Nick killed Marcus using M16
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

			const { ranking, winner } = body.matches[0];
			expect(ranking[0]).toEqual({
				position: 1,
				username: "Roman",
				kills: 3,
				deaths: 0,
			});
			expect(ranking[1]).toEqual({
				position: 2, // nick has same kills as Roman but more deaths, so should be in position 2
				username: "Nick",
				kills: 3,
				deaths: 1,
			});
			expect(ranking[2]).toEqual({
				position: 3,
				username: "Marcus",
				kills: 0,
				deaths: 5,
			});
			expect(winner).toEqual({
				position: 1,
				username: "Roman",
				kills: 3,
				deaths: 0,
				bestWeapon: "AK47",
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

		describe("filtering by matchId", () => {
			it("should filter correctly matches by a matchId", async () => {
				const log = Buffer.from(`
23/04/2019 15:34:22 - New match 100 has started
23/04/2019 15:35:00 - Roman killed Nick using M16
23/04/2019 15:39:22 - Match 100 has ended

23/04/2019 16:00:00 - New match 200 has started
23/04/2019 16:01:00 - Marcus killed Bryan using AK47
23/04/2019 16:10:00 - Match 200 has ended
			`);

				await ingestLogReq(app)
					.attach("log", log, {
						filename: "test.log",
						contentType: "text/plain",
					})
					.expect(201);

				const response = await getRankingsReq(app)
					.query({ matchIds: "100" })
					.expect(200);

				const body: MatchRankingsAnalyticsResponseDto = response.body;
				expect(body.totalMatches).toBe(1);
				expect(body.matches[0].matchId).toBe("100");
			});

			it("should filter matches by multiple matchIds", async () => {
				const log = Buffer.from(`
23/04/2019 15:34:22 - New match 10 has started
23/04/2019 15:39:22 - Match 10 has ended

23/04/2019 16:00:00 - New match 20 has started
23/04/2019 16:10:00 - Match 20 has ended

23/04/2019 17:00:00 - New match 30 has started
23/04/2019 17:10:00 - Match 30 has ended
			`);

				await ingestLogReq(app)
					.attach("log", log, {
						filename: "test.log",
						contentType: "text/plain",
					})
					.expect(201);

				const response = await getRankingsReq(app)
					.query({ matchIds: ["10", "30"] })
					.expect(200);

				const body: MatchRankingsAnalyticsResponseDto = response.body;
				expect(body.totalMatches).toBe(2);
				expect(body.matches.map((m) => m.matchId).sort()).toEqual(["10", "30"]);
			});

			it("should return empty when matchIds filter does not match any match", async () => {
				const log = Buffer.from(`
23/04/2019 15:34:22 - New match 50 has started
23/04/2019 15:39:22 - Match 50 has ended
			`);

				await ingestLogReq(app)
					.attach("log", log, {
						filename: "test.log",
						contentType: "text/plain",
					})
					.expect(201);

				const response = await getRankingsReq(app)
					.query({ matchIds: "9999" })
					.expect(200);

				const body: MatchRankingsAnalyticsResponseDto = response.body;
				expect(body).toEqual({ totalMatches: 0, matches: [] });
			});

			it("should return 400 when matchIds contains empty string values", async () => {
				const response = await getRankingsReq(app)
					.query({ matchIds: "" })
					.expect(400);

				expect(response.body).toHaveProperty("statusCode", 400);
				expect(response.body).toHaveProperty("message");
			});
		});
	});
});
