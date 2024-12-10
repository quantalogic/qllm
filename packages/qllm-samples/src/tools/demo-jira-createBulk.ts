import { JiraTool } from "qllm-lib/src/tools/jira.tools";
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  try {
    console.log('🔍 Starting Jira bulk ticket creation demo...');

    // Initialize Jira tool with credentials from environment variables
    const jiraTool = new JiraTool({
      host: process.env.JIRA_HOST!,
      email: process.env.JIRA_MAIL!,
      token: process.env.JIRA_TOKEN!
    });

    // Validate configuration
    if (!process.env.JIRA_TOKEN || !process.env.JIRA_HOST || !process.env.JIRA_MAIL) {
      throw new Error('Missing required Jira configuration in environment variables');
    }

    const projectKey = "QUAN";
    // Example tickets to create
    const tickets = [
      {
        projectKey: projectKey,
        summary: 'Implement user authentication',
        description: 'Add user authentication using OAuth 2.0',
        issueType: 'Task',
        labels: ['authentication', 'security'],
        storyPoints: 5
      },
      {
        projectKey: projectKey,
        summary: 'Fix login page styling',
        description: 'Update CSS for better mobile responsiveness',
        issueType: 'Bug',
        labels: ['ui', 'mobile'],
        storyPoints: 2
      },
      {
        projectKey: projectKey,
        summary: 'Add API documentation',
        description: 'Create OpenAPI/Swagger documentation for REST endpoints',
        issueType: 'Task',
        labels: ['documentation', 'api'],
        storyPoints: 3
      }
    ];

    console.log(`Creating ${tickets.length} Jira tickets...`);

    // Create tickets in bulk
    const result = await jiraTool.execute({
      operation: 'createBulk',
      issues: tickets
    });

    console.log('\n✅ Tickets created successfully!');
    console.log('Created tickets:', JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
  process.exit(1);
});

// Run the demo
main();