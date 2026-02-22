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

	/**
	 * Parses the log content and returns an array of MatchModel. If matchInProgress is provided, it will be used as the initial state for parsing, allowing to continue parsing from an ongoing match.
	 * @param logContent the log content to parse, either as a Buffer or an array of lines
	 */
	parse(
		logContent: Buffer | string[],
		matchInProgress?: MatchModel,
	): MatchModel[] {
		if (logContent.length === 0) {
			this.logger.log("empty log received");
			return [];
		}

		const matchesMapByExtId: Map<string, MatchModel> = new Map();

		let currentMatch: MatchModel | undefined = matchInProgress;
		for (const line of this.iterateLines(logContent)) {
			const trimmedLine = line.trim();
			if (!trimmedLine.length) continue;

			const match = this.processLine(line, currentMatch);
			matchesMapByExtId.set(match.externalId, match);

			currentMatch = match.isEnded() ? undefined : match;
		}

		return [...matchesMapByExtId.values()];
	}

	private *iterateLines(input: Buffer | string[]): Generator<string> {
		if (Array.isArray(input)) {
			for (const line of input) {
				yield line;
			}
			return;
		}

		let start = 0;
		for (let end = 0; end < input.length; end++) {
			const EOF = input[end] === "\n".charCodeAt(0); // TODO: support "\r\n" if needed
			if (!EOF) continue;
			if (end > start) yield input.toString("utf8", start, end);
			start = end + 1;
		}
		// handle last line without newline
		if (start < input.length) yield input.toString("utf8", start);
	}

	public processLine(line: string, matchInProgress?: MatchModel): MatchModel {
		const lineSplitted = line.split(" - ");
		const timestampStr = lineSplitted[0];
		const timestamp = this.parseTimestamp(timestampStr);

		const logEventStr = lineSplitted[1];

		const matchStart = this.PATTERNS.matchStart.exec(logEventStr);
		if (matchStart) {
			const [, matchId] = matchStart;

			if (matchInProgress && !matchInProgress.isEnded()) {
				throw new BadRequestException("Match already started", {
					cause: { matchId },
				});
			}

			const newMatch = new MatchModel({
				externalId: matchId,
				startedAt: timestamp,
				endedAt: null,
			});

			return newMatch;
		}

		if (!matchInProgress || matchInProgress.isEnded()) {
			throw new BadRequestException("match not started", {
				cause: { logEventStr },
			});
		}

		const matchEnd = this.PATTERNS.matchEnd.exec(logEventStr);
		if (matchEnd) {
			const [, matchId] = matchEnd;
			if (matchInProgress.externalId !== matchId) {
				throw new BadRequestException("try ending match without start", {
					cause: { matchId },
				});
			}

			matchInProgress.markAsEnd(timestamp);

			return matchInProgress;
		}

		const worldKill = this.PATTERNS.worldKill.exec(logEventStr);
		// world kill will be disregarded
		if (worldKill) return matchInProgress;

		const playerKill = this.PATTERNS.playerKill.exec(logEventStr);
		if (playerKill) {
			const [, killer, victim, weapon] = playerKill;

			const frags = new FragsModel({
				killerUsername: killer,
				victimUsername: victim,
				matchExternalId: matchInProgress.externalId,
				weapon,
				occurredAt: timestamp,
			});

			matchInProgress.addFrag(frags);
			return matchInProgress;
		}

		this.logger.log("unrecognized log line", { line });
		return matchInProgress;
	}

	/**
	 * log timestamp format is "dd/MM/yyyy HH:mm:ss", e.g. "23/04/2019 15:34:22"
	 * @param timestampStr the timestamp string to parse
	 */
	private parseTimestamp(timestampStr: string): Date {
		return parse(timestampStr, "dd/MM/yyyy HH:mm:ss", new Date());
	}
}
