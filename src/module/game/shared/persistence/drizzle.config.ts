import { defineConfig } from "drizzle-kit";

export default defineConfig({
	schema: "./src/module/game/shared/persistence/entity/index.ts",
	out: "./src/module/game/shared/persistence/migrations",
	dialect: "postgresql",
	dbCredentials: {
		url: process.env.DATABASE_URL!,
	},
});
