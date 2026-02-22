import * as fs from "node:fs";
import * as readline from "node:readline";
import { MatchAggregatePersistenceService } from "@match-engine/engine/persistence/service/match-aggregate.persistence.service";
import { MatchRepository } from "@match-engine/shared/persistence/repository/match.repository";
import { Injectable } from "@nestjs/common";
import { AppLogger } from "@shared/logger/service/app-logger.service";
import * as chokidar from "chokidar";
import { LogParserService } from "../service/log-parser.service";

@Injectable()
export class LogWatcherUseCase {
	constructor(
		private readonly logger: AppLogger,
		private readonly logParserService: LogParserService,
		private readonly matchAggregatePersistenceService: MatchAggregatePersistenceService,
		private readonly matchRepository: MatchRepository,
	) {}

	async watch(filePath: string) {
		let matchInProgress = await this.matchRepository.findLastInProgress();

		const watcher = chokidar.watch(filePath, {
			persistent: true,
			ignored: (path, stats) => !!(stats?.isFile() && !path.endsWith(".log")),
		});

		let cursor = 0;
		watcher.on("change", (path) => {
			const stats = fs.statSync(path);

			if (stats.size < cursor) {
				this.logger.warn("only file append is supported skipping changes");
				return;
			}

			const stream = fs.createReadStream(path, {
				start: cursor,
				end: stats.size,
			});

			const rl = readline.createInterface({ input: stream });
			const lines: string[] = [];

			rl.on("line", (line) => {
				lines.push(line);
			});

			rl.on("close", async () => {
				cursor = stats.size;

				this.logger.log("processing lines", { len: lines.length });
				const matches = this.logParserService.parse(lines, matchInProgress);

				if (!matches.length) {
					this.logger.log("no matches found in log");
					return [];
				}

				await this.matchAggregatePersistenceService.persistMatches(matches);

				this.logger.log("ingested log file changes", {
					totalMatches: matches.length,
				});
				matchInProgress = matches.find((m) => !m.isEnded()) || matchInProgress;
			});
		});
	}
}
