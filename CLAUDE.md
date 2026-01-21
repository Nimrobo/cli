# CLAUDE.md

## Project Overview
CLI tool for interacting with Nimrobo AI APIs. Nimrobo is a voice-first AI platform for running interviews, screening, and diagnostic conversations via shareable voice-links.

## Tech Stack
- Node.js + TypeScript
- CLI framework: oclif
- HTTPS client: axios

## Project Structure
```
nimrobo-cli/
├── src/
│   ├── index.ts          # Entry point
│   ├── commands/         # CLI commands
│   ├── api/              # API client for Nimrobo
│   ├── utils/            # Helpers
│   └── types/            # TypeScript types
├── tests/
│   ├── unit/             # Unit tests
│   ├── integration/      # Integration tests
│   └── e2e/              # End-to-end tests
├── bin/
│   └── nimrobo           # CLI executable
├── package.json
├── tsconfig.json
├── jest.config.js        # Jest configuration
└── CLAUDE.md
```

API details present in @docs/integration_prompt.md

## Development Commands
```bash
npm run build      # Compile TypeScript
npm run dev        # Watch mode
npm link           # Link CLI globally for testing
npm test           # Run all tests
npm run test:unit  # Run unit tests only
npm run test:int   # Run integration tests only
npm run test:e2e   # Run E2E tests only
```

## Testing
- Framework: Jest with ts-jest for TypeScript support
- Test location: `tests/` directory (mirrors `src/` structure)
  ```
  tests/
  ├── unit/           # Unit tests for isolated functions
  ├── integration/    # Integration tests for command flows
  └── e2e/            # End-to-end CLI execution tests
  ```
- Naming convention: `*.test.ts`
- Mock external APIs using Jest mocks
- For E2E tests, use `execa` or similar to invoke the CLI as a subprocess

## Code Style
- Use async/await for all API calls
- Handle errors gracefully with user-friendly messages
- Use chalk/colors for terminal output
- Store config/credentials in ~/.nimrobo/config.json