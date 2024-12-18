import { BaseTool, ToolDefinition } from "./base-tool";
import { Version3Client } from "jira.js";

/**
 * @interface EnhancedJiraConfig
 * @description Configuration options for Jira client
 */
interface EnhancedJiraConfig {
  host: string;
  email: string;
  token: string;
}

/**
 * @interface JiraTicketTemplate
 * @description Structure for a Jira ticket template
 */
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

/**
 * @interface EnhancedJiraInput
 * @description Enhanced input structure for Jira operations
 */
interface EnhancedJiraInput {
  operation: 'create' | 'update' | 'delete' | 'get' | 'createFromTemplate';
  issueKey?: string;
  templateJson?: string;
  ticketData?: JiraTicketTemplate;
  templateVariables?: Record<string, string>;
}

/**
 * @class EnhancedJiraTool
 * @extends BaseTool
 * @description Enhanced tool for interacting with Jira, with improved template handling
 */
export class EnhancedJiraTool extends BaseTool {
  private client: Version3Client;

  constructor(config?: EnhancedJiraConfig) {
    const host = config?.host || process.env.JIRA_HOST;
    const email = config?.email || process.env.JIRA_MAIL;
    const token = config?.token || process.env.JIRA_TOKEN;

    if (!host || !email || !token) {
      throw new Error('Missing required Jira configuration');
    }

    const clientConfig = {
      host,
      authentication: {
        basic: {
          email,
          apiToken: token,
        },
      },
    };
    super(clientConfig);
    this.client = new Version3Client(clientConfig);
  }

  /**
   * @method parseTemplate
   * @description Parse a JSON template string and replace variables
   */
  private parseTemplate(templateJson: string, variables?: Record<string, string>): JiraTicketTemplate[] {
    try {
      let template = JSON.parse(templateJson);
      
      // Handle both single ticket and array of tickets
      const tickets = Array.isArray(template) ? template : [template];
      
      return tickets.map(ticket => {
        const parsedTicket = { ...ticket };
        
        // Replace template variables if provided
        if (variables) {
          for (const [key, value] of Object.entries(variables)) {
            const placeholder = `{{${key}}}`;
            parsedTicket.summary = parsedTicket.summary?.replace(placeholder, value);
            parsedTicket.description = parsedTicket.description?.replace(placeholder, value);
            
            // Handle custom fields
            if (parsedTicket.customFields) {
              for (const [fieldKey, fieldValue] of Object.entries(parsedTicket.customFields)) {
                if (typeof fieldValue === 'string') {
                  parsedTicket.customFields[fieldKey] = fieldValue.replace(placeholder, value);
                }
              }
            }
          }
        }
        
        return parsedTicket;
      });
    } catch (error) {
      throw new Error(`Failed to parse template: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * @method createFromTemplate
   * @description Create Jira issues from a template
   */
  private async createFromTemplate(input: EnhancedJiraInput): Promise<any> {
    if (!input.templateJson && !input.ticketData) {
      throw new Error('Either templateJson or ticketData must be provided');
    }

    try {
      let tickets: JiraTicketTemplate[];
      
      if (input.templateJson) {
        tickets = this.parseTemplate(input.templateJson, input.templateVariables);
      } else {
        tickets = [input.ticketData!];
      }

      const results = await Promise.all(
        tickets.map(async (ticket) => {
          const fields: any = {
            project: { key: ticket.projectKey },
            summary: ticket.summary,
            issuetype: { name: ticket.issueType },
            description: ticket.description ? {
              type: "doc",
              version: 1,
              content: [
                {
                  type: "paragraph",
                  content: [{ text: ticket.description, type: "text" }]
                }
              ]
            } : undefined
          };

          // Handle assignee
          if (ticket.assignee) {
            const users = await this.client.userSearch.findUsers({
              query: ticket.assignee
            });
            if (users[0]) {
              fields.assignee = { accountId: users[0].accountId };
            }
          }

          // Handle other fields
          if (ticket.storyPoints) fields.customfield_10016 = ticket.storyPoints;
          if (ticket.priority) fields.priority = { name: ticket.priority };
          if (ticket.labels) fields.labels = ticket.labels;
          if (ticket.components) {
            const projectComponents = await this.client.projects.getProject({
              projectIdOrKey: ticket.projectKey,
              expand: 'components'
            });
            
            const validComponents = projectComponents.components || [];
            const componentMap = new Map(
              validComponents
                .filter((c): c is { id: string; name: string } => Boolean(c?.id && c?.name))
                .map(c => [c.name.toLowerCase(), c.id])
            );

            fields.components = ticket.components
              .filter(name => componentMap.has(name.toLowerCase()))
              .map(name => ({ id: componentMap.get(name.toLowerCase()) }));
          }

          // Handle custom fields
          if (ticket.customFields) {
            for (const [key, value] of Object.entries(ticket.customFields)) {
              fields[key] = value;
            }
          }

          return await this.client.issues.createIssue({ fields });
        })
      );

      return {
        success: true,
        created: results.length,
        issues: results.map(result => ({
          key: result.key,
          id: result.id,
          self: result.self
        }))
      };
    } catch (error) {
      throw new Error(`Failed to create issues from template: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * @method execute
   * @description Execute the Jira operation
   */
  async execute(input: EnhancedJiraInput): Promise<any> {
    switch (input.operation) {
      case 'createFromTemplate':
        return this.createFromTemplate(input);
      default:
        throw new Error('Operation not supported in EnhancedJiraTool');
    }
  }

  /**
   * @method getDefinition
   * @description Get the tool definition
   */
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

  /**
   * @method getDescription
   * @description Returns a description of what the tool does
   */
  public getDescription(): string {
    return 'Enhanced Jira tool that supports creating issues from JSON templates with variable substitution';
  }
}
