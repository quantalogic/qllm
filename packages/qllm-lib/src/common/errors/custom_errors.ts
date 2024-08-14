// packages/qllm-core/src/common/errors/custom_errors.ts

export class QllmError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'QllmError';
    }
  }
  
  export class ConfigurationError extends QllmError {
    constructor(message: string) {
      super(message);
      this.name = 'ConfigurationError';
    }
  }
  
  export class ProviderError extends QllmError {
    constructor(message: string, public providerName: string) {
      super(message);
      this.name = 'ProviderError';
    }
  }
  
  export class TemplateError extends QllmError {
    constructor(message: string) {
      super(message);
      this.name = 'TemplateError';
    }
  }
  
  export class InputValidationError extends QllmError {
    constructor(message: string) {
      super(message);
      this.name = 'InputValidationError';
    }
  }
  
  export class OutputValidationError extends QllmError {
    constructor(message: string) {
      super(message);
      this.name = 'OutputValidationError';
    }
  }