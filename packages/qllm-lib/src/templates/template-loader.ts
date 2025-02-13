/**
 * @fileoverview Template Loader for QLLM Library
 * 
 * This module provides a robust and flexible system for loading template definitions
 * from various file formats. Key features include:
 * 
 * - Support for multiple file formats (JSON, YAML)
 * - Automatic content type detection
 * - Resolution of included content and dependencies
 * - Builder pattern support for template modification
 * - Error handling with detailed diagnostics
 * 
 * The loader handles all aspects of template loading, from file reading to
 * content resolution, ensuring templates are properly initialized before use.
 * 
 * @version 1.0.0
 * @module qllm-lib/templates
 * @since 2023
 * 
 * @example
 * ```typescript
 * // Load a template from YAML
 * const yamlTemplate = await TemplateLoader.load('templates/greeting.yaml');
 * 
 * // Load a template from JSON
 * const jsonTemplate = await TemplateLoader.load('templates/response.json');
 * 
 * // Load and modify a template using builder pattern
 * const builder = await TemplateLoader.loadAsBuilder('templates/base.yaml');
 * builder
 *   .setName('custom-template')
 *   .addVariable('user', { type: 'string', required: true })
 *   .setContent('Hello {{user}}!');
 * 
 * const customTemplate = builder.build();
 * ```
 * 
 * @see {@link TemplateDefinitionBuilder} for template modification
 * @see {@link TemplateManager} for template management
 */
// template-loader.ts
import { TemplateDefinitionWithResolvedContent } from './template-schema';
import { TemplateDefinitionBuilder } from './template-definition-builder';
import { loadContent, resolveIncludedContent } from '../utils/document/document-inclusion-resolver';
import fetch from 'node-fetch';
import { readFile } from 'fs/promises';
import { logger } from '../utils/logger';

export interface TemplateLoaderConfig {
  githubToken?: string;
  githubApiVersion?: string;
  headers?: Record<string, string>;
  auth?: {
    type: 'bearer' | 'basic' | 'token';
    token?: string;
    username?: string;
    password?: string;
  };
  s3Config?: {
    accessKeyId?: string;
    secretAccessKey?: string;
    region?: string;
  };
}

export class TemplateLoader {
  private static templateCache: Map<string, TemplateDefinitionWithResolvedContent> = new Map();
  private static config: TemplateLoaderConfig = {};

  static configure(config: TemplateLoaderConfig) {
    logger.info('Configuring TemplateLoader');
    logger.debug('Configuration details:', {
      hasGithubToken: !!config.githubToken,
      githubApiVersion: config.githubApiVersion,
      hasHeaders: !!config.headers,
      authType: config.auth?.type,
      hasS3Config: !!config.s3Config
    });
    this.config = { ...this.config, ...config };
    logger.info('TemplateLoader configuration updated');
  }

  static async load(source: string, headers?: Record<string, string>): Promise<TemplateDefinitionWithResolvedContent> {
    logger.info(`Loading template from source: ${source}`);
    
    // Check cache first
    if (this.templateCache.has(source)) {
      logger.debug(`Cache hit for source: ${source}`);
      return this.templateCache.get(source)!;
    }
    logger.debug(`Cache miss for source: ${source}`);

    try {
      logger.debug('Fetching template content');
      const content = await this.fetchContent(source, headers);
      logger.debug(`Content fetched, mime type: ${content.mimeType}`);

      logger.debug('Creating template builder');
      const builder = getBuilder(content);
      logger.debug('Building template');
      const template = builder.build();

      logger.debug('Resolving included content');
      const resolvedContent = await resolveIncludedContent(template.content, source);
      logger.debug(`Content resolved, length: ${resolvedContent.length}`);
      
      const result = { ...template, content: resolvedContent };
      
      logger.debug(`Caching template for source: ${source}`);
      this.templateCache.set(source, result);
      
      logger.info(`Template loaded successfully from: ${source}`);
      return result;
    } catch (error) {
      logger.error(`Failed to load template from ${source}:`, error);
      throw error;
    }
  }

