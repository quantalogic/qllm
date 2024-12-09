import { BaseTool, ToolDefinition } from "./base-tool";
import { Version3Client } from "jira.js";

export interface JiraInput {
  /** Operation to perform */
  operation: 'create' | 'update' | 'delete' | 'get';
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

/**
 * @class JiraTool
 * @extends BaseTool
 * @description Tool for interacting with Jira
 */
export class JiraTool extends BaseTool {
  private client: Version3Client;

  constructor(config: { host: string; email: string; token: string }) {
    super();
    this.client = new Version3Client({
      host: config.host,
      authentication: {
        basic: {
          email: config.email,
          apiToken: config.token,
        },
      },
    });
  }

  /**
   * @method execute
   * @description Execute the Jira operation
   */
  async execute(input: JiraInput): Promise<any> {
    switch (input.operation) {
      case 'create':
        return this.createIssue(input);
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
    if (!input.issueKey) {
      throw new Error('Issue key is required for get operation');
    }

    const issueDetails = await this.client.issues.getIssue({
      issueIdOrKey: input.issueKey,
      fields: [
        'summary',
        'status',
        'assignee',
        'reporter',
        'description',
        'issuetype',
        'created',
        'updated',
        'priority',
        'components',
        'labels',
        'subtasks',
        'customfield_10016' // Story points
      ],
      expand: ['renderedFields', 'names', 'schema', 'transitions', 'operations', 'editmeta', 'changelog']
    });

    return {
      key: issueDetails.key,
      fields: {
        summary: issueDetails.fields.summary,
        status: {
          name: issueDetails.fields.status?.name || 'Unknown',
          statusCategory: issueDetails.fields.status?.statusCategory
        },
        issuetype: {
          name: issueDetails.fields.issuetype?.name || 'Unknown',
          iconUrl: issueDetails.fields.issuetype?.iconUrl
        },
        assignee: issueDetails.fields.assignee,
        reporter: issueDetails.fields.reporter,
        priority: issueDetails.fields.priority,
        description: issueDetails.fields.description,
        created: issueDetails.fields.created,
        updated: issueDetails.fields.updated,
        customfield_10016: issueDetails.fields.customfield_10016,
        components: issueDetails.fields.components,
        labels: issueDetails.fields.labels || [],
        subtasks: issueDetails.fields.subtasks || []
      }
    };
  }

  /**
   * @method getDefinition
   * @description Get the tool definition
   */
  getDefinition(): ToolDefinition {
    return {
      name: 'jira',
      description: 'Tool for interacting with Jira',
      input: {
        operation: {
          type: 'string',
          required: true,
          description: 'Operation to perform',
        },
        issueKey: {
          type: 'string',
          required: false,
          description: 'Issue key (required for get, update, delete)',
        },
        projectKey: {
          type: 'string',
          required: false,
          description: 'Project key (required for create)',
        },
        summary: {
          type: 'string',
          required: false,
          description: 'Issue summary',
        },
        description: {
          type: 'string',
          required: false,
          description: 'Issue description',
        },
        issueType: {
          type: 'string',
          required: false,
          description: 'Issue type (required for create)',
        },
        assignee: {
          type: 'string',
          required: false,
          description: 'Assignee email',
        },
        storyPoints: {
          type: 'number',
          required: false,
          description: 'Story points',
        },
        priority: {
          type: 'string',
          required: false,
          description: 'Priority name (e.g., \'High\', \'Medium\', \'Low\')',
        },
        labels: {
          type: 'array',
          required: false,
          description: 'Array of label strings',
        },
        components: {
          type: 'array',
          required: false,
          description: 'Array of component names',
        },
      },
      output: {
        type: 'object',
        description: 'Result of the Jira operation',
      },
    };
  }
}