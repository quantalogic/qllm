# QLLM: Simplifying Language Model Interactions

## Chapter 1: Introduction

### 1.1 Welcome to QLLM
Welcome to QLLM, your ultimate command-line tool for interacting with Large Language Models (LLMs). Imagine having a powerful AI assistant at your fingertips, ready to help you tackle complex tasks, generate creative content, and analyze data—all from your terminal. This README will guide you through everything you need to know to harness the full potential of QLLM and become a master of AI-powered productivity.

## Chapter 2: Benefits of QLLM

### 2.1 Why QLLM and QLLM-LIB?
#### Key Benefits:
1. **Unified Access**: QLLM brings together multiple LLM providers under one roof. No more context-switching between different tools and APIs.  
2. **Command-Line Power**: As a developer, you live in the terminal. QLLM integrates seamlessly into your existing workflow.  
3. **Flexibility and Customization**: Tailor AI interactions to your specific needs with extensive configuration options and support for custom templates.  
4. **Time-Saving Features**: From quick queries to ongoing conversations, QLLM helps you get answers fast.  
5. **Cross-Platform Compatibility**: Works consistently across Windows, macOS, and Linux.  

### 2.2 Anecdote: A Productivity Boost
Imagine you're a data analyst working on a tight deadline. You need to quickly analyze a large dataset and generate a report for your team. Instead of manually sifting through the data and writing the report, you turn to QLLM. With a few simple commands, you're able to:
1. **Summarize the key insights** from the dataset.  
2. **Generate visualizations** to highlight important trends.  
3. **Draft a concise, well-written report**.  

All of this without leaving your terminal. The time you save allows you to focus on higher-level analysis and deliver the report ahead of schedule. Your manager is impressed, and you've just demonstrated the power of QLLM to streamline your workflow.

## Chapter 3: Packages

### 3.1 qllm-lib
A versatile TypeScript library for seamless LLM integration. It simplifies working with different AI models and provides features like templating, streaming, and conversation management.

#### Practical Example
```typescript
import { createLLMProvider } from 'qllm-lib';

async function generateProductDescription() {
    const provider = createLLMProvider({ name: 'openai' });
    const result = await provider.generateChatCompletion({
        messages: [
            {
                role: 'user',
                content: {
                    type: 'text',
                    text: 'Write a compelling product description for a new smartphone with a foldable screen, 5G capability, and 48-hour battery life.'
                },
            },
        ],
        options: { model: 'gpt-4', maxTokens: 200 },
    });
    console.log('Generated Product Description:', result.text);
}

generateProductDescription();
```

### 3.2 qllm-cli
A command-line interface that leverages qllm-lib to provide easy access to LLM capabilities directly from your terminal.

#### Practical Example
```bash
# Generate a product description
qllm ask "Write a 50-word product description for a smart home security camera with night vision and two-way audio."

# Use a specific model for market analysis
qllm ask --model gpt-4o-mini --provider openai "Analyze the potential market impact of electric vehicles in the next 5 years. Provide 3 key points."

# Write a short blog post about the benefits of remote work
qllm ask --model gemma2:2b --provider ollama "Write a short blog post about the benefits of remote work."
```

## Chapter 4: Getting Started

### 4.1 System Requirements
Before we dive into the exciting world of QLLM, let's make sure your system is ready:
- Node.js (version 16.5 or higher)
- npm (usually comes with Node.js)
- A terminal or command prompt
- An internet connection (QLLM needs to talk to the AI, after all!)

### 4.2 Step-by-Step Installation Guide
1. Open your terminal or command prompt.
2. Run the following command:
   ```bash
   npm install -g qllm
   ```
   This command tells npm to install QLLM globally on your system, making it available from any directory.
3. Wait for the installation to complete. You might see a progress bar and some text scrolling by. Don't panic, that's normal!
4. Once it's done, verify the installation by running:
   ```bash
   qllm --version
   ```
   You should see a version number (e.g., 1.8.0) displayed. If you do, congratulations! You've successfully installed QLLM.

> 💡 Pro Tip: If you encounter any permission errors during installation, you might need to use `sudo` on Unix-based systems or run your command prompt as an administrator on Windows.

### 4.3 Configuration
Now that QLLM is installed, let's get it configured. Think of this as teaching QLLM your preferences and giving it the keys to the AI kingdom.

#### Configuring Default Settings
While you're in the configuration mode, you can also set up some default preferences:
1. Choose your default provider and model.
2. Set default values for parameters like temperature and max tokens.
3. Configure other settings like log level and custom prompt directory.

Here's an example of what this might look like:
```bash
$ qllm configure
? Default Provider: openai
? Default Model: gpt-4o-mini
? Temperature (0.0 to 1.0): 0.7
? Max Tokens: 150
? Log Level: info
```

> 💡 Pro Tip: You can always change these settings later, either through the `qllm configure` command or directly in the configuration file located at `~/.qllmrc`.

### 4.4 Your First QLLM Command
Enough setup, let's see QLLM in action! We'll start with a simple query to test the waters.

#### Running a Simple Query
1. In your terminal, type:
   ```bash
   qllm ask "What is the meaning of life, the universe, and everything?"
   ```
2. Press Enter and watch the magic happen!

#### Understanding the Output
QLLM will display the response from the AI. It might look something like this:
```plaintext
Assistant: The phrase "the meaning of life, the universe, and everything" is a reference to Douglas Adams' science fiction series "The Hitchhiker's Guide to the Galaxy." In the story, a supercomputer named Deep Thought is asked to calculate the answer to the "Ultimate Question of Life, the Universe, and Everything." After 7.5 million years of computation, it provides the answer: 42...
```

