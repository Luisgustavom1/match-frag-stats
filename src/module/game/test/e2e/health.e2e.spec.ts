import { GameModule } from "@match-engine/game.module";
import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

describe("Health (e2e)", () => {
	let app: INestApplication;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [GameModule],
		}).compile();

		app = module.createNestApplication();
		await app.init();
	});

	afterAll(async () => {
		await app.close();
	});

	it("/health (GET) - should return OK status", async () => {
		const response = await request(app.getHttpServer())
			.get("/health")
			.expect(200);

		expect(response.body).toHaveProperty("status");
		expect(response.body.status).toBe("OK");
	});
});
