import { AppLogger } from "@shared/logger/service/app-logger.service";
import { vi } from "vitest";

export const loggerMock = {
	log: vi.fn(),
	error: vi.fn(),
	warn: vi.fn(),
} as unknown as AppLogger;
