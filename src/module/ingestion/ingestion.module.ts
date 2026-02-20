import { Module } from "@nestjs/common";
import { TestService } from "./core/service/test.service";
import { IngestionPersistenceModule } from "./persistence/ingestion-persistence.module";

@Module({
	imports: [IngestionPersistenceModule],
	providers: [TestService],
})
export class IngestionModule {}
