import { createLLMProvider } from "qllm-lib";
import {
  TemplateDefinitionBuilder,
  WorkflowManager,
  WorkflowDefinition,
} from "qllm-lib";

async function main(): Promise<void> {
  // Story Generator Template
  const storyGeneratorTemplate = TemplateDefinitionBuilder.create({
    name: "📖 AI Story Generator",
    version: "1.0.0",
    description: "Create compelling stories with rich narratives",
    author: "🤖 StorytellerAI",
    content: `
    ## Story Parameters
    Genre: {{genre}}
    Theme: {{theme}}
    Length: {{word_count}} words
    Target Audience: {{target_audience}}

    ## Story Elements Requirements
    - Develop complex characters
    - Create engaging plot arcs
    - Build immersive settings
    - Include meaningful dialogue
    - Maintain consistent narrative voice

    ## Always include the Output in Format:

    <story_structure>
    [Plot outline and story beats]
    </story_structure>

    <story>
    [Complete story text]
    </story>

    <story_elements>
    [List of characters, settings, and major plot points]
    </story_elements>

    END.
    `,
  })
  .withInputVariable("genre", "string", "📚 Story genre")
  .withInputVariable("theme", "string", "🎭 Central theme")
  .withInputVariable("word_count", "string", "📏 Target word count")
  .withInputVariable("target_audience", "string", "👥 Intended audience")
  .withOutputVariable("story", "string", {
    description: "📝 Generated story content"
  })
  .withOutputVariable("story_elements", "string", {
    description: "🎬 Key story elements"
  })
  .withModel("gpt-4")
  .withParameters({
    max_tokens: 2500,
    temperature: 0.7,
    top_p: 0.95,
    presence_penalty: 0.3,
    frequency_penalty: 0.3,
  })
  .build();

  // Scene Visualizer Template
  const sceneVisualizerTemplate = TemplateDefinitionBuilder.create({
    name: "🎨 Scene Visualization Generator",
    version: "1.0.0",
    description: "Transform story scenes into vivid visual descriptions",
    author: "🤖 VisualizerAI",
    content: `
    ## Scene Input
    <source_scene>
    {{scene_text}}
    </source_scene>

    Style: {{visual_style}}
    Mood: {{atmospheric_mood}}

    ## Visualization Requirements
    - Create detailed visual descriptions
    - Include sensory details
    - Describe lighting and atmosphere
    - Capture character appearances
    - Detail environmental elements

    ## Always include the Output in Format:

    <visualization>
    [Detailed scene visualization]
    </visualization>

    <mood_elements>
    [Atmospheric and emotional elements]
    </mood_elements>

    <cinematic_elements>
    [Camera angles and visual direction suggestions]
    </cinematic_elements>

    END.
    `,
  })
  .withInputVariable("scene_text", "string", "📝 Scene to visualize")
  .withInputVariable("visual_style", "string", "🎨 Visual style preference")
  .withInputVariable("atmospheric_mood", "string", "🌟 Desired mood")
  .withOutputVariable("visualization", "string", {
    description: "🎬 Visual scene description"
  })
  .withOutputVariable("cinematic_elements", "string", {
    description: "🎥 Cinematic suggestions"
  })
  .withModel("gpt-4")
  .withParameters({
    max_tokens: 2000,
    temperature: 0.6,
    top_p: 0.95,
    presence_penalty: 0.2,
    frequency_penalty: 0.2,
  })
  .build();

  // Create providers
  const providers = {
    openai: createLLMProvider({
      name: "openai",
      apiKey: process.env.OPENAI_API_KEY
    })
  };

  // Initialize workflow manager
  const workflowManager = new WorkflowManager(providers);

  // Define the workflow
  const workflowDefinition: WorkflowDefinition = {
    name: "creative_writing_workflow",
    description: "Generate and visualize creative stories",
    defaultProvider: "openai",
    steps: [
      {
        template: storyGeneratorTemplate,
        provider: "openai",
        input: {
          genre: "{{genre}}",
          theme: "{{theme}}",
          word_count: "{{word_count}}",
          target_audience: "{{target_audience}}"
        },
        output: {
          story: "generated_story",
          story_elements: "story_elements"
        }
      },
      {
        template: sceneVisualizerTemplate,
        provider: "openai",
        input: {
          scene_text: "$generated_story",
          visual_style: "{{visual_style}}",
          atmospheric_mood: "{{atmospheric_mood}}"
        },
        output: {
          visualization: "scene_visualization",
          cinematic_elements: "cinematic_notes"
        }
      }
    ]
  };

  try {
    await workflowManager.loadWorkflow(workflowDefinition);
    console.log("\n✅ Workflow loaded successfully");

    const workflowInput = {
      genre: "Science Fiction",
      theme: "Artificial Intelligence and Human Connection",
      word_count: "1000",
      target_audience: "Young Adult",
      visual_style: "Cyberpunk Noir",
      atmospheric_mood: "Mysterious and Contemplative"
    };

    const result = await workflowManager.runWorkflow(
      "creative_writing_workflow",
      workflowInput,
      {
        onStepStart: (step, index) => {
          console.log(`\n🔍 Starting step ${index + 1}: ${step?.template?.name}`);
        },
        onStepComplete: (step, index, result) => {
          console.log(`\n✅ Completed step ${index + 1}: ${step?.template?.name}`);
          console.log(`Result for step ${index + 1}:`, result);
        }
      }
    );

    console.log("\n🎉 Workflow completed successfully");
    console.log("\nFinal Results:", JSON.stringify(result, null, 2));

  } catch (error) {
    console.error("\n❌ Error:", error);
    throw error;
  }
}

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection:', reason);
});

main().catch((error) => {
  console.error("\n💥 Fatal Error:", error);
  process.exit(1);
});