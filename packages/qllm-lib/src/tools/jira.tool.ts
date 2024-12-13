import { BaseTool, ToolDefinition } from "./base-tool";
import { Version3Client } from "jira.js";
import path from 'path';
dotenv.config();


export interface JiraInput {
  /** Operation to perform */
  operation: 'create' | 'update' | 'delete' | 'get' | 'createBulk';
  /** Issue key (required for get, update, delete) */
  issueKey?: string;
  /** Project key (required for create) */
  projectKey?: string;
  /** Issue summary */
  summary?: string;
  /** Issue description */
  description?: string;
  /** Issue type (required for create) */
  issueType?: string;
  /** Assignee email */
  assignee?: string;
  /** Story points */
  storyPoints?: number;
  /** Priority name (e.g., 'High', 'Medium', 'Low') */
  priority?: string;
  /** Array of label strings */
  labels?: string[];
  /** Array of component names */
  components?: string[];
  /** Array of issues for bulk creation */
  issues?: Array<Omit<JiraInput, 'operation' | 'issues'>> | string;
}

interface JiraIssueResponse {
  key: string;
  fields: {
    summary: string;
    status?: {
      name?: string;
      statusCategory?: {
        key?: string;
        name?: string;
      };
    };
    issuetype?: {
      name?: string;
      iconUrl?: string;
    };
    assignee?: {
      displayName?: string;
      emailAddress?: string;
    };
    reporter?: {
      displayName?: string;
      emailAddress?: string;
    };
    priority?: {
      name?: string;
      iconUrl?: string;
    };
    description?: any;
    created?: string;
    updated?: string;
    customfield_10016?: number; // Story points
    components?: Array<{ name?: string }>;
    labels?: string[];
    subtasks?: Array<{
      key: string;
      fields: {
        summary?: string;
        status?: { name?: string };
      };
    }>;
  };
}

interface WorkflowStepResult {
  response: string;
  outputVariables: {
    id: string;
    key: string;
    self: string;
  };
}

/**
 * @interface JiraConfig
 * @description Configuration options for Jira client
 */
interface JiraConfig {  
  /** Jira host URL */
  host: string;
  /** Jira email */
  email: string;
  /** Jira token */
  token: string;
}

/**
 * @class JiraTool
 * @extends BaseTool
 * @description Tool for interacting with Jira
 */
export class JiraTool extends BaseTool {
  private client: Version3Client;

