/**
 * @fileoverview RAG (Retrieval Augmented Generation) Tool
 * This module provides functionality for semantic search and retrieval across documents.
 */

import { 
  OpenAI,
  Settings,
  SimpleDirectoryReader,
  VectorStoreIndex,
  HuggingFaceEmbedding,
  OpenAIEmbedding,
  HuggingFaceEmbeddingParams
} from 'llamaindex';
import { BaseTool, ToolDefinition } from './base-tool';

/**
 * @class RAGTool
 * @extends BaseTool
 * @description A tool for performing semantic search across documents using RAG
 */
export class RAGToolWithEmbedding extends BaseTool {
  private queryEngine: any;
  private initialized: boolean = false;
  private initializationPromise: Promise<void> | null = null;

  /**
   * @constructor
   * @param {Record<string, any>} config - Tool configuration options
   */
  constructor(config: Record<string, any> = {}) {
    super(config);
  }

  /**
   * @method getDefinition
   * @returns {ToolDefinition} Tool definition object
   */
  getDefinition(): ToolDefinition {
    return {
      name: 'rag-search',
      description: 'Search through documents using RAG with configurable embedding model',
      input: {
        directory: {
          type: 'string',
          required: true,
          description: 'Directory path containing documents to search'
        },
        query: {
          type: 'string',
          required: true,
          description: 'The search query to find relevant information'
        },
        provider: {
          type: 'string',
          required: true,
          description: 'Embedding model type (openai or huggingface:model-name)'
        },
        embedModel: {
          type: 'string',
          required: true,
          description: 'Embedding model type (openai or huggingface:model-name)'
        },
        topK: {
          type: 'string',
          required: false,
          description: 'Number of top results to return (default: 3)'
        }
      },
      output: {
        type: 'object',
        description: 'Search results with relevant document excerpts'
      }
    };
  }

  /**
   * @method parseEmbedModel
   * @private
   * @param {string} embedModelString - String representation of embed model
   * @returns {Object} Parsed embed model configuration
   */
  private parseEmbedModel(provider: string): { type: 'openai' | 'huggingface', options: Record<string, any> } {
    if (provider.toLowerCase() === 'openai') {
      return {
        type: 'openai',
        options: {
          modelType: 'text-embedding-ada-002',
        }
      };
    }

    if (provider.toLowerCase().startsWith('huggingface:')) {
      const modelName = provider.split(':')[1];
      return {
        type: 'huggingface',
        options: {
          modelType: modelName || 'BAAI/bge-small-en-v1.5',
          quantized: false
        }
      };
    }

    // Default to huggingface with bge-small if invalid input
    return {
      type: 'huggingface',
      options: {
        modelType: 'BAAI/bge-small-en-v1.5',
        quantized: false
      }
    };
  }

  private async initialize(directory: string, embedModelString: string): Promise<void> {
    try {
      const embedModel = this.parseEmbedModel(embedModelString);

      if (embedModel.type === 'openai') {
        Settings.embedModel = new OpenAIEmbedding(embedModel.options);
      } else {
        Settings.embedModel = new HuggingFaceEmbedding(embedModel.options);
      }

      const reader = new SimpleDirectoryReader();
      const documents = await reader.loadData(JSON.parse(directory));
      
      if (!documents || documents.length === 0) {
        throw new Error('No documents found in directory');
      }

      const index = await VectorStoreIndex.fromDocuments(documents);
      const retriever = await index.asRetriever({
        similarityTopK: 3
      });
      
      this.queryEngine = await index.asQueryEngine({
        retriever
      });
    } catch (error) {
      this.initialized = false;
      this.initializationPromise = null;
      throw new Error(`Failed to initialize RAG tool: ${error}`);
    }
  }

  /**
   * @method execute
   * @async
   * @param {Record<string, any>} inputs - Input parameters
   * @returns {Promise<any>} Search results
   */
  async execute(inputs: Record<string, any>): Promise<any> {
    try {
      // Reset initialization when directory or embed model changes
      this.initialized = false;
      await this.initialize(inputs.directory, inputs.embedModel);

      const topK = parseInt(inputs.topK || '3', 10);

      const response = await this.queryEngine.query({
        query: inputs.query,
        similarityTopK: topK
      });

      if (!response || !response.response) {
        return {
          success: false,
          error: 'No relevant information found',
          response: null
        };
      }

      return {
        success: true,
        response: response.response,
        sources: response.sourceNodes?.map((node: any) => ({
          fileName: node.metadata?.file_name || 'Unknown',
          content: node.text,
          score: node.score || 0,
          metadata: {
            ...node.metadata,
            start_char_idx: undefined,
            end_char_idx: undefined,
            text: undefined
          }
        })).filter((source: any) => source.score > 0) || []
      };
    } catch (error) {
      return {
        success: false,
        error: `${error}`,
        response: null
      };
    }
  }
}