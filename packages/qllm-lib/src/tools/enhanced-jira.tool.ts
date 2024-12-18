import { BaseTool, ToolDefinition } from "./base-tool";
import { Version3Client } from "jira.js";
import { JiraTool } from "./jira.tool";

interface EnhancedJiraConfig {
  host: string;
  email: string;
  token: string;
}

interface JiraTicketTemplate {
  projectKey: string;
  summary: string;
  description?: string;
  issueType: string;
  assignee?: string;
  storyPoints?: number;
  priority?: string;
  labels?: string[];
  components?: string[];
  customFields?: Record<string, any>;
}

interface EnhancedJiraInput {
  operation: 'createFromTemplate';
  templateJson?: any;
  ticketData?: JiraTicketTemplate;
  templateVariables?: Record<string, string>;
}

export class EnhancedJiraTool extends BaseTool {
  private jiraTool: JiraTool;

  constructor(config?: EnhancedJiraConfig) {
    const host = config?.host || process.env.JIRA_HOST;
    const email = config?.email || process.env.JIRA_MAIL;
    const token = config?.token || process.env.JIRA_TOKEN;

    if (!host || !email || !token) {
      throw new Error('Missing required Jira configuration. Please provide either config parameters or set JIRA_HOST, JIRA_MAIL, and JIRA_TOKEN environment variables.');
    }

    super({ host, email, token });
    this.jiraTool = new JiraTool({ host, email, token });
  }

  private parseTemplate(templateJson: any, variables?: Record<string, string>): JiraTicketTemplate[] {
    try {
      let template = typeof templateJson === 'string' ? JSON.parse(templateJson) : templateJson;
      const tickets = Array.isArray(template) ? template : [template];

      return tickets.map(ticket => {
        const parsedTicket = { ...ticket };
        
        // If the ticket has a fields structure, extract it
        if ('fields' in parsedTicket) {
          const fields = parsedTicket.fields;
          parsedTicket.projectKey = fields.project?.key;
          parsedTicket.summary = fields.summary;
          parsedTicket.description = typeof fields.description === 'string' ? 
            fields.description : 
            fields.description?.content?.[0]?.content?.[0]?.text;
          parsedTicket.issueType = fields.issuetype.name;
          parsedTicket.priority = fields.priority?.name;
          parsedTicket.storyPoints = fields.customfield_10016;
          parsedTicket.labels = fields.labels;
          parsedTicket.components = fields.components?.map((c:any) => c.name).filter(Boolean);
        }

        if (variables) {
          for (const [key, value] of Object.entries(variables)) {
            const placeholder = `{{${key}}}`;
            
            if (typeof parsedTicket.summary === 'string') {
              parsedTicket.summary = parsedTicket.summary.replace(placeholder, value);
            }
            
            if (typeof parsedTicket.description === 'string') {
              parsedTicket.description = parsedTicket.description.replace(placeholder, value);
            }

            if (key === 'project_key' && !parsedTicket.projectKey) {
              parsedTicket.projectKey = value;
            }
          }
        }

        return parsedTicket;
      });
    } catch (error) {
      throw new Error(`Failed to parse template: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async createFromTemplate(input: EnhancedJiraInput): Promise<any> {
    if (!input.templateJson && !input.ticketData) {
      throw new Error('Either templateJson or ticketData must be provided');
    }

    try {
      const tickets = input.templateJson ? 
        this.parseTemplate(input.templateJson, input.templateVariables) : 
        [input.ticketData!];

      console.log('Creating issues from template:', tickets);

      // Use the working JiraTool to create issues
      const results = await this.jiraTool.execute({
        operation: 'createBulk',
        issues: tickets.map(ticket => ({
          operation: 'create',
          projectKey: ticket.projectKey,
          summary: ticket.summary,
          description: ticket.description,
          issueType: ticket.issueType,
          assignee: ticket.assignee,
          storyPoints: ticket.storyPoints,
          priority: ticket.priority,
          labels: ticket.labels,
          components: ticket.components
        }))
      });

      return {
        success: true,
        created: results.length,
        issues: results.map((result:any) => ({
          key: result.key,
          id: result.id,
          self: result.self
        }))
      };
    } catch (error) {
      console.error('Template processing error:', error);
      throw new Error(`Failed to create issues from template: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async execute(input: EnhancedJiraInput): Promise<any> {
    console.log('EnhancedJiraTool: input:', input);
    
    switch (input.operation) {
      case 'createFromTemplate':
        return this.createFromTemplate(input);
      default:
        throw new Error('Operation not supported in EnhancedJiraTool');
    }
  }

  getDefinition(): ToolDefinition {
    return {
      name: 'enhanced-jira-tool',
      description: 'Enhanced tool for creating Jira issues from templates',
      input: {
        operation: {
          type: 'string',
          required: true,
          description: 'The operation to perform (currently only supports createFromTemplate)'
        },
        templateJson: {
          type: 'string',
          required: false,
          description: 'JSON string containing the ticket template(s)'
        },
        ticketData: {
          type: 'object',
          required: false,
          description: 'Direct ticket data object'
        },
        templateVariables: {
          type: 'object',
          required: false,
          description: 'Variables to replace in the template'
        }
      },
      output: {
        type: 'object',
        description: 'Response containing created issues details'
      }
    };
  }

  public getDescription(): string {
    return 'Enhanced Jira tool that supports creating issues from JSON templates with variable substitution';
  }
}
