import { dirname, resolve as joinPath } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const environment: 'production' | string = process.env.NODE_ENV ?? 'production';

// Load .env file
const dotEnvFilePath = joinPath(__dirname, '../../', environment === 'production' ? '.env' : `.env.${environment}`);
dotenv.config({ path: dotEnvFilePath });

export const botTokenName = process.env.BOT_TOKEN_NAME ?? 'BOT_TOKEN';
export const botToken = process.env[botTokenName] ?? process.env.BOT_TOKEN;

if (!botToken) {
    console.error('BOT_TOKEN OR DEV_BOT_TOKEN needs to be set.');
    process.exit(1);
}
