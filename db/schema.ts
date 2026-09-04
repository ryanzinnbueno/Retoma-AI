import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';
export const workspaces=sqliteTable('workspaces',{owner:text('owner').primaryKey(),data:text('data').notNull(),revision:integer('revision').notNull().default(1)});
export const events=sqliteTable('events',{owner:text('owner').notNull(),id:text('id').notNull(),leadId:integer('lead_id').notNull(),request:text('request').notNull(),status:text('status').notNull(),result:text('result'),created:integer('created').notNull()},t=>[primaryKey({columns:[t.owner,t.id]})]);

