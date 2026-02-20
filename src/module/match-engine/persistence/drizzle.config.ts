import { defineConfig } from "drizzle-kit";

export default defineConfig({
	schema: "./src/module/match-engine/persistence/entity/index.ts",
	out: "./src/module/match-engine/persistence/migrations",
	dialect: "postgresql",
	dbCredentials: {
		url: process.env.DATABASE_URL!,
	},
});
