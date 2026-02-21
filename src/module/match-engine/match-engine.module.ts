import { Module } from "@nestjs/common";
import { ConfigModule } from "@shared/config/config.module";
import { LoggerModule } from "@shared/logger/logger.module";
import { LogParserService } from "./core/service/log-parser.service";
import { IngestLogUseCase } from "./core/use-case/ingest-log.use-case";
import { HealthController } from "./http/health.controller";
import { MatchLogController } from "./http/ingest-log.controller";
import { MatchEnginePersistenceModule } from "./persistence/match-engine.persistence.module";

@Module({
	imports: [ConfigModule.forRoot(), LoggerModule, MatchEnginePersistenceModule],
	providers: [LogParserService, IngestLogUseCase],
	controllers: [HealthController, MatchLogController],
})
export class MatchEngineModule {}
