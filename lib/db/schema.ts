import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 20 }).notNull().default('member'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  stripeProductId: text('stripe_product_id'),
  planName: varchar('plan_name', { length: 50 }),
  subscriptionStatus: varchar('subscription_status', { length: 20 }),
});

export const teamMembers = pgTable('team_members', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  role: varchar('role', { length: 50 }).notNull(),
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
});

export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  userId: integer('user_id').references(() => users.id),
  action: text('action').notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  ipAddress: varchar('ip_address', { length: 45 }),
});

export const invitations = pgTable('invitations', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  email: varchar('email', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  invitedBy: integer('invited_by')
    .notNull()
    .references(() => users.id),
  invitedAt: timestamp('invited_at').notNull().defaultNow(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
});

export const teamsRelations = relations(teams, ({ many }) => ({
  teamMembers: many(teamMembers),
  activityLogs: many(activityLogs),
  invitations: many(invitations),
}));

export const usersRelations = relations(users, ({ many }) => ({
  teamMembers: many(teamMembers),
  invitationsSent: many(invitations),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  team: one(teams, {
    fields: [invitations.teamId],
    references: [teams.id],
  }),
  invitedBy: one(users, {
    fields: [invitations.invitedBy],
    references: [users.id],
  }),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  team: one(teams, {
    fields: [activityLogs.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
export type TeamDataWithMembers = Team & {
  teamMembers: (TeamMember & {
    user: Pick<User, 'id' | 'name' | 'email'>;
  })[];
};

// Chess puzzle tables
export const chessGames = pgTable('chess_games', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  chesscomUrl: text('chesscom_url').notNull(),
  white: varchar('white', { length: 100 }).notNull(),
  black: varchar('black', { length: 100 }).notNull(),
  whiteElo: integer('white_elo'),
  blackElo: integer('black_elo'),
  result: varchar('result', { length: 10 }).notNull(),
  timeControl: varchar('time_control', { length: 50 }),
  pgn: text('pgn').notNull(),
  playedAt: timestamp('played_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const puzzles = pgTable('puzzles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  gameId: integer('game_id')
    .notNull()
    .references(() => chessGames.id),
  fen: text('fen').notNull(),
  sideToMove: varchar('side_to_move', { length: 5 }).notNull(),
  solution: text('solution').notNull(), // JSON array of UCI moves
  solutionSan: text('solution_san').notNull(), // JSON array of SAN moves
  themes: text('themes').notNull(), // JSON array of theme IDs
  difficulty: integer('difficulty').notNull(),
  moveNumber: integer('move_number').notNull(),
  playerFoundIt: integer('player_found_it').notNull().default(0), // 0 or 1 (boolean)
  explanation: text('explanation').notNull(), // JSON object with context, keyIdea, etc.
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const puzzleAttempts = pgTable('puzzle_attempts', {
  id: serial('id').primaryKey(),
  puzzleId: integer('puzzle_id')
    .notNull()
    .references(() => puzzles.id),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  solved: integer('solved').notNull().default(0), // 0 or 1 (boolean)
  attempts: integer('attempts').notNull().default(1),
  hintsUsed: integer('hints_used').notNull().default(0),
  timeSpent: integer('time_spent').notNull().default(0), // milliseconds
  attemptedAt: timestamp('attempted_at').notNull().defaultNow(),
});

// Relations
export const chessGamesRelations = relations(chessGames, ({ one, many }) => ({
  user: one(users, {
    fields: [chessGames.userId],
    references: [users.id],
  }),
  puzzles: many(puzzles),
}));

export const puzzlesRelations = relations(puzzles, ({ one, many }) => ({
  user: one(users, {
    fields: [puzzles.userId],
    references: [users.id],
  }),
  game: one(chessGames, {
    fields: [puzzles.gameId],
    references: [chessGames.id],
  }),
  attempts: many(puzzleAttempts),
}));

export const puzzleAttemptsRelations = relations(puzzleAttempts, ({ one }) => ({
  puzzle: one(puzzles, {
    fields: [puzzleAttempts.puzzleId],
    references: [puzzles.id],
  }),
  user: one(users, {
    fields: [puzzleAttempts.userId],
    references: [users.id],
  }),
}));

// Types
export type ChessGame = typeof chessGames.$inferSelect;
export type NewChessGame = typeof chessGames.$inferInsert;
export type Puzzle = typeof puzzles.$inferSelect;
export type NewPuzzle = typeof puzzles.$inferInsert;
export type PuzzleAttempt = typeof puzzleAttempts.$inferSelect;
export type NewPuzzleAttempt = typeof puzzleAttempts.$inferInsert;

export enum ActivityType {
  SIGN_UP = 'SIGN_UP',
  SIGN_IN = 'SIGN_IN',
  SIGN_OUT = 'SIGN_OUT',
  UPDATE_PASSWORD = 'UPDATE_PASSWORD',
  DELETE_ACCOUNT = 'DELETE_ACCOUNT',
  UPDATE_ACCOUNT = 'UPDATE_ACCOUNT',
  CREATE_TEAM = 'CREATE_TEAM',
  REMOVE_TEAM_MEMBER = 'REMOVE_TEAM_MEMBER',
  INVITE_TEAM_MEMBER = 'INVITE_TEAM_MEMBER',
  ACCEPT_INVITATION = 'ACCEPT_INVITATION',
}
