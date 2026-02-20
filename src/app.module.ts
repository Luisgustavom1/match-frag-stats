import { IngestionModule } from "@ingestion/ingestion.module";
import { Module } from "@nestjs/common";

@Module({
	imports: [IngestionModule],
})
export class AppModule {}