  /**
   * @constructor
   * @param {JiraConfig} config - Configuration object for the Jira client
   */
  constructor(config?: JiraConfig) {
    const host = config?.host || process.env.JIRA_HOST;
    const email = config?.email || process.env.JIRA_MAIL;
    const token = config?.token || process.env.JIRA_TOKEN;

    if (!host || !email || !token) {
      throw new Error('Missing required Jira configuration. Please provide either config parameters or set JIRA_HOST, JIRA_MAIL, and JIRA_TOKEN environment variables.');
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
   * @method execute
   * @description Execute the Jira operation
   */
  async execute(input: JiraInput): Promise<any> {
    switch (input.operation) {
      case 'create':
        return this.createIssue(input);
      case 'createBulk':
        if (!input.issues) {
          throw new Error('No issues provided for bulk creation');
        }
        const issues = typeof input.issues === 'string' ? JSON.parse(input.issues) : input.issues;
        return Promise.all(issues.map((issue: Omit<JiraInput, 'operation' | 'issues'>) => 
          this.createIssue({ ...issue, operation: 'create' })
        ));
      case 'update':
        return this.updateIssue(input);
      case 'delete':
        return this.deleteIssue(input);
      case 'get':
        return this.getIssue(input);
      default:
        throw new Error('Invalid operation');
    }
  }

  /**
   * @private
   * @method createIssue
   * @description Creates a new Jira issue
   */
  private async createIssue(input: JiraInput): Promise<any> {
    if (!input.projectKey || !input.summary || !input.issueType) {
      throw new Error('Missing required fields for issue creation');
    }

    const fields: any = {
      project: { key: input.projectKey },
      summary: input.summary,
      description: {
        type: "doc",
        version: 1,
        content: [
          {
            type: "paragraph",
            content: [
              {
                text: input.description || '',
                type: "text"
              }
            ]
          }
        ]
      },
      issuetype: { name: input.issueType }
    };

    try {
      // Handle assignee
      if (input.assignee) {
        const users = await this.client.userSearch.findUsers({
          query: input.assignee
        });
        
        const user = users[0];
        if (user) {
          fields.assignee = { accountId: user.accountId };
        } else {
          console.warn(`Warning: Assignee '${input.assignee}' not found`);
        }
      }

      // Handle story points
      if (typeof input.storyPoints === 'number') {
        fields.customfield_10016 = input.storyPoints;
      }

      // Handle priority
      if (input.priority) {
        fields.priority = { name: input.priority };
      }

      // Handle labels
      if (Array.isArray(input.labels) && input.labels.length > 0) {
        fields.labels = input.labels;
      }

      // Handle components
      if (Array.isArray(input.components) && input.components.length > 0) {
        try {
          // Get project components to validate
          const projectComponents = await this.client.projects.getProject({
            projectIdOrKey: input.projectKey,
            expand: 'components'
          });

          const validComponents = projectComponents.components || [];
          const componentMap = new Map(
            validComponents
              .filter((c): c is { id: string; name: string } => Boolean(c?.id && c?.name))
              .map(c => [c.name.toLowerCase(), c.id])
          );

          fields.components = input.components
            .filter(name => componentMap.has(name.toLowerCase()))
            .map(name => ({ id: componentMap.get(name.toLowerCase()) }));

          if (fields.components.length !== input.components.length) {
            console.warn('Warning: Some components were not found in the project');
          }
        } catch (err) {
          console.warn('Warning: Failed to validate components:', err instanceof Error ? err.message : String(err));
        }
      }

      return await this.client.issues.createIssue({
        fields
      });
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const error = err as { response?: { status: number; data: { errors: any } } };
        if (error.response?.status === 400) {
          throw new Error(`Failed to create issue: ${JSON.stringify(error.response.data.errors)}`);
        }
      }
      throw err;
    }
  }

  /**
   * @private
   * @method updateIssue
   * @description Updates an existing Jira issue
   */
  private async updateIssue(input: JiraInput): Promise<any> {
    if (!input.issueKey) {
      throw new Error('Issue key is required for update operation');
    }

    const updateData: any = { fields: {} };
    if (input.summary) updateData.fields.summary = input.summary;
    if (input.description) updateData.fields.description = input.description;

    return await this.client.issues.editIssue({
      issueIdOrKey: input.issueKey,
      fields: updateData.fields,
    });
  }

  /**
   * @private
   * @method deleteIssue
   * @description Deletes a Jira issue
   */
  private async deleteIssue(input: JiraInput): Promise<void> {
    if (!input.issueKey) {
      throw new Error('Issue key is required for delete operation');
    }

    await this.client.issues.deleteIssue({
      issueIdOrKey: input.issueKey,
    });
  }

  /**
   * @private
   * @method getIssue
   * @description Gets a Jira issue
   */
  private async getIssue(input: JiraInput): Promise<JiraIssueResponse> {
    let issueKey = input.issueKey;
    
    // Handle if issueKey is a response object from createIssue
    if (issueKey && typeof issueKey === 'object') {
      const result = issueKey as WorkflowStepResult | any;
      
      // Try to get key from outputVariables first
      if (result.outputVariables?.key) {
        issueKey = result.outputVariables.key;
      } 
      // Then try response field if it exists
      else if (result.response) {
        try {
          // Try parsing if response is a string
          if (typeof result.response === 'string') {
            const parsed = JSON.parse(result.response);
            issueKey = parsed.key;
          } 
          // If response is already an object, try to get key directly
          else if (typeof result.response === 'object') {
            issueKey = result.response.key;
          }
        } catch (e) {
          console.warn('Failed to parse response:', e);
        }
      }
      // Finally try to get key directly from result if it exists
      else if (result.key) {
        issueKey = result.key;
      }
    }

    if (!issueKey || typeof issueKey !== 'string') {
      throw new Error('Issue key is required for get operation and could not be resolved from input');
    }

    const issue = await this.client.issues.getIssue({ issueIdOrKey: issueKey });
    return {
      key: issue.key,
      fields: {
        summary: issue.fields.summary,
        status: {
          name: issue.fields.status?.name || 'Unknown',
          statusCategory: issue.fields.status?.statusCategory
        },
        issuetype: {
          name: issue.fields.issuetype?.name || 'Unknown',
          iconUrl: issue.fields.issuetype?.iconUrl
        },
        assignee: issue.fields.assignee,
        reporter: issue.fields.reporter,
        priority: issue.fields.priority,
        description: issue.fields.description,
        created: issue.fields.created,
        updated: issue.fields.updated,
        customfield_10016: issue.fields.customfield_10016,
        components: issue.fields.components,
        labels: issue.fields.labels || [],
        subtasks: issue.fields.subtasks || []
      }
    };
  }

  /**
   * @method getDescription
   * @description Returns a description of what the tool does
   * @returns {string} Tool description
   */
  public getDescription(): string {
    return 'A tool for managing Jira issues and projects. Supports creating, updating, deleting, and retrieving issues, with options for bulk operations.';
  }

  /**
   * @method getDefinition
   * @description Get the tool definition
   */
  getDefinition(): ToolDefinition {
    return {
      name: 'jira-tool',
      description: 'Tool for interacting with Jira to manage issues and projects',
      input: {
        operation: {
          type: 'string',
          required: true,
          description: 'The operation to perform (create, update, delete, get, createBulk)'
        },
        issueKey: {
          type: 'string',
          required: false,
          description: 'Issue key (required for get, update, delete operations)'
        },
        projectKey: {
          type: 'string',
          required: false,
          description: 'Project key (required for create operation)'
        },
        summary: {
          type: 'string',
          required: false,
          description: 'Issue summary'
        },
        description: {
          type: 'string',
          required: false,
          description: 'Issue description'
        },
        issueType: {
          type: 'string',
          required: false,
          description: 'Issue type (required for create operation)'
        },
        assignee: {
          type: 'string',
          required: false,
          description: 'Assignee email'
        },
        storyPoints: {
          type: 'number',
          required: false,
          description: 'Story points for the issue'
        },
        priority: {
          type: 'string',
          required: false,
          description: 'Priority name (e.g., High, Medium, Low)'
        },
        labels: {
          type: 'array',
          required: false,
          description: 'Array of label strings'
        },
        components: {
          type: 'array',
          required: false,
          description: 'Array of component names'
        },
        issues: {
          type: 'array | string',
          required: false,
          description: 'Array of issues for bulk creation or JSON string, not working yet'
        }
      },
      output: {
        type: 'object',
        description: 'Response containing issue details or operation result'
      }
    };
  }
}