import type { ConfigService } from "@src/module/shared/config/service/config.service";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

export type DatabaseConnection = NodePgDatabase;

export interface DatabaseConnectionFactory {
	pool: Pool;
	db: DatabaseConnection;
}

export const createDatabaseConnection = (
	configService: ConfigService,
): DatabaseConnectionFactory => {
	const pool = new Pool({
		connectionString: configService.get("database.url"),
	});

	const db = drizzle({ client: pool });

	return { pool, db };
};
