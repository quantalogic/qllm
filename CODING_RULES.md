# Coding Rules and Standards

## Programming Standards

1. **Architecture**
   - Implement multi-provider patterns for LLM integrations
   - Design for extensibility and provider-agnostic interfaces
   - Use dependency injection for provider implementations

2. **Functional Programming**
   - Write pure functions whenever possible
   - Avoid mutable state
   - Use immutable data structures
   - Implement function composition over inheritance
   - Prefer `const` declarations over `let`

3. **TypeScript Usage**
   - Enable strict mode in `tsconfig.json`
   - Use explicit type annotations for public APIs
   - Leverage union types and type guards
   - Prefer type aliases over interfaces for object definitions
   - Use generics to create reusable, type-safe components

4. **API Design**
   - Create self-documenting function and parameter names
   - Implement consistent error handling patterns
   - Return predictable data structures
   - Use builder patterns for complex object creation
   - Provide TypeScript type definitions for all public APIs

5. **Code Organization**
   - Follow functional composition principles
   - Keep functions small and focused
   - Use pure functions for business logic
   - Separate side effects from pure computations
   - Organize code by feature rather than type

6. **Type System Best Practices**
   - Use discriminated unions for type-safe state handling
   - Implement branded types for type-safe identifiers
   - Leverage const assertions for literal types
   - Use template literal types for string manipulation
   - Define strict function signatures with proper return types

## Coding Standards

### Naming Conventions

- Use kebab-case for file names
  ```typescript
  // Good
  my-component.ts
  user-service.ts
  
  // Bad
  myComponent.ts
  UserService.ts
  ```

- Use camelCase for variables and function names
  ```typescript
  // Good
  const userId = '123';
  function calculateTotal() { }
  
  // Bad
  const UserID = '123';
  function Calculate_Total() { }
  ```

- Use UpperCamelCase (PascalCase) for classes, types, and interfaces
  ```typescript
  // Good
  type UserProfile = {
    id: string;
    name: string;
  }
  
  class UserService { }
  
  // Bad
  type userProfile = { }
  class userService { }
  ```

- Use ALL_CAPS for constants and enum values
  ```typescript
  // Good
  const MAX_RETRIES = 3;
  enum Color {
    RED = 'red',
    BLUE = 'blue'
  }
  
  // Bad
  const maxRetries = 3;
  enum Color {
    red = 'red',
    blue = 'blue'
  }
  ```

### File Organization

- Group related functionality into modules
  ```
  src/
  ├── auth/
  │   ├── index.ts
  │   ├── auth-service.ts
  │   └── auth-types.ts
  ├── users/
  │   ├── index.ts
  │   ├── user-service.ts
  │   └── user-types.ts
  └── utils/
      ├── index.ts
      └── string-utils.ts
  ```

- Use index files to simplify imports
  ```typescript
  // index.ts
  export * from './auth-service';
  export * from './auth-types';
  
  // Usage in other files
  import { AuthService, AuthConfig } from '../auth';
  ```

- Separate concerns: keep business logic, UI components, and utilities in different directories

### Code Style

- Prefer `const` over `let`
  ```typescript
  // Good
  const user = getUserById(id);
  
  // Bad
  let user = getUserById(id);
  ```

- Use arrow functions for better lexical scoping
  ```typescript
  // Good
  const multiply = (a: number, b: number): number => a * b;
  
  // Also Good (for multi-line functions)
  const calculate = (values: number[]): number => {
    return values.reduce((sum, value) => sum + value, 0);
  };
  ```

- Utilize TypeScript's type system fully
  ```typescript
  // Good
  type Result<T> = {
    data: T;
    error: Error | null;
  };
  
  function fetchData<T>(url: string): Promise<Result<T>> {
    // Implementation
  }
  ```

- Implement error handling with custom error types
  ```typescript
  class ApiError extends Error {
    constructor(
      message: string,
      public statusCode: number,
      public code: string
    ) {
      super(message);
      this.name = 'ApiError';
    }
  }
  ```

### Best Practices

- Follow the Single Responsibility Principle
  ```typescript
  // Good
  const validateUser = (user: User): boolean => {
    // Only handles validation
    return user.email.includes('@') && user.password.length >= 8;
  };
  
  const saveUser = async (user: User): Promise<void> => {
    // Only handles saving
    await database.save(user);
  };
  ```

- Use dependency injection
  ```typescript
  // Good
  class UserService {
    constructor(private database: Database) {}
    
    async getUser(id: string): Promise<User> {
      return this.database.findUser(id);
    }
  }
  ```

- Implement proper error handling
  ```typescript
  const fetchUser = async (id: string): Promise<Result<User>> => {
    try {
      const user = await api.getUser(id);
      return { data: user, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: new ApiError('Failed to fetch user', 404, 'USER_NOT_FOUND')
      };
    }
  };
  ```

### Documentation

- Use JSDoc comments
  ```typescript
  /**
   * Calculates the total price including tax
   * @param {number} price - The base price
   * @param {number} taxRate - The tax rate as a decimal
   * @returns {number} The total price including tax
   * @throws {Error} If price or taxRate is negative
   * 
   * @example
   * const total = calculateTotal(100, 0.2); // Returns 120
   */
  const calculateTotal = (price: number, taxRate: number): number => {
    if (price < 0 || taxRate < 0) {
      throw new Error('Price and tax rate must be non-negative');
    }
    return price * (1 + taxRate);
  };
  ```

## Library Usage

### Axios (^1.7.5)
```typescript
import axios from 'axios';

// Configure global defaults
axios.defaults.baseURL = 'https://api.example.com';
axios.defaults.timeout = 5000;

// Use interceptors for global error handling
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Handle unauthorized
    }
    return Promise.reject(error);
  }
);
```

### Zod (^3.23.8)
```typescript
import { z } from 'zod';

// Create reusable schemas
const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  age: z.number().min(0).max(120)
});

type User = z.infer<typeof UserSchema>;
```

### UUID (^10.0.0)
```typescript
import { v4 as uuidv4 } from 'uuid';

// Generate random UUID
const id = uuidv4();
```

### JS-YAML (^4.1.0)
```typescript
import yaml from 'js-yaml';

// Type-safe schema usage
const config = yaml.load(yamlString, { schema: yaml.JSON_SCHEMA });
```

### MIME-Types (^2.1.35)
```typescript
import mime from 'mime-types';

// Detect MIME type
const mimeType = mime.lookup('file.jpg'); // 'image/jpeg'
const extension = mime.extension('image/jpeg'); // 'jpg'
```

Remember to keep this document updated as our standards evolve and new best practices emerge.