> 🧠 **Pause and Reflect**: What do you think about this response? How does it compare to what you might have gotten from a simple web search?

## Chapter 5: Core Commands

### 5.1 The 'ask' Command
The `ask` command is your go-to for quick, one-off questions. It's like having a knowledgeable assistant always ready to help.

#### Syntax and Options
```bash
qllm ask "Your question here"
```
- `-p, --provider`: Specify the LLM provider (e.g., openai, anthropic)
- `-m, --model`: Choose a specific model
- `-t, --max-tokens`: Set maximum tokens for the response
- `--temperature`: Adjust output randomness (0.0 to 1.0)

#### Use Cases and Examples
1. Quick fact-checking:
   ```bash
   qllm ask "What year was the first Moon landing?"
   ```
2. Code explanation:
   ```bash
   qllm ask "Explain this Python code: print([x for x in range(10) if x % 2 == 0])"
   ```
3. Language translation:
   ```bash
   qllm ask "Translate 'Hello, world!' to French, Spanish, and Japanese"
   ```

### 5.2 The 'chat' Command
While `ask` is perfect for quick queries, `chat` is where QLLM really shines. It allows you to have multi-turn conversations, maintaining context throughout.

#### Starting and Managing Conversations
To start a chat session:
```bash
qllm chat
```
Once in a chat session, you can use various commands:
- `/help`: Display available commands
- `/new`: Start a new conversation
- `/save`: Save the current conversation

### 5.3 The 'run' Command
The `run` command allows you to execute predefined templates, streamlining complex or repetitive tasks.

#### Using Predefined Templates
To run a template:
```bash
qllm run
```
For example:
```bash
qllm run https://raw.githubusercontent.com/quantalogic/qllm/main/prompts/chain_of_thought_leader.yaml
```

#### Creating Custom Templates
You can create your own templates as YAML files. Here's a simple example:
```yaml
name: "Simple Greeting"
description: "A template that generates a greeting"
input_variables:
  name:
    type: "string"
    description: "The name of the person to greet"
prompt: "Generate a friendly greeting for {{name}}."
```
Save this as `greeting.yaml` and run it with:
```bash
qllm run greeting.yaml
```

> 🧠 **Pause and Reflect**: How could you use custom templates to streamline your workflow? Think about repetitive tasks in your daily work that could benefit from AI assistance.

## Chapter 6: Practical Examples

### 6.1 Code Analysis Workflow
Imagine you're a developer facing code reviews. Let's set up a code review template to streamline this process.

#### Setting up a Code Review Template
Save this as `code_review.yaml`:
```yaml
name: "Code Review"
description: "Analyzes code and provides improvement suggestions"
input_variables:
  code:
    type: "string"
    description: "The code to review"
  language:
    type: "string"
    description: "The programming language"
prompt: >
  You are an experienced software developer. Review the following {{language}} code and provide suggestions for improvement: {{language}} {{code}}
  Please consider:
  1. Code efficiency
  2. Readability
  3. Best practices
  4. Potential bugs
```

### 6.2 Content Creation Pipeline
Let's look at how QLLM can assist in content creation, from ideation to drafting and editing.

#### Ideation Phase
Create a template for brainstorming ideas. Save this as `brainstorm_ideas.yaml`:
```yaml
name: "Content Brainstorming"
description: "Generates content ideas based on a topic and target audience"
input_variables:
  topic:
    type: "string"
    description: "The main topic or theme"
  audience:
    type: "string"
    description: "The target audience"
  content_type:
    type: "string"
    description: "The type of content (e.g., blog post, video script, social media)"
prompt: |
  As a creative content strategist, generate 5 unique content ideas for {{content_type}} about {{topic}} targeted at {{audience}}. For each idea, provide:
  1. A catchy title
  2. A brief description (2-3 sentences)
  3. Key points to cover
  4. Potential challenges or considerations
```

### 6.3 Data Analysis Assistant
Imagine you have a CSV file with sales data. You can use QLLM to help interpret this data:
```bash
cat sales_data.csv | qllm ask "Analyze this CSV data. Provide a summary of total sales, top-selling products, and any notable trends. Format your response as a bulleted list."
```

## Chapter 7: Troubleshooting Common Issues
Even the most powerful tools can sometimes hiccup. Here are some common issues you might encounter with QLLM and how to resolve them:
1. **Rate Limiting**: Implement a retry mechanism with exponential backoff.
2. **Unexpected Output Format**: Be more specific in your prompts.

## Chapter 8: Best Practices
To get the most out of QLLM, keep these best practices in mind:
1. **Effective Prompt Engineering**: Be specific and clear in your prompts.
2. **Managing Conversation Context**: Use `/new` to start fresh conversations when switching topics.
3. **Leveraging Templates for Consistency**: Create templates for tasks you perform regularly.

## Chapter 9: Conclusion and Next Steps
Congratulations! You've now mastered the essentials of QLLM and are well on your way to becoming a CLI AI wizard.

### 9.1 Final Challenge
Within the next 24 hours, use QLLM to solve a real problem you're facing in your work or personal projects. It could be analyzing some data, drafting a document, or even helping debug a tricky piece of code. Share your experience with a colleague or in the QLLM community.

Thank you for joining me on this whirlwind tour of QLLM. Now go forth and command your AI assistant with confidence! 🚀

