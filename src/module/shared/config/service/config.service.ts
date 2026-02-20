import { Injectable } from "@nestjs/common";
import {
	ConfigService as NestConfigService,
	type Path,
	type PathValue,
} from "@nestjs/config";
import type { Config } from "../util/config.type";

@Injectable()
export class ConfigService<C = Config> extends NestConfigService<C, true> {
	public static readonly config = new ConfigService();

	override get<P extends Path<C>>(propertyPath: P): PathValue<C, P> {
		return super.get(propertyPath, { infer: true });
	}

	static get<P extends Path<Config>>(propertyPath: P): PathValue<Config, P> {
		return ConfigService.config.get(propertyPath);
	}
}
