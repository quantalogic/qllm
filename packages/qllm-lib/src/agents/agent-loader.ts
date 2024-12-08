import { readFile } from 'fs/promises';
import { load } from 'js-yaml';
import { Agent } from './base-agent'; 
import { LLMProvider } from '../types'; 

export class AgentLoader {
  async loadFromYaml(path: string, provider: LLMProvider): Promise<Agent> {
    const content = await readFile(path, 'utf-8');
    const config = load(content) as any;
    
    return new Agent({
      role: config.name,
      goal: config.description,
      backstory: config.description,
      llmOptions: {
        ...config.model.parameters,
        model: config.model.name,
        systemMessage: this.processSystemPrompt(
          config.system_prompt,
          config.role,
          config.goal,
          config.backstory
        ),
        streaming: true // Enable streaming by default
      }
    }, provider);
  }

  private processSystemPrompt(
    template: string,
    role: string,
    goal: string,
    backstory: string
  ): string {
    return template
      .replace('{role}', role)
      .replace('{goal}', goal)
      .replace('{backstory}', backstory);
  }
}