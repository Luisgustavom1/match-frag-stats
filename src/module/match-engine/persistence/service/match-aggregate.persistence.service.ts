import { MatchModel } from "@match-engine/core/model/match.model";
import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { AppLogger } from "@shared/logger/service/app-logger.service";
import { DatabaseConnection } from "@shared/persistence/drizzle/connection";
import { DATABASE_CONNECTION } from "@shared/persistence/drizzle/drizzle-persistence.module";
import { FragEntityParams } from "../mapper/frags.mapper";
import { FragsRepository } from "../repository/frags.repository";
import { MatchRepository } from "../repository/match.repository";
import { PlayerRepository } from "../repository/player.repository";

@Injectable()
export class MatchAggregatePersistenceService {
	constructor(
		@Inject(DATABASE_CONNECTION)
		private readonly dbConn: DatabaseConnection,
		private readonly matchRepository: MatchRepository,
		private readonly playerRepository: PlayerRepository,
		private readonly fragsRepository: FragsRepository,
		private readonly logger: AppLogger,
	) {}

	async persistMatches(matches: MatchModel[]): Promise<MatchModel[]> {
		if (!matches.length) return [];

		const allUsernames = this.getUniqueUsernamePlayers(matches);

		return await this.dbConn.transaction(async (tx) => {
			const [savedPlayers, savedMatches] = await Promise.all([
				this.playerRepository.bulkCreate(allUsernames, tx),
				this.matchRepository.bulkCreate(matches, tx),
			]);

			const playerMapByUsername = new Map(
				savedPlayers.map((player) => [player.username, player]),
			);
			const matchMapByExternalId = new Map(
				matches.map((match) => [match.externalId, match]),
			);

			const fragsToInsert: FragEntityParams[] = [];
			for (const match of savedMatches) {
				const originalMatch = matchMapByExternalId.get(match.externalId);
				if (!originalMatch) continue;

				for (const frag of originalMatch.frags) {
					const killerId = playerMapByUsername.get(frag.killerUsername)?.id;
					const victimId = playerMapByUsername.get(frag.victimUsername)?.id;

					if (!victimId || !killerId) {
						this.logger.warn(
							`victim id or killer id not found for frag: ${frag.id}`,
						);
						throw new BadRequestException(`Player not found for frag`, {
							cause: {
								fragId: frag.id,
								killerUsername: frag.killerUsername,
								victimUsername: frag.victimUsername,
							},
						});
					}

					fragsToInsert.push({
						frag,
						matchId: match.id,
						killerId,
						victimId,
					});
				}
			}

			await this.fragsRepository.bulkCreate(fragsToInsert, tx);

			this.logger.log("match aggregates saved successfully", {
				matchesCount: savedMatches.length,
				playersCount: playerMapByUsername.size,
				fragsCount: fragsToInsert.length,
			});

			return savedMatches;
		});
	}

	private getUniqueUsernamePlayers(matches: MatchModel[]) {
		const allUsernames = new Set<string>();
		for (const match of matches) {
			for (const frag of match.frags) {
				allUsernames.add(frag.killerUsername);
				allUsernames.add(frag.victimUsername);
			}
		}
		return [...allUsernames];
	}
}
