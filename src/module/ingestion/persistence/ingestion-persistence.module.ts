import { Module } from "@nestjs/common";
import { ConfigModule } from "@shared/config/config.module";
import { ConfigService } from "@shared/config/service/config.service";
import { TypeOrmPersistenceModule } from "@shared/persistence/typeorm/typeorm-persistence.module";
import { dataSourceOptionsFactory } from "./typeorm-datasource.factory";

@Module({
	imports: [
		TypeOrmPersistenceModule.forRoot({
			name: "ingestion",
			imports: [ConfigModule.forRoot()],
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => {
				return dataSourceOptionsFactory(configService);
			},
		}),
	],
	providers: [],
	exports: [],
})
export class IngestionPersistenceModule {}
