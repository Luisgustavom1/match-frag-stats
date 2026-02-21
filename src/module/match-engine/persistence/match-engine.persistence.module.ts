import { Module } from "@nestjs/common";
import { DrizzlePersistenceModule } from "@shared/persistence/drizzle/drizzle-persistence.module";
import { FragsRepository } from "./repository/frags.repository";
import { MatchRepository } from "./repository/match.repository";
import { PlayerRepository } from "./repository/player.repository";
import { MatchAggregatePersistenceService } from "./service/match-aggregate.persistence.service";

@Module({
	imports: [DrizzlePersistenceModule],
	providers: [
		MatchRepository,
		PlayerRepository,
		FragsRepository,
		MatchAggregatePersistenceService,
	],
	exports: [
		DrizzlePersistenceModule,
		MatchRepository,
		PlayerRepository,
		FragsRepository,
		MatchAggregatePersistenceService,
	],
})
export class MatchEnginePersistenceModule {}
