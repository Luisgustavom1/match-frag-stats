import { LogWatcherUseCase } from "@match-engine/engine/core/use-case/log-watcher.use-case";
import { Body, Controller, Post } from "@nestjs/common";
import { StartWatcherDto } from "./dto/in/start-watcher.dto";

@Controller("game/watch")
export class LogWatcherController {
	constructor(private readonly logWatcherUseCase: LogWatcherUseCase) {}

	@Post()
	async start(@Body() dto: StartWatcherDto) {
		await this.logWatcherUseCase.watch(dto.filePath);
		return { message: `Started watching ${dto.filePath}` };
	}
}
