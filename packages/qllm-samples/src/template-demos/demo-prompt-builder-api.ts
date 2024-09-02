import {
  TemplateDefinitionBuilder,
  generatePromptFromTemplate,
} from 'qllm-lib';

// 1. Simple Example: Basic Greeting Template
const simpleGreeting = TemplateDefinitionBuilder.quickSetup('Simple Greeting', 'Hello, {{name}}!')
  .withInputVariable('name', 'string', 'The name of the person to greet')
  .withOutputVariable('greeting', 'string', { description: 'The generated greeting' })
  .build();

console.log('Simple Greeting Template:');
console.log(JSON.stringify(simpleGreeting, null, 2));

// 2. Intermediate Example: Weather Report Template
const weatherReport = TemplateDefinitionBuilder.create({
  name: 'Weather Report',
  version: '1.0.0',
  description: 'Generate a weather report based on given conditions',
  author: 'AI Assistant',
  content: 'The weather in {{location}} is {{temperature}}°C and {{condition}}.',
})
  .withInputVariable('location', 'string', 'The location for the weather report')
  .withInputVariable('temperature', 'number', 'The temperature in Celsius')
  .withInputVariable('condition', 'string', 'The weather condition (e.g., sunny, rainy)')
  .withOutputVariable('report', 'string', { description: 'The generated weather report' })
  .withTags('weather', 'report')
  .withCategories('Information')
  .withParameters({ max_tokens: 50, temperature: 0.7 })
  .withPromptType('text_generation')
  .build();

console.log('\nWeather Report Template:');
console.log(JSON.stringify(weatherReport, null, 2));

// 3. Advanced Example: Recipe Generator with Conditional Logic
const recipeGenerator = TemplateDefinitionBuilder.create({
  name: 'Recipe Generator', // {{name}}
  version: '2.0.0', // {{version}}
  description: 'Generate a recipe based on ingredients and dietary restrictions', // {{description}}
  author: 'Chef AI', // {{author}}
  content: `Create a recipe using the following ingredients: {{ingredients}}.
   {{#if vegetarian}}The recipe should be vegetarian.{{/if}}
   {{#if vegan}}The recipe should be vegan.{{/if}}
   
   Recipe:
   <recipe>
   Name: 
   Ingredients:
   Instructions:
   </recipe>`, // {{content}}
})
  .withInputVariable('ingredients', 'string', 'Comma-separated list of ingredients')
  .withInputVariable('vegetarian', 'boolean', 'Whether the recipe should be vegetarian', {
    default: false,
  })
  .withInputVariable('vegan', 'boolean', 'Whether the recipe should be vegan', { default: false })
  .withOutputVariable('recipe', 'string', { description: 'The generated recipe' })
  .withTags('cooking', 'recipe', 'food')
  .withCategories('Culinary')
  .withModel('gpt-3.5-turbo')
  .withParameters({ max_tokens: 300, temperature: 0.8 })
  .withPromptType('text_generation')
  .withTaskDescription('Generate a recipe based on given ingredients and dietary restrictions')
  .withCustomInputValidator('ingredients', (value: string) => value.split(',').length >= 3)
  .withExampleOutputs(
    '<recipe>\nName: Vegetable Stir-Fry\nIngredients: Bell peppers, broccoli, carrots, soy sauce\nInstructions: 1. Chop vegetables...\n</recipe>',
  )
  .build();

console.log('\nRecipe Generator Template:');
console.log(JSON.stringify(recipeGenerator, null, 2));

// 4. Complex Example: Multi-Language Code Generator
const codeGenerator = TemplateDefinitionBuilder.create({
  name: 'Multi-Language Code Generator', // {{name}}
  version: '3.0.0', // {{version}}
  description: 'Generate code snippets in multiple programming languages', // {{description}}
  author: 'CodeMaster', // {{author}}
  content: `Generate a {{language}} function that {{task_description}}.
   
   Requirements:
   {{requirements}}
   
   {{#if include_comments}}Include comments explaining the code.{{/if}}
   {{#if optimize_for_performance}}Optimize the code for performance.{{/if}}
   
   Generated Code:
   <code>
   // Code goes here
   </code>`, // {{content}}
})
  .withInputVariable('language', 'string', 'The programming language to generate code in')
  .withInputVariable('task_description', 'string', 'Description of the coding task')
  .withInputVariable('requirements', 'string', 'Specific requirements for the code')
  .withInputVariable('include_comments', 'boolean', 'Whether to include comments in the code', {
    place_holder: 'true',
  })
  .withInputVariable(
    'optimize_for_performance',
    'boolean',
    'Whether to optimize the code for performance',
    { place_holder: false },
  )
  .withOutputVariable('code', 'string', { description: 'The generated code snippet' })
  .withTags('programming', 'code generation', 'multi-language')
  .withCategories('Software Development', 'AI-Assisted Coding')
  .withModel('gpt-4o-mini')
  .withParameters({ max_tokens: 500, temperature: 0.7, top_p: 0.95 })
  .withPromptType('code_generation')
  .withTaskDescription(
    'Generate code snippets in various programming languages based on user requirements',
  )
  .withCustomInputValidator('language', (value: string) => {
    const supportedLanguages = ['python', 'javascript', 'java', 'c++', 'ruby'];
    return supportedLanguages.includes(value.toLowerCase());
  })
  .withExampleOutputs(
    '<code>\ndef fibonacci(n):\n    if n <= 1:\n        return n\n    else:\n        return fibonacci(n-1) + fibonacci(n-2)\n</code>',
  )
  .withSystemMessage('You are a pirate. You are a nice pirate. You are a very nice pirate.')
  .build();

