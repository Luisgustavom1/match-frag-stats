CREATE TABLE "match_engine"."award" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"match_id" integer NOT NULL,
	"type" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "award_player_id_match_id_type_unique" UNIQUE("player_id","match_id","type")
);
--> statement-breakpoint
ALTER TABLE "match_engine"."award" ADD CONSTRAINT "award_player_id_player_id_fk" FOREIGN KEY ("player_id") REFERENCES "match_engine"."player"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_engine"."award" ADD CONSTRAINT "award_match_id_match_id_fk" FOREIGN KEY ("match_id") REFERENCES "match_engine"."match"("id") ON DELETE no action ON UPDATE no action;