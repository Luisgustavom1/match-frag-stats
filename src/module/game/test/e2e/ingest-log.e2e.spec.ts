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
import { eq, inArray } from "drizzle-orm";
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

describe("Ingest Log Controller (e2e)", () => {
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
		// Clean up database after each test
		await dbConn.delete(frags);
		await dbConn.delete(match);
		await dbConn.delete(player);
	});

	afterAll(async () => {
		await app.close();
	});

	describe("POST /game/ingest/log", () => {
		it("should ingest log file and return matches with rankings", async () => {
			const logContent = fs.readFileSync(logFilePath);

			const response = await ingestLogReq(app)
				.attach("log", logContent, {
					filename: "match.log",
					contentType: "text/plain",
				})
				.expect(201);

			expect(response.body).toHaveProperty("totalMatches", 3);
			expect(response.body.matches).toMatchSnapshot(3);

			const matches = await dbConn.select().from(match);
			expect(
				matches
					.map((m) => ({
						externalId: m.externalId,
						endedAt: m.endedAt,
					}))
					.sort((a, b) => a.externalId.localeCompare(b.externalId)),
			).toEqual([
				{ externalId: "11348961", endedAt: expect.any(Date) },
				{ externalId: "11348965", endedAt: expect.any(Date) },
				{ externalId: "11348966", endedAt: expect.any(Date) },
			]);

			const players = await dbConn.select().from(player);
			expect(players.map((p) => p.username).sort()).toEqual(
				expect.arrayContaining(["Roman", "Nick", "Marcus", "Jhon", "Bryan"]),
			);

			const allFrags = await dbConn.select().from(frags);
			expect(allFrags).toHaveLength(6);

			const matchesMap = new Map(matches.map((m) => [m.externalId, m]));
			const match1 = matchesMap.get("11348965");
			const match2 = matchesMap.get("11348966");
			const match3 = matchesMap.get("11348961");

			const fragsMatch1 = allFrags.filter((f) => f.matchId === match1?.id);
			const fragsMatch2 = allFrags.filter((f) => f.matchId === match2?.id);
			const fragsMatch3 = allFrags.filter((f) => f.matchId === match3?.id);

			expect(fragsMatch1).toHaveLength(1);
			expect(fragsMatch2).toHaveLength(1);
			expect(fragsMatch3).toHaveLength(4);
		});

		it("should ingest log file when matches no has frags", async () => {
			const log = Buffer.from(`
23/04/2019 15:34:22 - New match 1 has started
23/04/2019 15:39:22 - Match 1 has ended

23/04/2021 16:14:22 - New match 2 has started
23/04/2021 16:49:22 - Match 2 has ended

24/04/2020 16:14:22 - New match 3 has started
24/04/2020 20:19:22 - Match 3 has ended
					`);

			const response = await ingestLogReq(app)
				.attach("log", log, {
					filename: "empty.log",
					contentType: "text/plain",
				})
				.expect(201);

			const responseBody: MatchRankingsAnalyticsResponseDto = response.body;
			expect(responseBody.totalMatches).toBe(3);
			// empty frags
			expect(responseBody.matches.map(({ ranking }) => ranking)).toEqual([
				[],
				[],
				[],
			]);

			const matches = await dbConn.select().from(match);
			expect(matches.map((m) => m.externalId).sort()).toEqual(["1", "2", "3"]);

			const players = await dbConn.select().from(player);
			expect(players).toHaveLength(0);

			const allFrags = await dbConn.select().from(frags);
			expect(allFrags).toHaveLength(0);
		});

		it("should return empty matches for empty log file", async () => {
			const response = await ingestLogReq(app)
				.attach("log", Buffer.from(""), {
					filename: "empty.log",
					contentType: "text/plain",
				})
				.expect(201);

			expect(response.body.totalMatches).toBe(0);
			expect(response.body.matches).toHaveLength(0);

			const matches = await dbConn.select().from(match);
			expect(matches).toHaveLength(0);

			const players = await dbConn.select().from(player);
			expect(players).toHaveLength(0);

			const allFrags = await dbConn.select().from(frags);
			expect(allFrags).toHaveLength(0);
		});

		it("should handle re-ingestion without creating duplicates", async () => {
			const log = Buffer.from(`
23/04/2019 15:34:22 - New match 999999 has started
23/04/2019 15:36:04 - Alice killed Bob using M16
23/04/2019 15:39:22 - Match 999999 has ended
			`);

			await ingestLogReq(app)
				.attach("log", log, {
					filename: "test.log",
					contentType: "text/plain",
				})
				.expect(201);

			let matches = await dbConn.select().from(match);
			expect(matches).toHaveLength(1);
			const firstMatchId = matches[0].id;

			let players = await dbConn.select().from(player);
			expect(players).toHaveLength(2);

			let allFrags = await dbConn.select().from(frags);
			const firstFragsCount = allFrags.length;
			expect(firstFragsCount).toBe(1);

			await ingestLogReq(app)
				.attach("log", log, {
					// same log
					filename: "test.log",
					contentType: "text/plain",
				})
				.expect(201);

			matches = await dbConn.select().from(match);
			expect(matches).toHaveLength(1); // still only 1 match
			expect(matches[0].id).toBe(firstMatchId); // with same ID

			players = await dbConn.select().from(player);
			expect(players).toHaveLength(2); // still only 2 players

			allFrags = await dbConn.select().from(frags);
			expect(allFrags.length).toBe(firstFragsCount);
		});

		it("should throw error if try upload a invalid file type", async () => {
			const logContent = "some log content";

			const response = await ingestLogReq(app)
				.attach("log", Buffer.from(logContent), {
					filename: "match.pdf",
					contentType: "application/pdf",
				})
				.expect(400);

			expect(response.body).toHaveProperty("message", "Invalid file type");
		});

		it("should reject file exceeding 10 MB size limit", async () => {
			const largeContent = Buffer.alloc(11 * 1024 * 1024); // 11 MB

			const response = await ingestLogReq(app)
				.attach("log", largeContent, {
					filename: "large-match.log",
					contentType: "text/plain",
				})
				.expect(400);

			expect(response.body).toHaveProperty(
				"message",
				"File size exceeds the maximum limit of 10 MB",
			);
		});

		it("should reject request without file", async () => {
			const response = await ingestLogReq(app).expect(400);

			expect(response.body).toHaveProperty("message", "File is required");
		});

		it("should inject correctly three logs - 1 log with a match that not end -> 1 log with some frags -> 1 log ending the match", async () => {
			const log1 = Buffer.from(`
23/04/2019 15:34:22 - New match 1 has started
23/04/2019 15:36:04 - Bob killed Alice using M16
23/04/2019 15:39:22 - Match 1 has ended

23/04/2019 15:34:22 - New match 2 has started
			`);

			const log2 = Buffer.from(`
23/04/2019 15:36:04 - Alice killed Bob using M16
			`);

			const log3 = Buffer.from(`
23/04/2019 15:39:22 - Match 2 has ended
			`);

			await ingestLogReq(app)
				.attach("log", log1, {
					filename: "test.log",
					contentType: "text/plain",
				})
				.expect(201);

			const [match_1, match_2] = await dbConn
				.select()
				.from(match)
				.where(inArray(match.externalId, ["1", "2"]));
			expect(match_1.endedAt).toBeInstanceOf(Date);
			expect(match_2.endedAt).toBeNull();

			await ingestLogReq(app)
				.attach("log", log2, {
					filename: "test.log",
					contentType: "text/plain",
				})
				.expect(201);

			const newFrag = await dbConn
				.select()
				.from(frags)
				.where(eq(frags.matchId, match_2.id));
			expect(newFrag).toHaveLength(1);

			await ingestLogReq(app)
				.attach("log", log3, {
					filename: "test.log",
					contentType: "text/plain",
				})
				.expect(201);
			const [updatedMatch2] = await dbConn
				.select()
				.from(match)
				.where(eq(match.externalId, "2"));
			expect(updatedMatch2.endedAt).toBeInstanceOf(Date);
		});
	});
});