  static async loadAsBuilder(source: string, headers?: Record<string, string>): Promise<TemplateDefinitionBuilder> {
    logger.info(`Loading template as builder from source: ${source}`);
    
    try {
      logger.debug('Fetching template content');
      const content = await this.fetchContent(source, headers);
      logger.debug(`Content fetched, mime type: ${content.mimeType}`);

      logger.debug('Creating template builder');
      const builder = getBuilder(content);
      
      logger.debug('Building template for content resolution');
      const resolvedContent = await resolveIncludedContent(builder.build().content, source);
      logger.debug(`Content resolved, length: ${resolvedContent.length}`);

      logger.info('Template builder created successfully');
      return builder.setResolvedContent(resolvedContent);
    } catch (error) {
      logger.error(`Failed to load template as builder from ${source}:`, error);
      throw error;
    }
  }

  private static async fetchContent(source: string, headers?: Record<string, string>): Promise<{ mimeType: string; content: string }> {
    logger.debug(`Fetching content from source: ${source}`);
    
    if (source.startsWith('http')) {
      logger.debug('Processing HTTP source');
      const url = this.parseTemplateUrl(source);
      logger.debug(`Parsed URL: ${url}`);
      
      let requestHeaders: Record<string, string> = {
        ...headers
      };

      // Handle GitHub specific authentication
      if (source.includes('github.com')) {
        logger.debug('Configuring GitHub-specific headers');
        if (this.config.githubToken) {
          logger.debug('Adding GitHub authentication token');
          requestHeaders['Authorization'] = `Bearer ${this.config.githubToken}`;
          requestHeaders['X-GitHub-Api-Version'] = this.config.githubApiVersion || '2022-11-28';
        } else {
          logger.debug('No GitHub token configured, proceeding without authentication');
        }
      }

      // Handle general authentication
      if (this.config.auth) {
        logger.debug(`Configuring ${this.config.auth.type} authentication`);
        switch (this.config.auth.type) {
          case 'bearer':
            if (this.config.auth.token) {
              logger.debug('Adding bearer token authentication');
              requestHeaders['Authorization'] = `Bearer ${this.config.auth.token}`;
            }
            break;
          case 'basic':
            if (this.config.auth.username && this.config.auth.password) {
              logger.debug('Adding basic authentication');
              const credentials = Buffer.from(`${this.config.auth.username}:${this.config.auth.password}`).toString('base64');
              requestHeaders['Authorization'] = `Basic ${credentials}`;
            }
            break;
          case 'token':
            if (this.config.auth.token) {
              logger.debug('Adding token authentication');
              requestHeaders['Authorization'] = `Token ${this.config.auth.token}`;
            }
            break;
        }
      }

      // Add any additional configured headers
      if (this.config.headers) {
        logger.debug('Adding configured headers');
        requestHeaders = { ...requestHeaders, ...this.config.headers };
      }

      logger.debug('Making HTTP request');
      const response = await fetch(url, { headers: requestHeaders });
      if (!response.ok) {
        const error = `HTTP ${response.status}: ${response.statusText}`;
        logger.error(`Failed to fetch template: ${error}`);
        throw new Error(`Failed to fetch template: ${error}`);
      }
      
      const content = await response.text();
      const mimeType = response.headers.get('content-type') || this.guessMimeType(source);
      logger.debug(`Content fetched successfully, mime type: ${mimeType}, length: ${content.length}`);
      return { mimeType, content };
    } else {
      logger.debug('Processing local file source');
      try {
        const content = await readFile(source, 'utf-8');
        const mimeType = this.guessMimeType(source);
        logger.debug(`File read successfully, mime type: ${mimeType}, length: ${content.length}`);
        return { mimeType, content };
      } catch (error) {
        logger.error(`Failed to read local file ${source}:`, error);
        throw error;
      }
    }
  }

