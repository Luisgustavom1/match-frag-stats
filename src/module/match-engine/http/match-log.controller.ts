import {
	Controller,
	Post,
	UploadedFile,
	UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { AppLogger } from "@shared/logger/service/app-logger.service";
import { MatchLogValidationPipe } from "./dto/match-log.dto";

@Controller("match-engine")
export class MatchLogController {
	constructor(private readonly logger: AppLogger) {}

	@Post("/log")
	@UseInterceptors(FileInterceptor("log"))
	uploadLogFile(
		@UploadedFile(new MatchLogValidationPipe())
		file: Express.Multer.File,
	) {
		return file;
	}
}
