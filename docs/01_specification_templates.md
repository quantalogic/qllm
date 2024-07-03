# qllm Template Feature Specification v1.0

## 1. Introduction

### 1.1 Purpose

This document provides a comprehensive specification for the enhanced template feature in qllm, a powerful solution for managing and utilizing prompts across various Language Model (LLM) providers.

### 1.2 Scope

This specification covers the structure, management, sharing, and usage of templates within the qllm ecosystem, including new features such as a template marketplace and cross-platform support.

### 1.3 Definitions

- Template: A pre-defined structure for generating prompts, including input variables, output expectations, and processing instructions.
- LLM: Language Model, referring to AI models capable of generating human-like text based on input prompts.
- qllm: The name of our product, a command-line interface (CLI) tool for managing and using LLM prompts.

## 2. Simplified Template Structure

### 2.1 Basic Template Components

Templates are stored as YAML files with the following simplified structure:

```yaml
name: example_template
version: 1.0.0
description: A template for summarizing text
author: John Doe
provider: anthropic
model: claude-3-haiku-20240307-v1:0

input_variables:
  text: 
    type: string
    description: Input text to summarize
  max_length:
    type: integer
    description: Maximum number of sentences
    default: 3

output_variables:
  summary:
    type: string
    description: The generated summary
  key_points:
    type: array
    description: List of key points

content: |
  Summarize the following text in {{max_length}} sentences:
  {{text}}
  
  Provide your response in the following format:
  <summary>
  [Your summary here]
  </summary>
  
  <key_points>
  - [Key point 1]
  - [Key point 2]
  - [Key point 3]
  </key_points>
```

### 2.2 Advanced Template Options

For more complex use cases, additional options can be specified:

```yaml
name: sentiment_analysis
version: 2.0.0
description: Analyze sentiment of customer reviews
author: Jane Smith
provider: openai
model: gpt-4

input_variables:
  review: 
    type: string
    description: Customer review text
  product_type:
    type: string
    description: Type of product being reviewed
    default: "general"

output_variables:
  sentiment:
    type: string
    description: Overall sentiment (positive, negative, neutral)
  score:
    type: float
    description: Sentiment score from -1 (very negative) to 1 (very positive)
  key_phrases:
    type: array
    description: Important phrases from the review

parameters:
  max_tokens: 150
  temperature: 0.3

output_transformations:
  sentiment:
    - lowercase
  score:
    - round: 2
  key_phrases:
    - unique
    - sort

content: |
  Analyze the sentiment of the following {{product_type}} review:
  "{{review}}"
  
  Provide your response in the following format:
  <sentiment>
  [Overall sentiment]
  </sentiment>
  
  <score>
  [Sentiment score]
  </score>
  
  <key_phrases>
  - [Key phrase 1]
  - [Key phrase 2]
  - [Key phrase 3]
  </key_phrases>

cache_ttl: 1800  # Cache results for 30 minutes

provider_specific:
  openai:
    model: gpt-4
    content: |
      # OpenAI-specific prompt content here
```

## 3. Template Management

### 3.1 Creating Templates

Users can create new templates using an interactive wizard:

```bash
qllm template create
```

Example of using the interactive wizard:

```
$ qllm template create
Template name: product_description
Version: 1.0.0
Description: Generate product descriptions for e-commerce
Author: Your Name
Provider: anthropic
Model: claude-3-opus-20240229

Input variable 1 name: product_name
Input variable 1 type: string
Input variable 1 description: Name of the product

Input variable 2 name: features
Input variable 2 type: array
Input variable 2 description: List of product features

Output variable 1 name: description
Output variable 1 type: string
Output variable 1 description: Generated product description

Enter template content:
Create a compelling product description for {{product_name}} using the following features:
{{#each features}}
- {{this}}
{{/each}}

Provide your response as a single paragraph:
<description>
[Your product description here]
</description>

Template created successfully!
```

### 3.2 Editing Templates

Templates can be edited using the default system editor:

```bash
qllm template edit <template_name>
```

