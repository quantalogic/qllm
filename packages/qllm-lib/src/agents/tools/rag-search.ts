import { 
    OpenAI,
    Settings,
    SimpleDirectoryReader,
    VectorStoreIndex,
    HuggingFaceEmbedding,
    OpenAIEmbedding,
    HuggingFaceEmbeddingParams
  } from 'llamaindex';
  import { AgentTool } from '../agent-types';
  import { JSONSchemaType } from 'openai/lib/jsonschema';
  
  interface RAGToolConfig {
    query: string;
    topK?: number;
  }
  
  export class RAGTool implements AgentTool {
    name: string;
    description: string;
    parameters: JSONSchemaType = {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The search query to find relevant information'
          },
          topK: {
            type: 'number',
            description: 'Number of top results to return'
          }
        },
        required: ['query']
      };

    private queryEngine: any;
    private config: {
      embedModel: {
        type: 'openai' | 'huggingface';
        options: Record<string, any>;
      };
      similarityTopK: number;
    };
  
    constructor(
      private directory: string, 
      config: {
        embedModel?: {
          type: 'openai' | 'huggingface';
          options: Record<string, any>;
        };
        name?: string;
        description?: string;
        similarityTopK?: number;
      } = {}
    ) {
      this.name = config.name || 'rag_search';
      this.description = config.description || `Search through documents in ${directory} using RAG`;
      
      this.config = {
        embedModel: config.embedModel || {
          type: 'huggingface',
          options: {
            modelType: 'BAAI/bge-small-en-v1.5',
            quantized: false
          }
        },
        similarityTopK: config.similarityTopK || 3
      };
  
      this.parameters = {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The search query to find relevant information'
          },
          topK: {
            type: 'number',
            description: 'Number of top results to return'
          }
        },
        required: ['query']
      } as JSONSchemaType;
    }
  
    async initialize(): Promise<void> {
      if (this.config.embedModel.type === 'openai') {
        Settings.embedModel = new OpenAIEmbedding(this.config.embedModel.options);
      } else {
        // Fix HuggingFace embedding params
        const huggingFaceParams: HuggingFaceEmbeddingParams = {
            modelType: 'BAAI/bge-small-en-v1.5',
            ...this.config.embedModel.options
        };
        Settings.embedModel = new HuggingFaceEmbedding(huggingFaceParams);
      }
  
      const reader = new SimpleDirectoryReader();
      const documents = await reader.loadData(this.directory);
      const index = await VectorStoreIndex.fromDocuments(documents); 
      const retriever = await index.asRetriever({
        similarityTopK: this.config.similarityTopK
      });
      
      this.queryEngine = await index.asQueryEngine({
        retriever
      });
    }
    
  // Fix execute method signature to match AgentTool interface
  async execute(inputs: Record<string, any>): Promise<any> {
    if (!this.queryEngine) {
      await this.initialize();
    }

    const response = await this.queryEngine.query({
      query: inputs.query,
      similarityTopK: inputs.topK || this.config.similarityTopK
    });

    return {
      response: response.response,
      sources: response.sourceNodes.map((node: any) => ({
        content: node.text,
        score: node.score || 0,
        metadata: node.metadata
      }))
    };
  }
  }