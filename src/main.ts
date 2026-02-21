import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { LoggerFactory } from "@src/module/shared/logger/util/logger.factory";
import { AppModule } from "./app.module";

async function bootstrap() {
	const logger = LoggerFactory("application-main");
	const app = await NestFactory.create(AppModule, {
		bufferLogs: true,
	});
	app.useLogger(logger);
	app.enableShutdownHooks();
	app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
	await app.listen(3000);
}
bootstrap();
