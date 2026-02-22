import { Module } from "@nestjs/common";
import { AnalyticsModule } from "@src/module/game/analytics/analytics.module";
import { MatchEnginePersistenceModule } from "@src/module/game/shared/persistence/match-engine.persistence.module";
import { ConfigModule } from "@src/module/shared/config/config.module";
import { LogUrlMethodInterceptor } from "@src/module/shared/logger/interceptor/log-url.interceptor";
import { LoggerModule } from "@src/module/shared/logger/logger.module";
import { LogParserService } from "./core/service/log-parser.service";
import { IngestLogUseCase } from "./core/use-case/ingest-log.use-case";
import { LogWatcherUseCase } from "./core/use-case/log-watcher.use-case";
import { IngestLogController } from "./http/ingest-log.controller";
import { LogWatcherController } from "./http/log-watcher.controller";

@Module({
	imports: [
		ConfigModule.forRoot(),
		LoggerModule,
		MatchEnginePersistenceModule,
		AnalyticsModule,
	],
	providers: [
		LogParserService,
		IngestLogUseCase,
		LogWatcherUseCase,
		{
			provide: "APP_INTERCEPTOR",
			useClass: LogUrlMethodInterceptor,
		},
	],
	controllers: [IngestLogController, LogWatcherController],
})
export class EngineModule {}
