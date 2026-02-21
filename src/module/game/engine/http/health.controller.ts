import { Controller, Get, Inject } from "@nestjs/common";
import { AppLogger } from "@src/module/shared/logger/service/app-logger.service";
import type { DatabaseConnection } from "@src/module/shared/persistence/drizzle/connection";
import { DATABASE_CONNECTION } from "@src/module/shared/persistence/drizzle/drizzle-persistence.module";
import { sql } from "drizzle-orm";

@Controller("health")
export class HealthController {
	constructor(
		@Inject(DATABASE_CONNECTION)
		private readonly db: DatabaseConnection,
		private readonly logger: AppLogger,
	) {}

	@Get("/")
	async health() {
		try {
			await this.db.execute(sql`SELECT 1`);
			this.logger.log("Health check endpoint called");
			return { status: "OK" };
		} catch (error) {
			const err = error as Error;
			this.logger.error("Health check failed", { ...err });
			return { status: "ERROR", message: err.message };
		}
	}
}
