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
		name: "unit",
		globals: true,
		root: "./",
		include: ["src/module/**/test/unit/**/*.spec.ts"],
		setupFiles: ["./test/test.setup.ts"],
		environment: "node",
		coverage: {
			provider: "v8",
		},
	},
});
