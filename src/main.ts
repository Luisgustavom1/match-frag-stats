import { NestFactory } from "@nestjs/core";
import { LoggerFactory } from "@shared/logger/util/logger.factory";
import { AppModule } from "./app.module";

async function bootstrap() {
	const logger = LoggerFactory("application-main");
	const app = await NestFactory.create(AppModule, {
		bufferLogs: true,
	});
	app.useLogger(logger);
	await app.listen(3000);
}
bootstrap();
