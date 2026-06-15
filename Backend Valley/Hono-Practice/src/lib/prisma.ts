import 'dotenv/config'
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { env } from '../lib/env'

const pool = new pg.Pool({ connectionString: env.DATABASE_URL });
const adapter = new PrismaPg(pool);

// Pass the adapter directly into the options object
const prisma = new PrismaClient({ adapter });

export default prisma;