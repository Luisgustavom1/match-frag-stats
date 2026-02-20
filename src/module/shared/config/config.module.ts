import { DynamicModule, Module } from "@nestjs/common";
import {
	ConfigModuleOptions,
	ConfigModule as NestConfigModule,
} from "@nestjs/config";
import { ConfigService } from "./service/config.service";
import { factory } from "./util/config.factory";

@Module({
	providers: [ConfigService],
	exports: [ConfigService],
})
export class ConfigModule {
	static forRoot(options?: ConfigModuleOptions): DynamicModule {
		return {
			module: ConfigModule,
			imports: [
				NestConfigModule.forRoot({
					...options,
					envFilePath: options?.envFilePath ?? [".env"],
					expandVariables: true,
					load: options?.load ? [factory, ...options.load] : [factory],
				}),
			],
			providers: [ConfigService],
			exports: [ConfigService],
		};
	}
}
