CREATE TABLE "chess_games" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"chesscom_url" text NOT NULL,
	"white" varchar(100) NOT NULL,
	"black" varchar(100) NOT NULL,
	"white_elo" integer,
	"black_elo" integer,
	"result" varchar(10) NOT NULL,
	"time_control" varchar(50),
	"pgn" text NOT NULL,
	"played_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "puzzle_attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"puzzle_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"solved" integer DEFAULT 0 NOT NULL,
	"attempts" integer DEFAULT 1 NOT NULL,
	"hints_used" integer DEFAULT 0 NOT NULL,
	"time_spent" integer DEFAULT 0 NOT NULL,
	"attempted_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "puzzles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"game_id" integer NOT NULL,
	"fen" text NOT NULL,
	"side_to_move" varchar(5) NOT NULL,
	"solution" text NOT NULL,
	"solution_san" text NOT NULL,
	"themes" text NOT NULL,
	"difficulty" integer NOT NULL,
	"move_number" integer NOT NULL,
	"player_found_it" integer DEFAULT 0 NOT NULL,
	"explanation" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chess_games" ADD CONSTRAINT "chess_games_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "puzzle_attempts" ADD CONSTRAINT "puzzle_attempts_puzzle_id_puzzles_id_fk" FOREIGN KEY ("puzzle_id") REFERENCES "public"."puzzles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "puzzle_attempts" ADD CONSTRAINT "puzzle_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "puzzles" ADD CONSTRAINT "puzzles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "puzzles" ADD CONSTRAINT "puzzles_game_id_chess_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."chess_games"("id") ON DELETE no action ON UPDATE no action;