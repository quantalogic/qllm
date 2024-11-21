// src/tools/github-loader.ts
import { Octokit } from '@octokit/rest';
import { BaseTool, ToolDefinition } from './base-tool';

// src/tools/github-loader.tool.ts
export class GithubLoaderTool extends BaseTool {
  private octokit: Octokit;

  constructor(config: Record<string, any>) {
    super(config);
    this.octokit = new Octokit({ auth: config.authToken });
  }

  getDefinition(): ToolDefinition {
    return {
      name: 'github-loader',
      description: 'Loads content from GitHub repositories',
      input: {
        owner: { type: 'string', required: true, description: 'Repository owner' },
        repo: { type: 'string', required: true, description: 'Repository name' },
        path: { type: 'string', required: true, description: 'File path' },
        ref: { type: 'string', required: false, description: 'Git reference' }
      },
      output: { type: 'string', description: 'File content' }
    };
  }


  async execute(inputs: Record<string, any>): Promise<Record<string, any>> {
    const { owner, repo, path, ref } = inputs;

    const response = await this.octokit.repos.getContent({
      owner,
      repo,
      path,
      ref: ref || undefined
    });

    if ('content' in response.data) {
      return {
        content: Buffer.from(response.data.content, 'base64').toString(),
        sha: response.data.sha
      };
    }

    throw new Error('Retrieved content is not a file');
  }
}
