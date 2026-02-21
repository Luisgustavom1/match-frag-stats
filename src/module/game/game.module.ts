import { Module } from "@nestjs/common";
import { AnalyticsModule } from "./analytics/analytics.module";
import { EngineModule } from "./engine/engine.module";
import { HealthController } from "./shared/http/health.controller";
import { MatchEnginePersistenceModule } from "./shared/persistence/match-engine.persistence.module";

@Module({
	imports: [EngineModule, AnalyticsModule, MatchEnginePersistenceModule],
	controllers: [HealthController],
})
export class GameModule {}
