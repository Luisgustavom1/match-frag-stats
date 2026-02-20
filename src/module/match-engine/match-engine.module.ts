import { Module } from "@nestjs/common";
import { ConfigModule } from "@shared/config/config.module";
import { LoggerModule } from "@shared/logger/logger.module";
import { DrizzlePersistenceModule } from "@shared/persistence/drizzle/drizzle-persistence.module";
import { HealthController } from "./http/health";
import { MatchLogController } from "./http/match-log.controller";

@Module({
	imports: [ConfigModule.forRoot(), DrizzlePersistenceModule, LoggerModule],
	providers: [],
	controllers: [HealthController, MatchLogController],
})
export class MatchEngineModule {}
