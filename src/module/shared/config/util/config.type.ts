import type { z } from "zod";
import type { configSchema, environmentSchema } from "./config.schema";

export type Environment = z.infer<typeof environmentSchema>;

export type Config = z.infer<typeof configSchema>;
