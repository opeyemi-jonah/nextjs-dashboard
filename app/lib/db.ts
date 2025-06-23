import postgres from 'postgres';
import { neon } from '@neondatabase/serverless';

export const sql = postgres(process.env.POSTGRES_URL!, { ssl: true });

//vercel postgres connection
export const vercelsql = neon(`${process.env.DATABASE_URL}`);

