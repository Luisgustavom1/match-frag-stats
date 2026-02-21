import { Module } from "@nestjs/common";
import { AnalyticsModule } from "./analytics/analytics.module";
import { EngineModule } from "./engine/engine.module";

@Module({
	imports: [EngineModule, AnalyticsModule],
})
export class GameModule {}
