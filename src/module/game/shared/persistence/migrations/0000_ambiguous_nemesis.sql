CREATE SCHEMA "match_engine";
--> statement-breakpoint
CREATE TABLE "match_engine"."frags" (
	"id" serial PRIMARY KEY NOT NULL,
	"match_id" integer,
	"killer_id" integer NOT NULL,
	"victim_id" integer NOT NULL,
	"weapon" varchar(50) NOT NULL,
	"occurred_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "match_engine"."match" (
	"id" serial PRIMARY KEY NOT NULL,
	"external_id" varchar(50) NOT NULL,
	"started_at" timestamp NOT NULL,
	"ended_at" timestamp NOT NULL,
	CONSTRAINT "match_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE TABLE "match_engine"."player" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "player_username_unique" UNIQUE("username")
);
