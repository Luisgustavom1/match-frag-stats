import { Module } from "@nestjs/common";
import { ConfigModule } from "@shared/config/config.module";
import { LoggerModule } from "@shared/logger/logger.module";
import { DrizzlePersistenceModule } from "@shared/persistence/drizzle/drizzle-persistence.module";
import { LogParserService } from "./core/service/log-parser.service";
import { IngestLogUseCase } from "./core/use-case/ingest-log.use-case";
import { HealthController } from "./http/health.controller";
import { MatchLogController } from "./http/ingest-log.controller";

@Module({
	imports: [ConfigModule.forRoot(), DrizzlePersistenceModule, LoggerModule],
	providers: [LogParserService, IngestLogUseCase],
	controllers: [HealthController, MatchLogController],
})
export class MatchEngineModule {}
