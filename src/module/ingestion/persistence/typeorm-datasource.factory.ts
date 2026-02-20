import { join } from "node:path";
import type { ConfigService } from "@shared/config/service/config.service";
import type { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions";

export const dataSourceOptionsFactory = (
	configService: ConfigService,
): PostgresConnectionOptions => ({
	type: "postgres",
	name: "ingestion",
	host: configService.get("database.host"),
	port: 5432,
	username: configService.get("database.username"),
	password: configService.get("database.password"),
	database: configService.get("database.database"),
	synchronize: false,
	entities: [join(__dirname, "entity", "*.entity.{ts,js}")],
	migrations: [join(__dirname, "migration", "*-migration.{ts,js}")],
	migrationsRun: false,
	migrationsTableName: "ingestion_migrations",
	logging: false,
});
