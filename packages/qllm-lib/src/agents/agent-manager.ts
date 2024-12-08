import { LLMProvider } from '../types'; 
import { Agent } from './base-agent';
import { AgentConfig } from './agent-types';
import * as yaml from 'js-yaml';
import * as fs from 'fs/promises';
import * as path from 'path';

export class AgentManager {
  private agents: Map<string, Agent> = new Map();

  constructor(
    private provider: LLMProvider,
    private templatesPath?: string
  ) {
    this.templatesPath = templatesPath || path.join(__dirname, 'templates');
  }

  async *streamChat(name: string, message: string): AsyncGenerator<string> {
    const agent = this.getAgent(name);
    if (!agent) {
      throw new Error(`Agent ${name} not found`);
    }

    for await (const chunk of agent.streamChat(message)) {
      yield chunk;
    }
  }

  async createAgent(name: string, config: AgentConfig): Promise<Agent> {
    const agent = new Agent(config, this.provider);
    this.agents.set(name, agent);
    return agent;
  }

  async loadTemplate(templateName: string): Promise<AgentConfig> {
    const templatePath = path.join(this.templatesPath!, `${templateName}.yaml`);
    const content = await fs.readFile(templatePath, 'utf-8');
    return yaml.load(content) as AgentConfig;
  }

  async createFromTemplate(
    name: string, 
    templateName: string, 
    overrides: Partial<AgentConfig> = {}
  ): Promise<Agent> {
    const template = await this.loadTemplate(templateName);
    const config = { ...template, ...overrides };
    return this.createAgent(name, config);
  }

  getAgent(name: string): Agent | undefined {
    return this.agents.get(name);
  }

  listAgents(): string[] {
    return Array.from(this.agents.keys());
  }
}