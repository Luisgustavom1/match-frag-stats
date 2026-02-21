import { Inject, Module, type OnApplicationShutdown } from "@nestjs/common";
import { ConfigModule } from "@src/module/shared/config/config.module";
import { ConfigService } from "@src/module/shared/config/service/config.service";
import { AppLogger } from "@src/module/shared/logger/service/app-logger.service";
import {
	createDatabaseConnection,
	type DatabaseConnectionFactory,
} from "./connection";

export const DATABASE_CONNECTION = Symbol("DATABASE_CONNECTION");
const DATABASE_CONNECTION_FACTORY = Symbol("DATABASE_CONNECTION_FACTORY");

@Module({
	imports: [ConfigModule.forRoot()],
	providers: [
		{
			provide: DATABASE_CONNECTION_FACTORY,
			useFactory: (configService: ConfigService): DatabaseConnectionFactory => {
				return createDatabaseConnection(configService);
			},
			inject: [ConfigService],
		},
		{
			provide: DATABASE_CONNECTION,
			useFactory: (factory: DatabaseConnectionFactory) => factory.db,
			inject: [DATABASE_CONNECTION_FACTORY],
		},
	],
	exports: [DATABASE_CONNECTION],
})
export class DrizzlePersistenceModule implements OnApplicationShutdown {
	@Inject(DATABASE_CONNECTION_FACTORY)
	private readonly connectionFactory: DatabaseConnectionFactory;

	constructor(private readonly logger: AppLogger) {}

	async onApplicationShutdown(): Promise<void> {
		const pool = this.connectionFactory.pool;

		if (pool) {
			await pool.end();
			this.logger.log("Database connection pool closed");
		}
	}
}
