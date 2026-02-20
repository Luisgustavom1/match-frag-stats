import { MatchEngineModule } from "@match-engine/match-engine.module";
import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

describe("MatchLog Controller (e2e)", () => {
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

	describe("POST /match-engine/log", () => {
		it("should accept a text/plain file", async () => {
			const response = await request(app.getHttpServer())
				.post("/match-engine/log")
				.attach("log", Buffer.from("my log"), {
					filename: "match.log",
					contentType: "text/plain",
				})
				.expect(201);

			expect(response.body).toHaveProperty("originalname", "match.log");
			expect(response.body).toHaveProperty("mimetype", "text/plain");
		});

		it("should throw error if try upload a invalid file type", async () => {
			const logContent = "some log content";

			const response = await request(app.getHttpServer())
				.post("/match-engine/log")
				.attach("log", Buffer.from(logContent), {
					filename: "match.pdf",
					contentType: "application/pdf",
				})
				.expect(400);

			expect(response.body).toHaveProperty("message", "Invalid file type");
		});

		it("should reject file exceeding 10 MB size limit", async () => {
			const largeContent = Buffer.alloc(11 * 1024 * 1024); // 11 MB

			const response = await request(app.getHttpServer())
				.post("/match-engine/log")
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
			const response = await request(app.getHttpServer())
				.post("/match-engine/log")
				.expect(400);

			expect(response.body).toHaveProperty("message", "File is required");
		});
	});
});
