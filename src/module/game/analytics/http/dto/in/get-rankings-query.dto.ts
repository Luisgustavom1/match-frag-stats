import { Transform } from "class-transformer";
import { IsArray, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class GetRankingsQueryDto {
	@IsOptional()
	@Transform(({ value }) => (Array.isArray(value) ? value : [value]))
	@IsArray()
	@IsString({ each: true })
	@IsNotEmpty({ each: true })
	matchIds?: string[];
}
