import * as fs from "node:fs";
import * as path from "node:path";
import { IngestLogResponseDto } from "@match-engine/http/dto/ingest-log-response.dto";
import { MatchEngineModule } from "@match-engine/match-engine.module";
import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

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

describe("Ingest Log Controller (e2e)", () => {
	let app: INestApplication;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [MatchEngineModule],
		}).compile();

		app = module.createNestApplication();
		await app.init();
	});

	afterAll(async () => {
		await app.close();
	});

	describe("POST /match-engine/ingest/log", () => {
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
		});

		it("should ingest log file when matches no has frags", async () => {
			const log = Buffer.from(`
						23/04/2019 15:34:22 - New match 11348965 has started
23/04/2019 15:39:22 - Match 11348965 has ended

23/04/2021 16:14:22 - New match 11348966 has started
23/04/2021 16:49:22 - Match 11348966 has ended

24/04/2020 16:14:22 - New match 11348961 has started
24/04/2020 20:19:22 - Match 11348961 has ended
					`);

			const response = await ingestLogReq(app)
				.attach("log", log, {
					filename: "empty.log",
					contentType: "text/plain",
				})
				.expect(201);

			const responseBody: IngestLogResponseDto = response.body;
			expect(responseBody.totalMatches).toBe(3);
			// empty frags
			expect(responseBody.matches.map(({ ranking }) => ranking)).toEqual([
				[],
				[],
				[],
			]);
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
	});
});
