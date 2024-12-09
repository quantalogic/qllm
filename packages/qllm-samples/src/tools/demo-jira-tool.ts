// demo-jira-tool.ts
import { JiraTool } from "qllm-lib/src/tools/jira.tools";
import dotenv from 'dotenv';
dotenv.config();

async function testJiraOperations() {
    try {
        // Configuration setup
        const config = {
            host: process.env.JIRA_HOST!,
            email: process.env.JIRA_MAIL!,
            token: process.env.JIRA_TOKEN!
        };

        // Validate configuration
        if (!config.token || !config.host || !config.email) {
            throw new Error('Missing required Jira configuration in environment variables');
        }

        const jiraTool = new JiraTool(config);

        // Create a new issue
        console.log('\nCreating new issue...');
        const newIssue = await jiraTool.execute({
            operation: 'create',
            projectKey: 'QUAN',
            summary: 'Test JIRA TOOL',
            description: 'This is a test to create a new JIRA issue using QLLM',
            issueType: 'Task',
            assignee: 'jluong@novagen.tech',
            storyPoints: 5
        });
        
        console.log('\nCreated Issue Details:');
        console.log('---------------------');
        console.log('Key:', newIssue.key);
        
        // Get the created issue to verify
        console.log('\nFetching created issue...');
        const fetchedIssue = await jiraTool.execute({
            operation: 'get',
            issueKey: newIssue.key
        });
        
        console.log('\nFetched Issue Details:');
        console.log('---------------------');
        console.log('Key:', fetchedIssue.key);
        console.log('Summary:', fetchedIssue.fields.summary);
        console.log('Type:', fetchedIssue.fields.issuetype?.name);
        console.log('Status:', fetchedIssue.fields.status?.name);
        if (fetchedIssue.fields.status?.statusCategory) {
            console.log('Status Category:', fetchedIssue.fields.status.statusCategory.name);
        }
        console.log('Description:', fetchedIssue.fields.description);
        
        // People
        if (fetchedIssue.fields.assignee) {
            console.log('Assignee:', fetchedIssue.fields.assignee.displayName);
        }
        if (fetchedIssue.fields.reporter) {
            console.log('Reporter:', fetchedIssue.fields.reporter.displayName);
        }
        
        // Dates
        if (fetchedIssue.fields.created) {
            console.log('Created:', new Date(fetchedIssue.fields.created).toLocaleString());
        }
        if (fetchedIssue.fields.updated) {
            console.log('Updated:', new Date(fetchedIssue.fields.updated).toLocaleString());
        }
        
        // Additional fields
        if (fetchedIssue.fields.priority) {
            console.log('Priority:', fetchedIssue.fields.priority.name);
        }
        if (fetchedIssue.fields.customfield_10016) {
            console.log('Story Points:', fetchedIssue.fields.customfield_10016);
        }
        if (fetchedIssue.fields.components?.length) {
            console.log('Components:', fetchedIssue.fields.components.map((c: { name?: string }) => c.name).join(', '));
        }
        if (fetchedIssue.fields.labels?.length) {
            console.log('Labels:', fetchedIssue.fields.labels.join(', '));
        }
        if (fetchedIssue.fields.subtasks?.length) {
            console.log('\nSubtasks:');
            fetchedIssue.fields.subtasks.forEach((subtask: { 
                key: string; 
                fields: { 
                    summary?: string; 
                    status?: { 
                        name?: string 
                    } 
                } 
            }) => {
                console.log(`- ${subtask.key}: ${subtask.fields.summary} (${subtask.fields.status?.name})`);
            });
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

// Run the test
console.log('Starting Jira operations...');
testJiraOperations()
    .then(() => console.log('\n✅ Operations completed successfully'))
    .catch(error => {
        console.error('Operations failed:', error);
        process.exit(1);
    });