### 3.3 Deleting Templates

Templates can be deleted with a confirmation prompt:

```bash
qllm template delete <template_name>
```

### 3.4 Versioning and History

Templates now support Git-like versioning:

```bash
qllm template version <template_name> --list  # List all versions
qllm template version <template_name> --diff <version1> <version2>  # Compare versions
qllm template version <template_name> --revert <version>  # Revert to a specific version
```

Example of version comparison:

```
$ qllm template version product_description --diff 1.0.0 1.1.0
--- Version 1.0.0
+++ Version 1.1.0
@@ -1,6 +1,7 @@
 name: product_description
-version: 1.0.0
+version: 1.1.0
 description: Generate product descriptions for e-commerce
+author: Your Name
 provider: anthropic
 model: claude-3-opus-20240229

@@ -15,6 +16,10 @@
   description:
     type: string
     description: Generated product description
+  keywords:
+    type: array
+    description: SEO keywords for the product
+
 content: |
   Create a compelling product description for {{product_name}} using the following features:
   {{#each features}}
@@ -24,4 +29,9 @@
   Provide your response as a single paragraph:
   <description>
   [Your product description here]
-  </description>
+  </description>
+
+  Also provide 3-5 SEO keywords:
+  <keywords>
+  - [Keyword 1]
+  - [Keyword 2]
+  </keywords>
```

## 4. Collaboration and Sharing

### 4.1 Team-based Sharing

Teams can collaborate on templates with granular permissions:

```bash
qllm template share <template_name> --team <team_name> --permission <read|write|execute>
```

### 4.2 Public Template Repository

Users can publish templates to a public repository:

```bash
qllm template publish <template_name>
```

And search for public templates:

```bash
qllm template search <keyword>
```

Example of searching for public templates:

```
$ qllm template search "email marketing"
Found 3 templates:

1. email_campaign_generator (v2.1.0)
   Author: MarketingPro
   Description: Generate email marketing campaigns with subject lines and body content
   Rating: 4.7/5 (203 reviews)

2. email_subject_line_optimizer (v1.3.2)
   Author: CopywritingAI
   Description: Optimize email subject lines for higher open rates
   Rating: 4.5/5 (87 reviews)

3. personalized_email_template (v1.0.1)
   Author: CustomerSuccess
   Description: Create personalized email templates based on customer data
   Rating: 4.2/5 (34 reviews)

Use 'qllm template info <template_name>' for more details.
```

### 4.3 Version Control Integration

qllm now integrates with popular version control systems:

```bash
qllm template sync --git <repository_url>
```

This command synchronizes local templates with a Git repository, allowing for seamless collaboration and version tracking.

## 5. Template Marketplace

### 5.1 Browsing and Searching Templates

Users can browse and search the template marketplace:

```bash
qllm marketplace browse
qllm marketplace search <keyword>
```

Example of browsing the marketplace:

```
$ qllm marketplace browse --category "content creation"
Top templates in "Content Creation":

1. blog_post_outline (v3.0.1)
   Author: ContentCreator
   Description: Generate detailed blog post outlines
   Downloads: 15,243

2. social_media_caption_generator (v2.2.0)
   Author: SocialMediaGuru
   Description: Create engaging captions for social media posts
   Downloads: 8,765

3. product_review_writer (v1.5.3)
   Author: EcommerceExpert
   Description: Generate balanced product reviews
   Downloads: 6,432

Use 'qllm marketplace info <template_id>' for more details or to purchase.
```

### 5.2 Installing Templates

Users can purchase and install templates from the marketplace:

```bash
qllm marketplace install <template_id>
```

### 5.3 User Ratings and Reviews

Users can rate and review templates:

```bash
qllm marketplace rate <template_id> --stars <1-5>
qllm marketplace review <template_id> "Your review text here"
```

## 6. Template Usage

### 6.1 Applying Templates

Templates can be applied to generate content:

```bash
qllm apply <template_name> --input "text:Your input text here" --output result.json
```

