import { NestFactory } from "@nestjs/core";
import { ConfigModule } from "@shared/config/config.module";
import { ConfigService } from "@shared/config/service/config.service";

import { config } from "dotenv";
import { DataSource } from "typeorm";
import { dataSourceOptionsFactory } from "./typeorm-datasource.factory";

config();

const getDataSource = async () => {
	const configModule = await NestFactory.createApplicationContext(
		ConfigModule.forRoot(),
	);
	const configService = configModule.get<ConfigService>(ConfigService);

	return new DataSource(dataSourceOptionsFactory(configService));
};

export default getDataSource();
