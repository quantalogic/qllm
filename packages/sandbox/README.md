# SecureNodeJsCodeEnclave

## Project Overview

**SecureNodeJsCodeEnclave** is an advanced system designed to create a secure execution environment for running untrusted JavaScript/TypeScript code in Node.js. It provides isolated execution of multiple files, allows for the installation of specified npm packages within a controlled context, and ensures robust security measures to prevent unauthorized access or malicious activities.

## Features

- **Isolated Execution:** Run untrusted JavaScript/TypeScript code securely in isolated environments.
- **Controlled NPM Package Installation:** Install and manage npm packages in a controlled, secure manner.
- **Security Measures:** Employs various security features to prevent unauthorized access and mitigate potential threats.
- **Extensible and Configurable:** Easily extendable to support additional tools and configurable to meet diverse security needs.

## Project Structure

```plaintext
secure-nodejs-code-enclave/
├── Dockerfile
├── examples
│   └── tools
│       ├── code_generator.json
│       └── text-summerize.json
├── jest.config.js
├── package.json
├── package-lock.json
├── README.md
├── src
│   ├── ai-tools
│   │   ├── code-generator.ts
│   │   └── text-summerize.ts
│   ├── core
│   │   ├── enclave.ts
│   │   ├── file-manager.ts
│   │   ├── package-manager.ts
│   │   └── virtual-fs.ts
│   ├── index.ts
│   ├── security
│   │   ├── resource-limiter.ts
│   │   └── sandbox.ts
│   ├── templates
│   │   ├── code_generator.yaml
│   │   └── text-summerize.yaml
│   ├── __tests__
│   │   ├── enclave.test.ts
│   │   ├── file-manager.test.ts
│   │   ├── package-manager.test.ts
│   │   └── sandbox.test.ts
│   ├── types.ts
│   └── utils
│       ├── error-handler.ts
│       ├── execute_tool_schema.ts
│       ├── logger.ts
│       ├── parse_argument.ts
│       ├── process_tool_schema.ts
│       └── tools.ts
├── test
│   ├── integration
│   │   └── enclave-workflow.test.ts
│   ├── security
│   │   └── sandbox-escape.test.ts
│   └── unit
│       ├── enclave.test.ts
│       ├── file-manager.test.ts
│       └── package-manager.test.ts
├── tsconfig.json
└── tree.txt
```

##  Installation
To set up the project locally, follow these steps:

Clone the repository:
```
git clone https://github.com/yourusername/SecureNodeJsCodeEnclave.git
cd SecureNodeJsCodeEnclave

```

Install dependencies:
```
npm install
```

Build the project:

```
npm run build

```

Usage : 

##  Running code securely:

You can use the core enclave.ts to run untrusted JavaScript/TypeScript code securely by following the provided examples in the examples directory.

##  Example commands:

To execute a template file securely :

```
npm run build
npm start -- --file "./examples/tools/text-summerize.json"

```
##  Configuring security settings:

Modify the settings in src/security/sandbox.ts to adjust the security parameters such as memory limits, execution time, etc.


##  Contributing
We welcome contributions! Please follow these steps:

Fork the repository.
Create a new branch: 
```
git checkout -b feature/your-feature-name.
```
Make your changes and commit them: 
```git commit -m 'Add some feature'.
Push to the branch: git push origin feature/your-feature-name
```.
Open a pull request.

##  License
This project is licensed under the MIT License - see the LICENSE file for details.

##  Acknowledgments
Special thanks to the contributors who have helped build this project.

