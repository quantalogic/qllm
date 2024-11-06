import { createLLMProvider } from "qllm-lib";
import {
  TemplateDefinitionBuilder,
  WorkflowManager,
  WorkflowDefinition,
} from "qllm-lib";

async function main(): Promise<void> {
  // Code Review Template
  const codeReviewTemplate = TemplateDefinitionBuilder.create({
    name: "🔍 Advanced Code Review & Documentation Generator",
    version: "2.0.0",
    description: "Comprehensive code analysis with best practices and documentation generation",
    author: "🤖 CodeReviewAI",
    content: `
    ## Code Analysis Configuration
    
    Language: {{programming_language}}
    Framework: {{framework}}
    Code Snippet:
    \`\`\`{{language_syntax}}
    {{code_input}}
    \`\`\`

    ## Analysis Requirements

    <security_analysis>
    - Identify security vulnerabilities
    - Check for common security anti-patterns
    - OWASP compliance verification
    - Dependency security assessment
    </security_analysis>

    <performance_review>
    - Time complexity analysis
    - Memory usage patterns
    - Resource optimization opportunities
    - Bottleneck identification
    </performance_review>

    <code_quality>
    - Design patterns implementation
    - SOLID principles adherence
    - Clean code practices
    - Error handling assessment
    </code_quality>

    <testing_suggestions>
    - Unit test scenarios
    - Integration test cases
    - Edge cases to consider
    - Mocking strategies
    </testing_suggestions>

    ## Documentation Generation

    <api_documentation>
    - Function signatures
    - Parameter descriptions
    - Return types
    - Usage examples
    </api_documentation>

    <architecture_diagram>
    \`\`\`mermaid
    [Generate relevant architecture diagram]
    \`\`\`
    </architecture_diagram>

    ## Always include the Output in Format :

    <code_review>
    [Detailed code review findings]
    </code_review>

    <refactoring_suggestions>
    [Specific code improvements with examples]
    </refactoring_suggestions>

    <documentation>
    [Generated documentation in markdown]
    </documentation>

    END.
    `,
  })
  .withInputVariable(
    "programming_language",
    "string",
    "🔤 Programming language of the code",
  )
  .withInputVariable(
    "framework",
    "string",
    "🛠️ Framework being used",
  )
  .withInputVariable(
    "code_input",
    "string",
    "📝 Code to be reviewed",
  )
  .withInputVariable(
    "language_syntax",
    "string",
    "🔡 Syntax highlighting identifier",
  )
  .withOutputVariable("code_review", "string", {
    description: "🔍 Comprehensive code review analysis",
  })
  .withOutputVariable("refactoring_suggestions", "string", {
    description: "🔧 Suggested code improvements",
  })
  .withOutputVariable("documentation", "string", {
    description: "📚 Generated documentation",
  })
  .withTags("🔍 code-review", "📚 documentation", "🔒 security", "⚡ performance")
  .withCategories("💻 Code Analysis", "📖 Documentation Generation")
  .withModel("gpt-4")
  .withParameters({
    max_tokens: 3000,
    temperature: 0.2,
    top_p: 0.95,
    presence_penalty: 0.1,
    frequency_penalty: 0.1,
  })
  .withPromptType("💻 code_analysis")
  .build();

  // Initialize providers and workflow manager
  const providers = {
    openai: createLLMProvider({
      name: "openai",
      apiKey: process.env.OPENAI_API_KEY
    })
  };

  const workflowManager = new WorkflowManager(providers);

  // Define workflow
  const workflowDefinition: WorkflowDefinition = {
    name: "code_review_workflow",
    description: "Advanced code review and documentation generation workflow",
    defaultProvider: "openai",
    steps: [
      {
        template: codeReviewTemplate,
        provider: "openai",
        input: {
          programming_language: "{{programming_language}}",
          framework: "{{framework}}",
          code_input: "{{code_input}}",
          language_syntax: "{{language_syntax}}"
        },
        output: {
          code_review: "code_review",
          refactoring_suggestions: "refactoring_suggestions",
          documentation: "generated_documentation"
        }
      }
    ]
  };

  try {
    await workflowManager.loadWorkflow(workflowDefinition);
    console.log("\n✅ Workflow loaded successfully");

    // Example code for review
    const sampleCode = `
    class UserService {
      private users: Map<string, User> = new Map();
    
      async createUser(userData: UserData): Promise<User> {
        const user = new User(userData);
        this.users.set(user.id, user);
        return user;
      }
    
      getUser(id: string): User {
        const user = this.users.get(id);
        if (!user) throw new Error('User not found');
        return user;
      }
    }`;

    const workflowInput = {
      programming_language: "TypeScript",
      framework: "Node.js",
      code_input: sampleCode,
      language_syntax: "typescript"
    };

    const result = await workflowManager.runWorkflow(
      "code_review_workflow",
      workflowInput,
      {
        onStepStart: (step, index) => {
          console.log(`\n🔍 Starting code review step ${index + 1}`);
        },
        onStepComplete: (step, index, result) => {
          console.log(`\n✅ Completed code review step ${index + 1}`);
          console.log("\nAnalysis Results:", result);
        }
      }
    );

    console.log("\n🎉 Code review workflow completed");
    console.log("\nFinal Results:", JSON.stringify(result, null, 2));

  } catch (error) {
    console.error("\n❌ Error:", error);
    throw error;
  }
}

main().catch((error) => {
  console.error("\n💥 Fatal Error:", error);
  process.exit(1);
});