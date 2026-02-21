import { IngestLogUseCase } from "@match-engine/core/use-case/ingest-log.use-case";
import {
	Controller,
	Post,
	UploadedFile,
	UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { MatchLogValidationPipe } from "./dto/in/match-log.dto";
import { MatchRankingsAnalyticsResponseDto } from "./dto/out/analytics-response.dto";

@Controller("match-engine/ingest")
export class MatchLogController {
	constructor(private readonly ingestLogUseCase: IngestLogUseCase) {}

	@Post("/log")
	@UseInterceptors(FileInterceptor("log"))
	async ingestLogFile(
		@UploadedFile(new MatchLogValidationPipe())
		file: Express.Multer.File,
	): Promise<MatchRankingsAnalyticsResponseDto> {
		const logContent = file.buffer.toString("utf-8");
		const rankings = await this.ingestLogUseCase.execute(logContent);

		return new MatchRankingsAnalyticsResponseDto(rankings);
	}
}
