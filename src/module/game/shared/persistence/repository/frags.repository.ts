import { Inject, Injectable } from "@nestjs/common";
import { DatabaseConnection } from "@src/module/shared/persistence/drizzle/connection";
import { DATABASE_CONNECTION } from "@src/module/shared/persistence/drizzle/drizzle-persistence.module";
import { Transaction } from "@src/module/shared/persistence/drizzle/type";
import { frags } from "../entity/frags.entity";
import { FragEntityParams, FragsMapper } from "../mapper/frags.mapper";

@Injectable()
export class FragsRepository {
	constructor(
		@Inject(DATABASE_CONNECTION)
		private readonly dbConn: DatabaseConnection,
	) {}

	async bulkCreate(
		fragsData: FragEntityParams[],
		tx?: Transaction,
	): Promise<void> {
		if (!fragsData.length) return;

		await (tx || this.dbConn)
			.insert(frags)
			.values(fragsData.map(FragsMapper.toEntity))
			.onConflictDoNothing();
	}
}
