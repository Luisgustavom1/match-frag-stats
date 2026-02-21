import { Module } from "@nestjs/common";
import { GameModule } from "@src/module/game/game.module";

@Module({
	imports: [GameModule],
})
export class AppModule {}
