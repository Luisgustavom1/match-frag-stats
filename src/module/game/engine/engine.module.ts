import { Module } from "@nestjs/common";
import { AnalyticsModule } from "@src/module/game/analytics/analytics.module";
import { MatchEnginePersistenceModule } from "@src/module/game/shared/persistence/match-engine.persistence.module";
import { ConfigModule } from "@src/module/shared/config/config.module";
import { LogUrlMethodInterceptor } from "@src/module/shared/logger/interceptor/log-url.interceptor";
import { LoggerModule } from "@src/module/shared/logger/logger.module";
import { AwardCalculatorService } from "./core/service/award-calculator.service";
import { LogParserService } from "./core/service/log-parser.service";
import { IngestLogUseCase } from "./core/use-case/ingest-log.use-case";
import { IngestLogController } from "./http/ingest-log.controller";

@Module({
	imports: [
		ConfigModule.forRoot(),
		LoggerModule,
		MatchEnginePersistenceModule,
		AnalyticsModule,
	],
	providers: [
		LogParserService,
		AwardCalculatorService,
		IngestLogUseCase,
		{
			provide: "APP_INTERCEPTOR",
			useClass: LogUrlMethodInterceptor,
		},
	],
	controllers: [IngestLogController],
})
export class EngineModule {}
