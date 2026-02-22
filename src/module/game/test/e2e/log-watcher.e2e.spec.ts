import * as fs from "node:fs";
import * as path from "node:path";
import { GameModule } from "@match-engine/game.module";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { frags } from "@src/module/game/shared/persistence/entity/frags.entity";
import { match } from "@src/module/game/shared/persistence/entity/match.entity";
import { player } from "@src/module/game/shared/persistence/entity/player.entity";
import { DATABASE_CONNECTION } from "@src/module/shared/persistence/drizzle/drizzle-persistence.module";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import request from "supertest";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

const startWatcherReq = (app: INestApplication) =>
	request(app.getHttpServer()).post("/game/watch");

const waitFor = (ms: number) =>
	new Promise((resolve) => setTimeout(resolve, ms));

describe("Log Watcher Controller (e2e)", () => {
	let app: INestApplication;
	let dbConn: NodePgDatabase;

	const createTmpLogFile = (content = "") => {
		const filePath = path.join(
			process.cwd(),
			".tmp",
			`match-${Date.now()}.log`,
		);
		fs.writeFileSync(filePath, content);
		return filePath;
	};

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

	describe("POST /game/watch", () => {
		it("should start watching a log file and return 201", async () => {
			const filePath = createTmpLogFile();

			const response = await startWatcherReq(app)
				.send({ filePath })
				.expect(201);

			expect(response.body).toEqual({
				message: `Started watching ${filePath}`,
			});
		});

		it("should process correctly log appended to the watched file", async () => {
			const filePath = createTmpLogFile();

			await startWatcherReq(app).send({ filePath }).expect(201);
			await waitFor(500);

			fs.appendFileSync(
				filePath,
				[
					"23/04/2019 15:34:22 - New match 42 has started",
					"23/04/2019 15:36:04 - Alice killed Bob using M16",
					"23/04/2019 15:39:22 - Match 42 has ended",
					"",
				].join("\n"),
			);

			await waitFor(500);

			const matches = await dbConn.select().from(match);
			expect(matches).toHaveLength(1);
			expect(matches[0].externalId).toBe("42");
			expect(matches[0].endedAt).toBeInstanceOf(Date);

			const players = await dbConn.select().from(player);
			expect(players.map((p) => p.username).sort()).toEqual(["Alice", "Bob"]);

			const allFrags = await dbConn.select().from(frags);
			expect(allFrags).toHaveLength(1);
		});

		it("should process incremental appends to the watched file", async () => {
			const filePath = createTmpLogFile();

			await startWatcherReq(app).send({ filePath }).expect(201);
			await waitFor(500);

			fs.appendFileSync(
				filePath,
				"23/04/2019 15:34:22 - New match 99 has started\n",
			);
			await waitFor(500);

			const matchesAfterFirst = await dbConn.select().from(match);
			expect(matchesAfterFirst).toHaveLength(1);
			expect(matchesAfterFirst[0].endedAt).toBeNull();

			fs.appendFileSync(
				filePath,
				"23/04/2019 15:36:04 - Alice killed Bob using AK47\n",
			);
			fs.appendFileSync(filePath, "23/04/2019 15:39:22 - Match 99 has ended\n");
			await waitFor(500);

			const matchesAfterEnd = await dbConn.select().from(match);
			expect(matchesAfterEnd[0].endedAt).toBeInstanceOf(Date);

			const allFrags = await dbConn.select().from(frags);
			expect(allFrags).toHaveLength(1);
		});

		it("should return 400 when filePath is missing", async () => {
			const response = await startWatcherReq(app).send({}).expect(400);

			expect(response.body).toHaveProperty("statusCode", 400);
		});

		it("should return 400 when filePath does not end with .log", async () => {
			const response = await startWatcherReq(app)
				.send({ filePath: "/var/logs/match.txt" })
				.expect(400);

			expect(response.body).toHaveProperty("statusCode", 400);
			expect(response.body.message).toEqual(
				expect.arrayContaining([
					expect.stringContaining("filePath must point to a .log file"),
				]),
			);
		});

		it("should return 400 when filePath is not a string", async () => {
			const response = await startWatcherReq(app)
				.send({ filePath: 123 })
				.expect(400);

			expect(response.body).toHaveProperty("statusCode", 400);
		});
	});
});
