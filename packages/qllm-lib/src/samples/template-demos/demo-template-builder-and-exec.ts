import { createLLMProvider } from '../..';
import { TemplateDefinition, TemplateDefinitionBuilder, TemplateExecutor } from '../../templates';

async function main(): Promise<void> {
  const codeGenerator = TemplateDefinitionBuilder.create({
    name: '🌈 Multi-Language Code Generator',
    version: '3.0.0',
    description: '🚀 Generate code snippets in various programming languages',
    author: '🤖 CodeMaster AI',
    content: `
    Generate a {{language}} code snippet that accomplishes the following task:
    {{task_description}}    
    Requirements:
    {{requirements}}
    Important: Wrap the generated code in an XML tag named <code></code>.
    Generated Code:
    `,
  })
    .withInputVariable('language', 'string', '🗣️ The programming language to generate code in')
    .withInputVariable('task_description', 'string', '📝 Description of the coding task')
    .withInputVariable('requirements', 'string', '📋 Specific requirements for the code')
    .withOutputVariable('code', 'string', { description: '💻 The generated code snippet' })
    .withTags('💡 programming', '🔧 code generation', '🌐 multi-language')
    .withCategories('🖥️ Software Development', '🤖 AI-Assisted Coding')
    .withModel('gpt-4o-mini')
    .withParameters({ max_tokens: 1200, temperature: 0.7, top_p: 0.95 })
    .withPromptType('🧠 code_generation')
    .withTaskDescription(
      '🎯 Generate code snippets in various programming languages based on user requirements',
    )
    .withExampleOutputs(
      `
  <code>
  def fibonacci(n):
      if n <= 1:
          return n
      else:
          return fibonacci(n-1) + fibonacci(n-2)
  </code>
  `,
    )
    .build();

  console.log('🏗️ Generated Template:');
  console.log(codeGenerator);

  const result = await executeTempate(codeGenerator);
  console.log('🎉 Template execution result:');
  console.log(result);
}

async function executeTempate(templateDefinition: TemplateDefinition) {
  // Execute the template
  const provider = createLLMProvider({ name: 'openai' });
  const templateExecutor = new TemplateExecutor();
  const executionResult = templateExecutor.execute({
    template: templateDefinition,
    provider: provider,
    variables: {
      language: 'Python',
      task_description: '🐍 Generate a snake game',
      requirements: '🍎 The game should have a snake that moves around the screen and eats food',
    },
  });
  return (await executionResult).outputVariables.code;
}

main()
  .then((result) => {
    console.log('✅ Finished running the template builder.');
  })
  .catch((err) => {
    console.error('❌ An error occurred while running the template builder:', err);
  });
