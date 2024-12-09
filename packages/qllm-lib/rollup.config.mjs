import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import terser from '@rollup/plugin-terser';
import analyze from 'rollup-plugin-analyzer';
import gzip from 'rollup-plugin-gzip';
import wasm from '@rollup/plugin-wasm';

const isProduction = false;

export default {
  input: 'dist/tsc/index.js',
  output: [
    {
      dir: 'dist/esm',
      format: 'esm',
      sourcemap: true,
      preserveModules: true,
      preserveModulesRoot: 'dist/tsc',
    },
    {
      dir: 'dist/cjs',
      format: 'cjs',
      sourcemap: true,
      preserveModules: true,
      preserveModulesRoot: 'dist/tsc',
      exports: 'auto',
    },
  ],
  plugins: [
    wasm({ 
      targetEnv: 'node',
      maxFileSize: 10000000 
    }),
    resolve({
      preferBuiltins: true,
    }),
    commonjs(),
    json(),
    isProduction && terser(),
    analyze({ summaryOnly: true }),
    isProduction && gzip(),
  ],
  external: [
    'tiktoken',
    'sqlite3',
    'better-sqlite3',
    'bindings',
    '@datastax/astra-db-ts',
    'llamaindex',
    /*    'openai',
    'groq-sdk',
    '@anthropic-ai/sdk',
    '@anthropic-ai/bedrock-sdk',
    '@aws-sdk/client-bedrock',
    '@aws-sdk/credential-providers',
    'axios',
    'js-yaml',
    'mime-types',
    'ollama',
    'sqlite',
    'uuid',
    'tiktoken',
    'zod',*/
  ],
};
