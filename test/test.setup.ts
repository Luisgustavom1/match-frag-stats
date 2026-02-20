import * as fs from "node:fs";
import * as dotenv from "dotenv";

const envFile = ".env";

if (!fs.existsSync(envFile)) {
	throw new Error(".env file NOT found");
}

dotenv.config({ path: envFile });