### 6.2 Template Chaining and Workflows

Complex workflows can be created by chaining multiple templates:

```yaml
name: article_workflow
steps:
  - template: research_template
    output: research_results
  - template: outline_template
    input: 
      research: $research_results.summary
    output: article_outline
  - template: writing_template
    input:
      outline: $article_outline
    output: final_article
```

This workflow can be executed with:

```bash
qllm workflow run article_workflow --input "topic:Artificial Intelligence"
```

Example of executing a workflow:

```
$ qllm workflow run article_workflow --input "topic:Artificial Intelligence in Healthcare"
Executing workflow: article_workflow

Step 1: research_template
Researching "Artificial Intelligence in Healthcare"... Done.

Step 2: outline_template
Generating article outline... Done.

Step 3: writing_template
Writing final article... Done.

Workflow completed successfully. Output saved to: final_article.md
```

### Other examples

This example will demonstrate how to create a comprehensive, well-researched article using multiple templates in a sequential process.

Let's create a workflow for writing an in-depth article about "The Impact of Artificial Intelligence on Healthcare":

```yaml
name: ai_healthcare_article_workflow
description: Generate a comprehensive article on AI in healthcare
version: 1.0.0
author: AI Expert

steps:
  - template: research_template
    input:
      topic: "The Impact of Artificial Intelligence on Healthcare"
      sources: 5
    output: research_results

  - template: outline_template
    input:
      research: $research_results.summary
      key_points: $research_results.key_points
    output: article_outline

  - template: section_writer_template
    input:
      outline: $article_outline
      research: $research_results
    output: article_sections

  - template: conclusion_template
    input:
      article_body: $article_sections
      key_points: $research_results.key_points
    output: conclusion

  - template: introduction_template
    input:
      article_body: $article_sections
      conclusion: $conclusion
    output: introduction

  - template: final_assembly_template
    input:
      introduction: $introduction
      body: $article_sections
      conclusion: $conclusion
    output: final_article

  - template: seo_optimization_template
    input:
      article: $final_article
      target_keywords: ["AI in healthcare", "medical AI applications", "AI diagnosis"]
    output: seo_optimized_article
```

Now, let's break down each step and provide examples of how each template might work:

1. Research Template:
   This template would use an AI model to gather information from reputable sources about AI in healthcare.

   Example output:
   ```json
   {
     "summary": "AI is revolutionizing healthcare through improved diagnostics, personalized treatment plans, and efficient hospital management...",
     "key_points": [
       "AI-powered diagnostic tools",
       "Personalized medicine",
       "Streamlined hospital operations",
       "Ethical considerations",
       "Future trends in AI healthcare"
     ],
     "sources": [
       {"title": "AI in Healthcare: A Comprehensive Overview", "url": "..."},
       {"title": "The Ethics of AI in Medical Decision Making", "url": "..."},
       // ... more sources
     ]
   }
   ```

2. Outline Template:
   This template would create a structured outline based on the research results.

   Example output:
   ```json
   {
     "title": "The Impact of Artificial Intelligence on Healthcare",
     "sections": [
       {"title": "Introduction", "subsections": []},
       {"title": "AI-powered Diagnostic Tools", "subsections": ["Image Recognition", "Predictive Analytics"]},
       {"title": "Personalized Medicine", "subsections": ["Genomic Analysis", "Treatment Optimization"]},
       {"title": "Streamlining Hospital Operations", "subsections": ["Resource Allocation", "Patient Flow Management"]},
       {"title": "Ethical Considerations", "subsections": ["Data Privacy", "Algorithmic Bias"]},
       {"title": "Future Trends", "subsections": ["Integration with IoT", "AI-assisted Surgery"]},
       {"title": "Conclusion", "subsections": []}
     ]
   }
   ```

