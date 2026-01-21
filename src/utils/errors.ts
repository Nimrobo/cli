import chalk from 'chalk';
import { isJsonOutput, printJson } from './output';
import { AxiosError } from 'axios';

interface ErrorSuggestion {
  pattern: RegExp | string;
  suggestions: string[];
}

const ERROR_SUGGESTIONS: ErrorSuggestion[] = [
  {
    pattern: /not found/i,
    suggestions: [
      "Check the ID is correct",
      "Run the list command to see available resources",
    ],
  },
  {
    pattern: /unauthorized|401/i,
    suggestions: [
      "Check your API key is correct",
      "Run 'nimrobo login' to re-authenticate",
    ],
  },
  {
    pattern: /forbidden|403/i,
    suggestions: [
      "You may not have permission to perform this action",
      "Check your API token has the required scope",
    ],
  },
  {
    pattern: /invalid.*expiry/i,
    suggestions: [
      "Valid expiry presets are: 1_day, 1_week, 1_month",
    ],
  },
  {
    pattern: /labels.*required/i,
    suggestions: [
      "Provide labels using --labels flag or in the JSON file",
      "Example: --labels \"Label1,Label2,Label3\"",
    ],
  },
  {
    pattern: /prompt.*required/i,
    suggestions: [
      "Provide the prompt using --prompt flag or in the JSON file",
    ],
  },
  {
    pattern: /name.*required/i,
    suggestions: [
      "Provide the name using --name flag or in the JSON file",
    ],
  },
  {
    pattern: /projectId.*required/i,
    suggestions: [
      "Provide the project ID using --project flag",
      "You can use 'default' to use your default project",
    ],
  },
  {
    pattern: /ENOTFOUND|ECONNREFUSED/i,
    suggestions: [
      "Check your internet connection",
      "Verify the API server is reachable",
    ],
  },
];

function getSuggestions(message: string): string[] {
  for (const { pattern, suggestions } of ERROR_SUGGESTIONS) {
    if (typeof pattern === 'string') {
      if (message.toLowerCase().includes(pattern.toLowerCase())) {
        return suggestions;
      }
    } else if (pattern.test(message)) {
      return suggestions;
    }
  }
  return [];
}

export function handleError(err: unknown): never {
  let message = 'An unexpected error occurred';
  let statusCode: number | undefined;

  if (err instanceof AxiosError) {
    statusCode = err.response?.status;
    message = err.response?.data?.error || err.message;
  } else if (err instanceof Error) {
    message = err.message;
  }

  if (isJsonOutput()) {
    printJson({ error: message, statusCode });
    process.exit(1);
  }

  console.log();
  console.log(chalk.red('✗'), 'Error:', message);

  const suggestions = getSuggestions(message);
  if (suggestions.length > 0) {
    console.log();
    console.log(chalk.yellow('  Suggestions:'));
    suggestions.forEach(s => {
      console.log(chalk.gray(`  • ${s}`));
    });
  }

  console.log();
  process.exit(1);
}

export function requireAuth(apiKey: string | null): asserts apiKey is string {
  if (!apiKey) {
    if (isJsonOutput()) {
      printJson({ error: 'Not authenticated' });
      process.exit(1);
    }

    console.log();
    console.log(chalk.red('✗'), 'Error:', 'Not authenticated');
    console.log();
    console.log(chalk.yellow('  Suggestions:'));
    console.log(chalk.gray("  • Run 'nimrobo login' to authenticate"));
    console.log();
    process.exit(1);
  }
}