  private static parseTemplateUrl(url: string): string {
    logger.debug(`Parsing template URL: ${url}`);
    let parsedUrl: string;
    
    try {
      if (url.includes('github.com')) {
        logger.debug('Processing GitHub URL');
        parsedUrl = this.githubUrlToRaw(url);
      } else if (url.startsWith('https://raw.githubusercontent.com/')) {
        logger.debug('URL is already in raw GitHub format');
        parsedUrl = url;
      } else if (url.startsWith('https://s3.amazonaws.com/') || url.includes('.s3.amazonaws.com/')) {
        logger.debug('Processing S3 URL');
        parsedUrl = this.parseS3Url(url);
      } else if (url.includes('drive.google.com')) {
        logger.debug('Processing Google Drive URL');
        parsedUrl = this.parseGoogleDriveUrl(url);
      } else {
        logger.debug('Using URL as-is');
        parsedUrl = url;
      }
      
      logger.debug(`URL parsed successfully: ${parsedUrl}`);
      return parsedUrl;
    } catch (error) {
      logger.error(`Failed to parse URL ${url}:`, error);
      throw error;
    }
  }

  private static githubUrlToRaw(url: string): string {
    logger.debug(`Converting GitHub URL to raw format: ${url}`);
    const rawUrl = url
      .replace('github.com', 'raw.githubusercontent.com')
      .replace('/blob/', '/');
    logger.debug(`Converted to raw URL: ${rawUrl}`);
    return rawUrl;
  }

  private static parseS3Url(url: string): string {
    logger.debug(`Parsing S3 URL: ${url}`);
    if (this.config.s3Config) {
      const { accessKeyId, secretAccessKey, region } = this.config.s3Config;
      logger.debug('S3 configuration found', { hasAccessKey: !!accessKeyId, hasSecret: !!secretAccessKey, region });
      // If S3 credentials are provided, you might want to generate a signed URL here
      // This would require the aws-sdk package
    } else {
      logger.debug('No S3 configuration found, using URL as-is');
    }
    const encodedUrl = encodeURI(url);
    logger.debug(`Encoded S3 URL: ${encodedUrl}`);
    return encodedUrl;
  }

  private static parseGoogleDriveUrl(url: string): string {
    logger.debug(`Parsing Google Drive URL: ${url}`);
    let fileId = '';
    
    try {
      if (url.includes('/file/d/')) {
        logger.debug('Extracting file ID from /file/d/ format');
        fileId = url.split('/file/d/')[1].split('/')[0];
      } else if (url.includes('id=')) {
        logger.debug('Extracting file ID from id= parameter');
        fileId = new URL(url).searchParams.get('id') || '';
      }
      
      if (!fileId) {
        logger.error('Invalid Google Drive URL format');
        throw new Error('Invalid Google Drive URL format');
      }
      
      const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
      logger.debug(`Generated download URL: ${downloadUrl}`);
      return downloadUrl;
    } catch (error) {
      logger.error(`Failed to parse Google Drive URL ${url}:`, error);
      throw error;
    }
  }

  private static guessMimeType(source: string): string {
    logger.debug(`Guessing mime type for source: ${source}`);
    let mimeType: string;
    
    if (source.endsWith('.json')) {
      mimeType = 'application/json';
    } else if (source.endsWith('.yaml') || source.endsWith('.yml')) {
      mimeType = 'application/yaml';
    } else {
      mimeType = 'application/yaml'; // default to yaml
    }
    
    logger.debug(`Guessed mime type: ${mimeType}`);
    return mimeType;
  }

  static clearCache(): void {
    logger.info('Clearing template cache');
    const cacheSize = this.templateCache.size;
    this.templateCache.clear();
    logger.debug(`Cleared ${cacheSize} cached templates`);
  }
}

function getBuilder(content: { mimeType: string; content: string }): TemplateDefinitionBuilder {
  logger.debug(`Creating builder for content type: ${content.mimeType}`);
  try {
    const { mimeType, content: contentString } = content;
    let builder: TemplateDefinitionBuilder;
    
    if (mimeType.includes('json')) {
      logger.debug('Using JSON builder');
      builder = TemplateDefinitionBuilder.fromJSON(contentString);
    } else {
      logger.debug('Using YAML builder');
      builder = TemplateDefinitionBuilder.fromYAML(contentString);
    }
    
    logger.debug('Builder created successfully');
    return builder;
  } catch (error) {
    logger.error('Failed to create template builder:', error);
    throw error;
  }
}