3. Section Writer Template:
   This template would generate content for each section of the outline, using the research data.

   Example output (partial):
   ```json
   {
     "AI-powered Diagnostic Tools": "Artificial Intelligence is revolutionizing medical diagnostics through advanced image recognition and predictive analytics. In radiology, AI algorithms can analyze medical images with remarkable accuracy, often detecting subtle abnormalities that human radiologists might miss...",
     "Personalized Medicine": "AI is enabling a new era of personalized medicine by analyzing vast amounts of genomic data and patient health records. This allows for tailored treatment plans that consider an individual's genetic makeup, lifestyle, and environmental factors...",
     // ... other sections
   }
   ```

4. Conclusion Template:
   This template would summarize the main points and provide a forward-looking perspective.

   Example output:
   ```json
   {
     "conclusion": "As we've explored, AI is profoundly transforming healthcare, from enhancing diagnostic accuracy to personalizing treatment plans and optimizing hospital operations. While challenges remain, particularly in ethics and data privacy, the potential benefits of AI in healthcare are immense. As technology continues to advance, we can expect AI to play an increasingly central role in improving patient outcomes and revolutionizing the healthcare industry as a whole."
   }
   ```

5. Introduction Template:
   This template would create an engaging introduction based on the article body and conclusion.

   Example output:
   ```json
   {
     "introduction": "In recent years, Artificial Intelligence has emerged as a game-changing force in the healthcare industry. From assisting in complex diagnoses to personalizing treatment plans, AI is revolutionizing how medical professionals approach patient care. This article explores the multifaceted impact of AI on healthcare, examining its current applications, potential future developments, and the ethical considerations that come with this technological revolution."
   }
   ```

6. Final Assembly Template:
   This template would combine all the parts into a cohesive article.

   Example output:
   ```json
   {
     "article": "# The Impact of Artificial Intelligence on Healthcare\n\n[Introduction]\n\n## AI-powered Diagnostic Tools\n[Content for this section]\n\n## Personalized Medicine\n[Content for this section]\n\n...\n\n## Conclusion\n[Conclusion content]"
   }
   ```

7. SEO Optimization Template:
   This final template would optimize the article for search engines.

   Example output:
   ```json
   {
     "seo_optimized_article": "# How AI is Transforming Healthcare: A Comprehensive Look\n\n[SEO-optimized introduction]\n\n## AI in Healthcare: Revolutionary Diagnostic Tools\n[SEO-optimized content]\n\n...\n\n## The Future of Medical AI Applications\n[SEO-optimized conclusion]"
   }
   ```

To execute this workflow:

```bash
qllm workflow run ai_healthcare_article_workflow
```

This command would run each template in sequence, passing the output of each step as input to the next, ultimately producing a comprehensive, well-researched, and SEO-optimized article on the impact of AI in healthcare.

This workflow demonstrates the power of template chaining in qllm, allowing users to create complex, multi-step processes that leverage different AI models and templates for specific tasks, resulting in high-quality, tailored content generation.



## 8. Analytics and Insights

### 8.1 Usage Statistics

View detailed usage statistics for templates:

```bash
qllm stats <template_name> --period <last_7_days|last_30_days|all_time>
```

### 8.2 Performance Metrics

Analyze template performance:

```bash
qllm analyze <template_name> --metric <response_time|token_usage|success_rate>
```

Example of analyzing template performance:

```
$ qllm analyze product_description --metric token_usage
Token Usage Analysis for 'product_description':

Average tokens per request: 127
Total tokens used (last 30 days): 25,400
Estimated cost (last 30 days): $0.51

Token usage trend:
Week 1: 5,200 tokens
Week 2: 6,100 tokens
Week 3: 6,800 tokens
Week 4: 7,300 tokens

Recommendation: Consider optimizing the template to reduce token usage if costs are a concern.
```

### 8.3 AI-powered Optimization Suggestions

Receive AI-generated suggestions for template improvements:

```bash
qllm optimize <template_name>
```

### 10.2 Advanced Output Processing

We plan to implement a scripting language for complex output transformations.

### 10.3 AI-powered Template Generation

Upcoming features will include AI assistance in creating and optimizing templates based on natural language descriptions of desired outcomes.
