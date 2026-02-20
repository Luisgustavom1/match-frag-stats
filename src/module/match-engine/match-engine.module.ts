import { Module } from "@nestjs/common";
import { ConfigModule } from "@shared/config/config.module";
import { LoggerModule } from "@shared/logger/logger.module";
import { DrizzlePersistenceModule } from "@shared/persistence/drizzle/drizzle-persistence.module";
import { HealthController } from "./http/health";

@Module({
	imports: [ConfigModule.forRoot(), DrizzlePersistenceModule, LoggerModule],
	providers: [],
	controllers: [HealthController],
})
export class MatchEngineModule {}
