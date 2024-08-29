import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';

export default {
  input: 'dist/esm/index.js', // Change this to point to the compiled TypeScript output
  output: [
    {
      dir: 'dist/esm',
      format: 'esm',
      sourcemap: true,
      exports: 'named'
    },
    {
      dir: 'dist/cjs',
      format: 'cjs',
      sourcemap: true,
      exports: 'named'
    }
  ],
  plugins: [
    resolve({
      preferBuiltins: true
    }),
    commonjs(),
    json()
  ],
  external: [
    'openai',
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
    'zod'
  ]
};