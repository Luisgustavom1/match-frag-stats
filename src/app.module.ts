import { MatchEngineModule } from "@match-engine/match-engine.module";
import { Module } from "@nestjs/common";

@Module({
	imports: [MatchEngineModule],
})
export class AppModule {}
