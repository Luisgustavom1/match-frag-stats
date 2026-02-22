import {
	Controller,
	Post,
	UploadedFile,
	UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { MatchRankingsAnalyticsResponseDto } from "@src/module/game/analytics/http/dto/out/analytics-response.dto";
import { IngestLogUseCase } from "@src/module/game/engine/core/use-case/ingest-log.use-case";
import { MatchLogValidationPipe } from "./dto/in/match-log.dto";

@Controller("game/ingest")
export class IngestLogController {
	constructor(private readonly ingestLogUseCase: IngestLogUseCase) {}

	@Post("/log")
	@UseInterceptors(FileInterceptor("log"))
	async ingestLogFile(
		@UploadedFile(new MatchLogValidationPipe())
		file: Express.Multer.File,
	): Promise<MatchRankingsAnalyticsResponseDto> {
		const rankings = await this.ingestLogUseCase.execute(file.buffer);

		return new MatchRankingsAnalyticsResponseDto(rankings);
	}
}
