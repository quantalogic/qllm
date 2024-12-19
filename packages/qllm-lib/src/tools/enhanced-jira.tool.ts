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
  project_key?: string;
  feature_name?: string;
  [key: string]: any;  // Allow for additional template variables
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

  async execute(input: EnhancedJiraInput & Partial<EnhancedJiraConfig>): Promise<any> {
    // Reinitialize JiraTool with input credentials if provided
    if (input.host || input.email || input.token) {
      this.jiraTool = new JiraTool({
        host: input.host || process.env.JIRA_HOST,
        email: input.email || process.env.JIRA_MAIL,
        token: input.token || process.env.JIRA_TOKEN
      });
    }

    console.log('EnhancedJiraTool: input.templateJson:', input.templateJson);
    
    if (input.operation === 'createFromTemplate') {
      let templateJson = input.templateJson;
      
      // If templateJson is a string, parse it
      if (typeof templateJson === 'string') {
        try {
          templateJson = JSON.parse(templateJson);
          console.log('==> Parsed EnhancedJiraTool: templateJson:', templateJson);
        } catch (error) {
          console.error('Failed to parse templateJson:', error);
          throw new Error('Invalid templateJson format');
        }
      }
      
      const templates = Array.isArray(templateJson) ? templateJson : [input.ticketData];
      
      const results = [];
      for (const template of templates) {
        console.log('\n🔍 Debug - Creating Jira issue from template:');
        console.log("=========== template : ", template);
        
        try {
          if (!template) {
            throw new Error('Template is undefined');
          }

          // Each template is already a flat object, no need to check for fields
          const processedFields = { ...template };
          
          // Replace template variables in all string fields
          Object.keys(input).forEach(key => {
            if (key !== 'operation' && key !== 'templateJson' && key !== 'ticketData') {
              const value = input[key];
              if (typeof value === 'string') {
                Object.keys(processedFields).forEach(fieldKey => {
                  if (typeof processedFields[fieldKey] === 'string') {
                    processedFields[fieldKey] = processedFields[fieldKey].replace(
                      new RegExp(`{{${key}}}`, 'g'),
                      value
                    );
                  }
                });
              }
            }
          });
          
          const jiraInput: JiraInput = {
            operation: 'create' as const,
            projectKey: processedFields.projectKey,
            summary: processedFields.summary,
            description: processedFields.description,
            issueType: processedFields.issuetype || processedFields.issueType,
            storyPoints: processedFields.storyPoints,
            labels: processedFields.labels
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
            summary: processedFields.summary
          });
        } catch (error) {
          console.error('Failed to create Jira issue:', error);
          results.push({
            success: false,
            error: error instanceof Error ? error.message : String(error),
            summary: template.summary
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
      description: 'Enhanced Jira tool for creating tickets from templates',
      input: {
        operation: {
          type: 'string',
          required: true,
          description: 'Operation to perform (createFromTemplate)'
        },
        host: {
          type: 'string',
          required: false,
          description: 'Jira host URL. If not provided, uses JIRA_HOST environment variable'
        },
        email: {
          type: 'string',
          required: false,
          description: 'Jira account email. If not provided, uses JIRA_MAIL environment variable'
        },
        token: {
          type: 'string',
          required: false,
          description: 'Jira API token. If not provided, uses JIRA_TOKEN environment variable'
        },
        templateJson: {
          type: 'any',
          required: false,
          description: 'JSON template for creating tickets'
        },
        ticketData: {
          type: 'object',
          required: false,
          description: 'Direct ticket data if not using template'
        },
        project_key: {
          type: 'string',
          required: false,
          description: 'Project key for template variables'
        },
        feature_name: {
          type: 'string',
          required: false,
          description: 'Feature name for template variables'
        }
      },
      output: {
        type: 'object',
        description: 'Results of ticket creation'
      }
    };
  }

  public getDescription(): string {
    return 'Enhanced Jira tool that supports creating issues from JSON templates with variable substitution';
  }
}
