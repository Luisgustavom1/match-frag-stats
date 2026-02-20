import { ConfigService } from "@shared/config/service/config.service";
import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const pool = new Pool({
	connectionString: ConfigService.get("database.url"),
});

export const db = drizzle({ client: pool });
