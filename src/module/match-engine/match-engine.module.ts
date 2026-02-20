import { Module } from "@nestjs/common";
import { ConfigModule } from "@shared/config/config.module";
import { LoggerModule } from "@shared/logger/logger.module";
import { TestService } from "./core/service/test.service";

@Module({
	imports: [ConfigModule.forRoot(), LoggerModule],
	providers: [TestService],
})
export class MatchEngineModule {}
