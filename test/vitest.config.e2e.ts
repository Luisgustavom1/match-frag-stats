import swc from "unplugin-swc";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [
		tsconfigPaths(),
		swc.vite({
			module: { type: "es6" },
		}),
	],
	test: {
		name: "e2e",
		globals: true,
		root: "./",
		include: ["src/module/**/test/e2e/**/*.spec.ts"],
		setupFiles: ["./test/test.setup.ts"],
		environment: "node",
		testTimeout: 30000,
		hookTimeout: 30000,
		fileParallelism: false,
		coverage: {
			provider: "v8",
		},
	},
});
