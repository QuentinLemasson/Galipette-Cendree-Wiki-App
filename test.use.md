# Testing Documentation

This document provides a comprehensive guide to the testing setup in the Wiki Galipette Cendrée project.

## Table of Contents

- [Testing Setup](#testing-setup)
- [Existing Tests](#existing-tests)
- [Mocking Strategy](#mocking-strategy)
- [How to Update/Add Tests](#how-to-updateadd-tests)
- [Useful Utilities](#useful-utilities)

## Testing Setup

The project uses Jest as the testing framework with TypeScript support. The setup includes:

### Configuration Files

- **jest.config.cjs**: Main Jest configuration file

  - Uses `ts-jest` preset for TypeScript support
  - Configured for ESM (ECMAScript Modules)
  - Maps `@/` imports to the `src/` directory
  - Treats `.ts` and `.tsx` files as ESM
  - Uses `node` as the test environment

- **jest.setup.cjs**: Setup file that runs before tests

  - Mocks Next.js `Response` and `NextResponse` objects
  - Provides a global mock for `next/server` imports

- **tsconfig.json**: TypeScript configuration
  - Excludes test files from TypeScript compilation via the `exclude` array
  - This prevents TypeScript errors in test files from affecting the build

### Running Tests

Tests are run using the `npm run test` command, which executes Jest with the configuration specified in `jest.config.cjs`.

## Existing Tests

The project currently has the following test files:

### API Tests

1. **articles.test.ts**

   - Tests for article-related API routes
   - Covers paths, article retrieval, search, related articles, and folder tree endpoints
   - Each endpoint has tests for success cases, error handling, and edge cases

2. **db.test.ts**

   - Tests for database management API routes
   - Covers import vault content and flush database operations
   - Tests success cases and error handling

## Mocking Strategy

The project uses Jest's mocking capabilities to isolate components and API routes during testing. The mocking strategy includes:

### Module Mocking

External dependencies are mocked using `jest.mock()`. For example:

```typescript
jest.mock("@/data/articles", () => ({
  getArticlePaths: () => mockGetArticlePaths(),
  getArticleByPath: (path: string) => mockGetArticleByPath(path),
  // ...other functions
}));
```

### Mock Functions

Mock functions are created using `jest.fn()` with TypeScript generics for type safety:

```typescript
const mockGetArticlePaths = jest.fn<() => Promise<ArticlePathsResult[]>>();
const mockGetArticleByPath =
  jest.fn<(path: string) => Promise<ArticleResult | null>>();
```

### Mock Implementation

Mock implementations are set in individual tests:

```typescript
mockGetArticlePaths.mockResolvedValue(mockPaths);
// or
mockGetArticlePaths.mockRejectedValue(new Error("Database error"));
```

### Next.js Mocking

Next.js components and functions are mocked in `jest.setup.cjs`:

```javascript
jest.mock("next/server", () => {
  return {
    NextResponse: {
      json: (body, init) => new Response(JSON.stringify(body), init),
    },
    NextRequest: class NextRequest {
      constructor(url) {
        this.url = url;
      }
    },
  };
});
```

## How to Update/Add Tests

### Adding a New Test File

1. Create a new file in the appropriate `__tests__` directory with the `.test.ts` extension
2. Import Jest utilities and the components/functions to test:

```typescript
import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import { YourComponent } from "../path/to/component";
```

3. Define interfaces for mock functions if needed:

```typescript
interface YourMockResult {
  // Define the structure of your mock result
}
```

4. Create mock functions:

```typescript
const mockYourFunction = jest.fn<() => Promise<YourMockResult>>();
```

5. Mock modules:

```typescript
jest.mock("@/path/to/module", () => ({
  yourFunction: () => mockYourFunction(),
}));
```

6. Write test cases using `describe` and `it`:

```typescript
describe("Your Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should do something", async () => {
    // Arrange
    mockYourFunction.mockResolvedValue(yourMockResult);

    // Act
    const result = await YourComponent();

    // Assert
    expect(mockYourFunction).toHaveBeenCalled();
    expect(result).toEqual(expectedResult);
  });
});
```

### Updating Existing Tests

1. Locate the test file you want to update
2. Add new test cases or modify existing ones
3. Ensure all mocks are properly set up and cleared between tests
4. Run the tests to verify your changes

### Best Practices

- Keep tests focused on a single functionality
- Use descriptive test names that explain what is being tested
- Mock only what is necessary
- Clean up mocks between tests using `beforeEach(() => { jest.clearAllMocks(); })`
- Test both success and error cases
- Test edge cases and boundary conditions

## Useful Utilities

### Running Specific Tests

To run a specific test file:

```bash
npx jest path/to/your.test.ts --config=jest.config.cjs
```

To run tests matching a pattern:

```bash
npx jest -t "your test name pattern" --config=jest.config.cjs
```

### Running Tests Without Console Logs

To run tests without console output:

```bash
npm run test -- --silent
```

### Generating Coverage Reports

To generate a coverage report:

1. Add the following to your package.json scripts:

```json
"test:coverage": "jest --config=jest.config.cjs --coverage"
```

2. Run the command:

```bash
npm run test:coverage
```

This will generate a coverage report in the `coverage` directory.

### Watch Mode

To run tests in watch mode (automatically re-run when files change):

1. Add the following to your package.json scripts:

```json
"test:watch": "jest --config=jest.config.cjs --watch"
```

2. Run the command:

```bash
npm run test:watch
```

### Debugging Tests

To debug tests in VS Code:

1. Add a `.vscode/launch.json` file with the following configuration:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Jest Tests",
      "program": "${workspaceFolder}/node_modules/jest/bin/jest.js",
      "args": ["--runInBand", "--config=jest.config.cjs"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

2. Set breakpoints in your test files
3. Use the VS Code debugger to run and debug your tests

### Snapshot Testing

For UI components, consider using snapshot testing:

```typescript
it("should render correctly", () => {
  const { container } = render(<YourComponent />);
  expect(container).toMatchSnapshot();
});
```

This will create a snapshot of the component's rendered output and compare it in future tests.
