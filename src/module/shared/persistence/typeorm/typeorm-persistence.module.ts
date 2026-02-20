import { type DynamicModule, Module } from "@nestjs/common";
import { TypeOrmModule, type TypeOrmModuleAsyncOptions } from "@nestjs/typeorm";

@Module({})
export class TypeOrmPersistenceModule {
	static forRoot(options: TypeOrmModuleAsyncOptions): DynamicModule {
		return {
			module: TypeOrmPersistenceModule,
			imports: [TypeOrmModule.forRootAsync(options)],
		};
	}
}
