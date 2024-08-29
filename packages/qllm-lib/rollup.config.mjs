import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
//import { terser } from 'rollup-plugin-terser';
//import analyze from 'rollup-plugin-analyzer';
//import gzip from 'rollup-plugin-gzip';

const isProduction = false || process.env.NODE_ENV === 'production';

export default {
  input: 'dist/esm/index.js', // Change this to point to the compiled TypeScript output
  output: [
    {
      dir: 'dist/esm',
      format: 'esm',
      sourcemap: true,
      exports: 'named',
    },
    {
      dir: 'dist/cjs',
      format: 'cjs',
      sourcemap: true,
      //exports: 'named'
    },
  ],
  plugins: [
    resolve({
      preferBuiltins: true,
    }),
    commonjs(),
    json(),
   // isProduction && terser(),
   // analyze({ summaryOnly: true }),
   // isProduction && gzip(),
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
    'zod',
  ],
};
