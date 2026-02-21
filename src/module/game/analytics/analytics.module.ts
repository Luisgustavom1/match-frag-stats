import { Module } from "@nestjs/common";
import { MatchEnginePersistenceModule } from "@src/module/game/shared/persistence/match-engine.persistence.module";
import { LoggerModule } from "@src/module/shared/logger/logger.module";
import { RankingCalculatorService } from "./core/service/ranking-calculator.service";
import { WinnerInfosService } from "./core/service/winner-infos.service";
import { RankMatchesUseCase } from "./core/use-case/rank-matches.use-case";
import { AnalyticsController } from "./http/analytics.controller";

@Module({
	imports: [LoggerModule, MatchEnginePersistenceModule],
	providers: [RankingCalculatorService, RankMatchesUseCase, WinnerInfosService],
	controllers: [AnalyticsController],
	exports: [RankingCalculatorService],
})
export class AnalyticsModule {}
