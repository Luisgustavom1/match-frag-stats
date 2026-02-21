import { TablesRelationalConfig } from "drizzle-orm";
import { PgQueryResultHKT, PgTransaction } from "drizzle-orm/pg-core";

export type Transaction = PgTransaction<
	PgQueryResultHKT,
	Record<string, unknown>,
	TablesRelationalConfig
>;
