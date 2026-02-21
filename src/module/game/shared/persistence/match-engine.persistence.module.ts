import { Module } from "@nestjs/common";
import { DrizzlePersistenceModule } from "@src/module/shared/persistence/drizzle/drizzle-persistence.module";
import { MatchAggregatePersistenceService } from "../../engine/persistence/service/match-aggregate.persistence.service";
import { AwardRepository } from "./repository/award.repository";
import { FragsRepository } from "./repository/frags.repository";
import { MatchRepository } from "./repository/match.repository";
import { PlayerRepository } from "./repository/player.repository";

@Module({
	imports: [DrizzlePersistenceModule],
	providers: [
		MatchRepository,
		PlayerRepository,
		FragsRepository,
		AwardRepository,
		MatchAggregatePersistenceService,
	],
	exports: [
		DrizzlePersistenceModule,
		MatchRepository,
		PlayerRepository,
		FragsRepository,
		AwardRepository,
		MatchAggregatePersistenceService,
	],
})
export class MatchEnginePersistenceModule {}
