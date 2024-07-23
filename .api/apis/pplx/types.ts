import type { FromSchema } from 'json-schema-to-ts';
import * as schemas from './schemas';

export type PostChatCompletionsBodyParam = FromSchema<typeof schemas.PostChatCompletions.body>;
export type PostChatCompletionsResponse200 = FromSchema<typeof schemas.PostChatCompletions.response['200']>;
export type PostChatCompletionsResponse422 = FromSchema<typeof schemas.PostChatCompletions.response['422']>;
