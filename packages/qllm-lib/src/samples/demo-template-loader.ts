import * as path from 'path';
import { TemplateLoader } from '../templates/template-loader';
import { TemplateDefinition } from '../templates';

async function loadChainOfThoughtLeaderTemplate(): Promise<TemplateDefinition> {
  try {
    const templateLoader = new TemplateLoader();
    const filePath = path.resolve(__dirname, './prompts/chain_of_tought_leader.yaml');
    
    const templateDefinition = await TemplateLoader.load(filePath);
    
    console.log('Successfully loaded template:');
    console.log(templateDefinition);
    
    return templateDefinition;
  } catch (error) {
    console.error('Error loading template:', error);
    throw error;
  }
}

// Execute the function
loadChainOfThoughtLeaderTemplate()
  .then(() => console.log('Template loading complete'))
  .catch((error) => console.error('Template loading failed:', error));