import { BadRequestException, Injectable, PipeTransform } from "@nestjs/common";

@Injectable()
export class MatchLogValidationPipe<T extends Express.Multer.File>
	implements PipeTransform<T>
{
	private readonly ALLOWED_MIMETYPE = ["text/plain"];

	private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

	transform(value: T) {
		if (!value) {
			throw new BadRequestException("File is required");
		}

		if (!this.ALLOWED_MIMETYPE.includes(value.mimetype)) {
			throw new BadRequestException("Invalid file type");
		}

		if (value.size > this.MAX_FILE_SIZE) {
			throw new BadRequestException(
				"File size exceeds the maximum limit of 10 MB",
			);
		}

		return value;
	}
}