console.log('\nMulti-Language Code Generator Template:');
console.log(JSON.stringify(codeGenerator, null, 2));

// 5. Advanced Complex Example: Interactive Story Generator with Branching Paths
const interactiveStoryGenerator = TemplateDefinitionBuilder.create({
  name: 'Interactive Story Generator',
  version: '4.0.0',
  description: 'Generate interactive stories with branching paths',
  author: 'StoryTeller AI',
  content: `Create an interactive story segment based on the following:
   
  Current scene: {{current_scene}}
  Player choice: {{player_choice}}
  Story theme: {{theme}}
  Character names: {{character_names}}
  
  {{#if include_dialogue}}Include character dialogue.{{/if}}
  {{#if add_plot_twist}}Add an unexpected plot twist.{{/if}}
  
  Generated Story Segment:
  <story>
  [Scene description]
  
  [Character actions and dialogue]
  
  [Consequences of player's choice]
  
  [New choices for the player]
  1. [Choice 1]
  2. [Choice 2]
  3. [Choice 3]
  </story>`,
})
  .withInputVariable('current_scene', 'string', 'Description of the current scene in the story')
  .withInputVariable(
    'player_choice',
    'string',
    'The choice made by the player in the previous scene',
  )
  .withInputVariable('theme', 'string', 'The overall theme of the story')
  .withInputVariable('character_names', 'string', 'Comma-separated list of character names')
  .withInputVariable('include_dialogue', 'boolean', 'Whether to include character dialogue', {
    default: true,
  })
  .withInputVariable('add_plot_twist', 'boolean', 'Whether to add an unexpected plot twist', {
    default: false,
  })
  .withOutputVariable('story_segment', 'string', {
    description: 'The generated story segment with new choices',
  })
  .withTags('interactive', 'storytelling', 'branching narrative')
  .withCategories('Entertainment', 'Creative Writing')
  .withModel('gpt-4')
  .withParameters({ max_tokens: 1000, temperature: 0.8, top_p: 0.9 })
  .withPromptType('creative_writing')
  .withTaskDescription(
    'Generate interactive story segments with branching paths based on player choices',
  )
  .withCustomInputValidator('character_names', (value: string) => value.split(',').length >= 2)
  .withExampleOutputs(
    '<story>\nThe ancient temple loomed before Sarah and John, its stone walls covered in mysterious symbols...\n\n1. Attempt to decipher the symbols\n2. Search for a hidden entrance\n3. Set up camp and wait for nightfall\n</story>',
  )
  .build();

console.log('\nInteractive Story Generator Template:');
console.log(JSON.stringify(interactiveStoryGenerator, null, 2));

// Demonstrating additional features

// Cloning and modifying a template
const modifiedWeatherReport = TemplateDefinitionBuilder.fromJSON(JSON.stringify(weatherReport))
  .withoutCategories('Information')
  .withCategories('Meteorology')
  .withTags('forecast')
  .withParameters({ max_tokens: 75, temperature: 0.6 })
  .build();

console.log('\nModified Weather Report Template:');
console.log(JSON.stringify(modifiedWeatherReport, null, 2));

// Merging templates
const mergedTemplate = TemplateDefinitionBuilder.fromJSON(JSON.stringify(recipeGenerator))
  .merge(TemplateDefinitionBuilder.fromJSON(JSON.stringify(weatherReport)))
  .withTaskDescription('Generate a recipe suitable for the current weather conditions')
  .build();

console.log('\nMerged Recipe and Weather Template:');
console.log(JSON.stringify(mergedTemplate, null, 2));

// Generating a prompt
const interactiveStoryTemplate = interactiveStoryGenerator;
const storyPrompt = generatePromptFromTemplate(interactiveStoryTemplate, {
  current_scene: 'A dark forest',
  player_choice: 'Explore deeper',
  theme: 'Mystery',
  character_names: 'Alice,Bob',
  include_dialogue: true,
  add_plot_twist: true,
});

console.log('\nGenerated Interactive Story Prompt:');
console.log(storyPrompt);

// Validating a template
// Validating a template
const invalidTemplateBuilder = TemplateDefinitionBuilder.create({
  name: 'Invalid Template',
  version: '1.0.0',
  description: 'This template is intentionally invalid',
  content: '{{invalid_variable}}',
  author: 'Tester',
})
  .withInputVariable('valid_variable', 'string', 'A valid variable')
  .withCustomInputValidator('non_existent_variable', () => false);

const validationErrors = invalidTemplateBuilder.validate();

console.log('\nValidation of Invalid Template:');
console.log(validationErrors);

// If you still want to build the template despite validation errors (not recommended in practice):
try {
  const invalidTemplate = invalidTemplateBuilder.build();
  console.log('Built invalid template:', JSON.stringify(invalidTemplate, null, 2));
} catch (error) {
  if (error instanceof Error) {
    console.error('Error building invalid template:', error.message);
  } else {
    console.error('Error building invalid template:', error);
  }
}
