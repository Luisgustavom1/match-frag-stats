import { Inject, Injectable } from "@nestjs/common";
import { DatabaseConnection } from "@shared/persistence/drizzle/connection";
import { DATABASE_CONNECTION } from "@shared/persistence/drizzle/drizzle-persistence.module";
import { FragsEntity, frags } from "../entity/frags.entity";

@Injectable()
export class FragsRepository {
	constructor(
		@Inject(DATABASE_CONNECTION)
		private readonly dbConn: DatabaseConnection,
	) {}

	async bulkCreate(fragsData: FragsEntity[]): Promise<void> {
		if (!fragsData.length) return;

		await this.dbConn.insert(frags).values(fragsData);
	}
}
