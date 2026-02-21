import { defineConfig } from "drizzle-kit";

export default defineConfig({
	schema: "./src/module/game/shared/persistence/entity/index.ts",
	out: "./src/module/game/shared/persistence/migrations",
	dialect: "postgresql",
	dbCredentials: {
		database: process.env.DATABASE_NAME!,
		host: process.env.DATABASE_HOST!,
		password: process.env.DATABASE_PASSWORD!,
		port: Number(process.env.DATABASE_PORT!),
		user: process.env.DATABASE_USERNAME!,
		ssl: false,
	},
});
