import { createLLMProvider } from "qllm-lib";
import {
  TemplateDefinitionBuilder,
  WorkflowManager,
  WorkflowDefinition,
} from "qllm-lib";

async function main(): Promise<void> {
  console.log("\n🔍 Debug - Starting template definitions");

  // 1. Research Analyzer Template
  const researchAnalyzerTemplate = TemplateDefinitionBuilder.create({
    name: "🔬 Advanced Research Analyzer",
    version: "2.0.0",
    description: "Analyze and synthesize complex research topics",
    author: "🤖 ResearchAI",
    content: `
    ## Research Analysis Configuration
    Topic: {{research_topic}}
    Depth Level: {{analysis_depth}}
    Focus Areas: {{focus_areas}}

    ## Analysis Requirements
    <methodology>
    - Systematic literature review
    - Meta-analysis approach
    - Critical evaluation framework
    - Gap identification protocol
    </methodology>

    ## Always include the Output in Format:
    <analysis>
    [Structured analysis of main research analysis]
    </analysis>

    <gaps>
    [Identified gaps and opportunities]
    </gaps>

    <synthesis>
    [Synthesized insights and patterns]
    </synthesis>

    END.
    `,
  })
  .withInputVariable(
    "research_topic",
    "string",
    "🔬 Topic to be researched and analyzed"
  )
  .withInputVariable(
    "analysis_depth",
    "string",
    "📊 Depth level of analysis (Basic, Intermediate, Advanced)"
  )
  .withInputVariable(
    "focus_areas",
    "string",
    "🎯 Specific areas to focus the research on"
  )
  .withOutputVariable("analysis", "string", {
    description: "📝 Research analysis and analysis"
  })
  .withOutputVariable("gaps", "string", {
    description: "🔍 Identified research gaps"
  })
  .withOutputVariable("synthesis", "string", {
    description: "🔄 Synthesized research insights"
  })
  .withModel("gpt-4")
  .withParameters({
    max_tokens: 2000,
    temperature: 0.3,
    top_p: 0.95,
    presence_penalty: 0.1,
    frequency_penalty: 0.1,
  })
  .build();

  // 2. Content Generator Template
  const contentGeneratorTemplate = TemplateDefinitionBuilder.create({
    name: "📝 Expert Content Generator",
    version: "2.0.0",
    description: "Generate comprehensive content based on research analysis",
    author: "🤖 ContentAI",
    content: `
    ## Content Generation Parameters
    Research Input: {{analysis}}
    Target Audience: {{audience_type}}
    Content Style: {{content_style}}

    ## Content Structure Requirements
    ## Always include the Output in Format:

    <content>
    [Generated content following academic standards]
    </content>

    <visual_suggestions>
    [Suggested diagrams and illustrations]
    </visual_suggestions>

    END.
    `,
  })
  .withInputVariable(
    "analysis",
    "string",
    "📚 Research analysis to base content on"
  )
  .withInputVariable(
    "audience_type",
    "string",
    "👥 Target audience for the content"
  )
  .withInputVariable(
    "content_style",
    "string",
    "✍️ Desired content style (Academic, Technical, Popular)"
  )
  .withOutputVariable("content", "string", {
    description: "📄 Generated content"
  })
  .withOutputVariable("visual_suggestions", "string", {
    description: "🎨 Suggested visual elements"
  })
  .withModel("gpt-4")
  .withParameters({
    max_tokens: 2500,
    temperature: 0.4,
    top_p: 0.95,
    presence_penalty: 0.2,
    frequency_penalty: 0.2,
  })
  .build();

  // 3. Visualization Template
  const visualizationTemplate = TemplateDefinitionBuilder.create({
    name: "🎨 Data Visualization Generator",
    version: "2.0.0",
    description: "Create detailed visual representations",
    author: "🤖 VisualizerAI",
    content: `
    ## Visualization Parameters
    Content Input: {{content_input}}
    Visual Style: {{visualization_style}}
    
    ## Always include the Output in Format:
    <diagrams>
    [Mermaid diagram specifications]
    </diagrams>

    <charts>
    [Chart recommendations and structures]
    </charts>

    END.
    `,
  })
  .withInputVariable(
    "content_input",
    "string",
    "📝 Content to visualize"
  )
  .withInputVariable(
    "visualization_style",
    "string",
    "🎨 Style of visualization (Technical, Conceptual, Simplified)"
  )
  .withOutputVariable("diagrams", "string", {
    description: "📊 Generated diagram specifications"
  })
  .withOutputVariable("charts", "string", {
    description: "📈 Generated chart specifications"
  })
  .withModel("gpt-4")
  .withParameters({
    max_tokens: 1500,
    temperature: 0.3,
    top_p: 0.95,
    presence_penalty: 0.1,
    frequency_penalty: 0.1,
  })
  .build();

  // 4. Expert Review Template
  const expertReviewTemplate = TemplateDefinitionBuilder.create({
    name: "👨‍🏫 Expert Review System",
    version: "2.0.0",
    description: "Comprehensive expert review and recommendations",
    author: "🤖 ReviewAI",
    content: `
    ## Review Parameters
    Content: {{content_to_review}}
    Visualizations: {{visualizations}}
    
    ## Review Requirements
    ## Always include the Output in Format:
    
    <analysis>
    [Detailed expert analysis]
    </analysis>

    <recommendations>
    [Specific improvement recommendations]
    </recommendations>

    END.
    `,
  })
  .withInputVariable(
    "content_to_review",
    "string",
    "📄 Content for expert review"
  )
  .withInputVariable(
    "visualizations",
    "string",
    "🎨 Visualizations to review"
  )
  .withOutputVariable("analysis", "string", {
    description: "🔍 Expert analysis results"
  })
  .withOutputVariable("recommendations", "string", {
    description: "💡 Improvement recommendations"
  })
  .withModel("gpt-4")
  .withParameters({
    max_tokens: 2000,
    temperature: 0.4,
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
    name: "advanced_research_workflow",
    description: "Comprehensive research analysis and content generation workflow",
    defaultProvider: "openai",
    steps: [
      {
        template: researchAnalyzerTemplate,
        provider: "openai",
        input: {
          research_topic: "{{topic}}",
          analysis_depth: "{{depth}}",
          focus_areas: "{{areas}}"
        },
        output: {
          analysis: "analysis",
          gaps: "research_gaps",
          synthesis: "synthesis"
        }
      },
      {
        template: contentGeneratorTemplate,
        provider: "openai",
        input: {
          analysis: "$synthesis",
          audience_type: "{{audience}}",
          content_style: "{{style}}"
        },
        output: {
          content: "generated_content",
          visual_suggestions: "visual_elements"
        }
      },
      {
        template: visualizationTemplate,
        provider: "openai",
        input: {
          content_input: "$generated_content",
          visualization_style: "{{viz_style}}"
        },
        output: {
          diagrams: "generated_diagrams",
          charts: "generated_charts"
        }
      },
      {
        template: expertReviewTemplate,
        provider: "openai",
        input: {
          content_to_review: "$generated_content",
          visualizations: "$generated_diagrams"
        },
        output: {
          analysis: "expert_analysis",
          recommendations: "final_recommendations"
        }
      }
    ]
  };

  try {
    // Load workflow
    await workflowManager.loadWorkflow(workflowDefinition);
    console.log("\n✅ Workflow loaded successfully");

    // Define input variables
    const workflowInput = {
      topic: "Quantum Computing Applications in Machine Learning",
      depth: "Advanced",
      areas: "Algorithm Development, Error Correction, Implementation Challenges",
      audience: "Technical Researchers",
      style: "Academic",
      viz_style: "Technical"
    };

    // Execute workflow with progress tracking
    const result = await workflowManager.runWorkflow(
      "advanced_research_workflow",
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
│ ${JSON.stringify(result, null, 2).split('\n').map(line => ' ' + line).join('\n')}
└────────────────────────────────────────`);
        },
        onStreamChunk: (chunk) => {
          process.stdout.write(` ${chunk}`);
        }
      }
    );

    console.log(`
┌────────────────────────────────────────
│ 🎉 Workflow Completed Successfully
│
│ Final Results:
│ ${JSON.stringify(result, null, 2).split('\n').map(line => ' ' + line).join('\n')}
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