import { BadRequestException, Injectable } from "@nestjs/common";
import { MatchModel } from "@src/module/game/engine/core/model/match.model";
import { AppLogger } from "@src/module/shared/logger/service/app-logger.service";
import { parse } from "date-fns";
import { FragsModel } from "../model/frags.model";

@Injectable()
export class LogParserService {
	private readonly PATTERNS = {
		matchStart: /^New match (\d+) has started$/,
		matchEnd: /^Match (\d+) has ended$/,
		playerKill: /^(.+) killed (.+) using (.+)$/,
		worldKill: /^<WORLD> killed (.+) by (.+)$/,
	};

	constructor(private readonly logger: AppLogger) {}

	parse(logContent: string): MatchModel[] {
		if (!logContent || logContent.trim() === "") {
			this.logger.log("empty log received");
			return [];
		}

		// TODO: improve parsing performance by streaming the file line by line instead of loading entire content into memory
		const lines = logContent.split("\n");
		const matches: MatchModel[] = [];

		let lastStartedMatch: MatchModel | null = null;
		for (const line of lines) {
			const match = this.processLine(line, lastStartedMatch);
			if (!match) continue;

			if (match !== lastStartedMatch) matches.push(match);
			lastStartedMatch = match;
		}

		return matches;
	}

	private processLine(
		line: string,
		lastStartedMatch: MatchModel | null,
	): MatchModel | undefined {
		const trimmedLine = line.trim();
		if (trimmedLine.length === 0) return;

		const lineSplitted = trimmedLine.split(" - ");
		const timestampStr = lineSplitted[0];
		const timestamp = this.parseTimestamp(timestampStr);

		const logEventStr = lineSplitted[1];

		const matchStart = this.PATTERNS.matchStart.exec(logEventStr);
		if (matchStart) {
			const [, matchId] = matchStart;

			if (lastStartedMatch && !lastStartedMatch.isEnded()) {
				throw new BadRequestException("Match already started", {
					cause: { matchId },
				});
			}

			const newMatch = new MatchModel({
				externalId: matchId,
				startedAt: timestamp,
				endedAt: null,
			});

			this.logger.log("match started", { matchId, startedAt: timestamp });
			return newMatch;
		}

		if (!lastStartedMatch) {
			throw new BadRequestException("match not started", {
				cause: { logEventStr },
			});
		}

		const matchEnd = this.PATTERNS.matchEnd.exec(logEventStr);
		if (matchEnd) {
			const [, matchId] = matchEnd;
			if (lastStartedMatch.externalId !== matchId) {
				throw new BadRequestException("try ending match without start", {
					cause: { matchId },
				});
			}

			lastStartedMatch.markAsEnd(timestamp);

			this.logger.log("match ended", { matchId, endedAt: timestamp });
			return lastStartedMatch;
		}

		const worldKill = this.PATTERNS.worldKill.exec(logEventStr);
		// world kill will be disregarded
		if (worldKill) return;

		const playerKill = this.PATTERNS.playerKill.exec(logEventStr);
		if (playerKill) {
			const [, killer, victim, weapon] = playerKill;

			const frags = new FragsModel({
				killerUsername: killer,
				victimUsername: victim,
				matchExternalId: lastStartedMatch.externalId,
				weapon,
				occurredAt: timestamp,
			});

			lastStartedMatch.addFrag(frags);
			return lastStartedMatch;
		}

		if (trimmedLine.length > 0) {
			this.logger.log("unrecognized log line", { line: trimmedLine });
		}
	}

	/**
	 * log timestamp format is "dd/MM/yyyy HH:mm:ss", e.g. "23/04/2019 15:34:22"
	 * @param timestampStr the timestamp string to parse
	 */
	private parseTimestamp(timestampStr: string): Date {
		return parse(timestampStr, "dd/MM/yyyy HH:mm:ss", new Date());
	}
}
