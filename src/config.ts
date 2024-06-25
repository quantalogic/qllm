// src/config.ts
import dotenv from 'dotenv';
import path from 'path';

const pathEnv = path.resolve(__dirname, '../.env');
const res = dotenv.config({ path: pathEnv });

console.log('dotenv.config:', res);

if (res.parsed) {
  process.env.AWS_PROFILE = res.parsed.AWS_PROFILE || process.env.AWS_PROFILE || 'default';
  process.env.AWS_REGION = res.parsed.AWS_REGION || process.env.AWS_REGION || 'us-west-2';
}

export const AWS_PROFILE = process.env.AWS_PROFILE || 'default';
export const AWS_REGION = process.env.AWS_REGION || 'us-west-2';
export const MODEL_ID = "anthropic.claude-3-5-sonnet-20240620-v1:0";

console.log('AWS_PROFILE:', AWS_PROFILE);
console.log('AWS_REGION:', AWS_REGION);