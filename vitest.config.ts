import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		projects: ["./test/vitest.config.unit.ts", "./test/vitest.config.e2e.ts"],
	},
});
