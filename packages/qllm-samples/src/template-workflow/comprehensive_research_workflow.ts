import { createLLMProvider } from "qllm-lib";
import {
  TemplateDefinitionBuilder,
  WorkflowManager,
  WorkflowDefinition,
} from "qllm-lib";

async function main(): Promise<void> {
  console.log("\n🔍 Debug - Starting template definitions");

  // 1. Research Topic Analysis Template
  const researchTopicTemplate = TemplateDefinitionBuilder.create({
    name: "🔬 Research Topic Analyzer",
    version: "1.0.0",
    description: "Analyze research topics and identify key areas",
    author: "🤖 ResearchAI",
    content: `
    ## Research Topic Analysis
    Topic: {{topic}}
    Depth: {{depth}}
    Focus Areas: {{focus_areas}}

    ## Analysis Requirements
    - Current state of research
    - Key challenges and opportunities
    - Future research directions
    - Practical applications

    ## Always include the Output in Format:

    <analysis>
    [Comprehensive analysis of the topic]
    </analysis>

    <key_points>
    [Key findings and insights]
    </key_points>

    END.
    `,
  })
  .withInputVariable("topic", "string", "🔬 Research topic")
  .withInputVariable("depth", "string", "📊 Analysis depth")
  .withInputVariable("focus_areas", "string", "🎯 Areas to focus on")
  .withOutputVariable("analysis", "string", {
    description: "📝 Research analysis"
  })
  .withOutputVariable("key_points", "string", {
    description: "🔑 Key findings"
  })
  .withTags("🔬 research", "📊 analysis")
  .withCategories("📚 Research", "🤖 AI-Analysis")
  .withModel("gpt-4")
  .withParameters({
    max_tokens: 2000,
    temperature: 0.3,
    top_p: 0.95,
    presence_penalty: 0.1,
    frequency_penalty: 0.1,
  })
  .build();

  // 2. Learning Article Generator Template
  const learningArticleTemplate = TemplateDefinitionBuilder.create({
    name: "📚 Learning Guide Generator",
    version: "1.0.0",
    description: "Generate comprehensive learning content",
    author: "🤖 LearningAI",
    content: `
    ## Content Generation Parameters
    Research Analysis: {{research_analysis}}
    Target Audience: {{audience}}
    Word Count: {{word_count}}
    Style: {{style}}

    ## Always include the Output in Format:
    <article>
    [Generated learning content]
    </article>

    <summary>
    [Key learning points]
    </summary>

    END.
    `,
  })
  .withInputVariable("research_analysis", "string", "📝 Research analysis")
  .withInputVariable("audience", "string", "👥 Target audience")
  .withInputVariable("word_count", "string", "📏 Word count")
  .withInputVariable("style", "string", "✍️ Writing style")
  .withOutputVariable("article", "string", {
    description: "📄 Generated article"
  })
  .withOutputVariable("summary", "string", {
    description: "📋 Content summary"
  })
  .withTags("📚 education", "✍️ content")
  .withModel("gpt-4")
  .withParameters({
    max_tokens: 2500,
    temperature: 0.4,
  })
  .build();

  // 3. Visualization Generator Template
  const visualizationTemplate = TemplateDefinitionBuilder.create({
    name: "🎨 Visualization Generator",
    version: "1.0.0",
    description: "Generate visual representations",
    author: "🤖 VisualizerAI",
    content: `
    ## Visualization Parameters
    Content: {{content}}
    Style: {{viz_style}}

    ## Always include the Output in Format:
    <diagrams>
    \`\`\`mermaid
    [Generated diagrams]
    \`\`\`
    </diagrams>

    <charts>
    [Chart specifications]
    </charts>

    END.
    `,
  })
  .withInputVariable("content", "string", "📝 Content to visualize")
  .withInputVariable("viz_style", "string", "🎨 Visualization style")
  .withOutputVariable("diagrams", "string", {
    description: "📊 Generated diagrams"
  })
  .withOutputVariable("charts", "string", {
    description: "📈 Generated charts"
  })
  .withTags("🎨 visualization", "📊 diagrams")
  .withModel("gpt-4")
  .withParameters({
    max_tokens: 1500,
    temperature: 0.3,
  })
  .build();

  // 4. Language Translator Template
  const languageTranslatorTemplate = TemplateDefinitionBuilder.create({
    name: "🌐 Universal Translator",
    version: "1.0.0",
    description: "Translate content with context awareness",
    author: "🤖 TranslatorAI",
    content: `
    ## Translation Parameters
    Content: {{content}}
    Source Language: {{source_language}}
    Target Language: {{target_language}}

    ## Always include the Output in Format:
    <translation>
    [Translated content]
    </translation>

    END.
    `,
  })
  .withInputVariable("content", "string", "📝 Content to translate")
  .withInputVariable("source_language", "string", "🔤 Source language")
  .withInputVariable("target_language", "string", "🎯 Target language")
  .withOutputVariable("translation", "string", {
    description: "🔄 Translated content"
  })
  .withTags("🌐 translation", "🔤 language")
  .withModel("gpt-4")
  .withParameters({
    max_tokens: 2000,
    temperature: 0.3,
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

  // Define workflow
  const workflowDefinition: WorkflowDefinition = {
    name: "advanced_learning_workflow",
    description: "Generate and translate learning content with visualizations",
    defaultProvider: "openai",
    steps: [
      {
        template: researchTopicTemplate,
        provider: "openai",
        input: {
          topic: "{{topic}}",
          depth: "{{depth}}",
          focus_areas: "{{focus_areas}}"
        },
        output: {
          analysis: "research_analysis",
          key_points: "research_key_points"
        }
      },
      {
        template: learningArticleTemplate,
        provider: "openai",
        input: {
          research_analysis: "$research_analysis",
          audience: "{{audience}}",
          word_count: "{{word_count}}",
          style: "{{style}}"
        },
        output: {
          article: "learning_article",
          summary: "article_summary"
        }
      },
      {
        template: visualizationTemplate,
        provider: "openai",
        input: {
          content: "$learning_article",
          viz_style: "{{viz_style}}"
        },
        output: {
          diagrams: "content_diagrams",
          charts: "content_charts"
        }
      },
      {
        template: languageTranslatorTemplate,
        provider: "openai",
        input: {
          content: "$learning_article",
          source_language: "{{source_language}}",
          target_language: "{{target_language}}"
        },
        output: {
          translation: "translated_content"
        }
      }
    ]
  };

  try {
    await workflowManager.loadWorkflow(workflowDefinition);
    console.log("\n✅ Workflow loaded successfully");

    const workflowInput = {
      topic: "Advanced TypeScript Patterns",
      depth: "Advanced",
      focus_areas: "Design Patterns, Performance Optimization, Type Safety",
      audience: "Senior Developers",
      word_count: "2000",
      style: "Technical",
      viz_style: "Technical",
      source_language: "English",
      target_language: "French"
    };

    const result = await workflowManager.runWorkflow(
      "advanced_learning_workflow",
      workflowInput,
      {
        onStepStart: (step, index) => {
          console.log(`
┌────────────────────────────────────────
│ 🚀 Starting Step ${index + 1}: ${step.template.name}
└────────────────────────────────────────`);
        },
        onStepComplete: (step, index, result) => {
          console.log(`
┌────────────────────────────────────────
│ ✅ Completed Step ${index + 1}: ${step.template.name}
│
│ Results:
│ ${JSON.stringify(result, null, 2).split('\n').map(line => '│   ' + line).join('\n')}
└────────────────────────────────────────`);
        }
      }
    );

    console.log(`
┌────────────────────────────────────────
│ 🎉 Workflow Completed Successfully
│
│ Final Results:
│ ${JSON.stringify(result, null, 2).split('\n').map(line => '│   ' + line).join('\n')}
└────────────────────────────────────────`);

  } catch (error) {
    console.error(`
┌────────────────────────────────────────
│ ❌ Error in Workflow:
│ ${error}
└────────────────────────────────────────`);
    throw error;
  }
}

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection:', reason);
});

// Run the main function
main().catch((error) => {
  console.error("\n💥 Fatal Error:", error);
  process.exit(1);
});