import { BaseTool, ToolDefinition } from "./base-tool";
import { Version3Client } from "jira.js";
import { JiraTool, JiraInput } from "./jira.tool";

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

  async execute(input: EnhancedJiraInput): Promise<any> {
    console.log('EnhancedJiraTool: input:', input);
    
    if (input.operation === 'createFromTemplate') {
      const templates = Array.isArray(input.templateJson) ? input.templateJson : [input.ticketData];
      
      const results = [];
      for (const template of templates) {
        console.log('\n🔍 Debug - Creating Jira issue from template:');
        console.log("=========== template : ", template);
        
        try {
          // Handle both direct fields and nested structure
          const fields = template.fields || template;
          
          const jiraInput: JiraInput = {
            operation: 'create' as const,  // Type assertion to satisfy the union type
            projectKey: fields.projectKey,
            summary: fields.summary,
            description: fields.description,
            // Handle different issuetype formats
            issueType: typeof fields.issuetype === 'string' ? 
              fields.issuetype : 
              (fields.issuetype?.name || fields.issueType),
            storyPoints: fields.storyPoints,
            labels: fields.labels
          };

          console.log('\n🔍 Debug - Jira input:', jiraInput);

          // Validate required fields
          if (!jiraInput.projectKey || !jiraInput.summary || !jiraInput.issueType) {
            throw new Error(`Missing required fields: ${[
              !jiraInput.projectKey && 'projectKey',
              !jiraInput.summary && 'summary',
              !jiraInput.issueType && 'issueType'
            ].filter(Boolean).join(', ')}`);
          }

          const result = await this.jiraTool.execute(jiraInput);
          results.push({
            success: true,
            key: result.key,
            summary: fields.summary
          });
        } catch (error) {
          console.error('Failed to create Jira issue:', error);
          results.push({
            success: false,
            error: error instanceof Error ? error.message : String(error),
            summary: template.fields?.summary || template.summary
          });
        }
      }

      return {
        message: `Processed ${results.length} tickets`,
        results
      };
    }

    throw new Error(`Unsupported operation: ${input.operation}`);
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
