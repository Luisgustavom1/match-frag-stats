import { IsString, Matches } from "class-validator";

export class StartWatcherDto {
	@IsString()
	@Matches(/\.log$/, { message: "filePath must point to a .log file" })
	filePath!: string;
}
