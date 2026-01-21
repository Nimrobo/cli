import chalk from 'chalk';

let jsonOutput = false;

export function setJsonOutput(enabled: boolean): void {
  jsonOutput = enabled;
}

export function isJsonOutput(): boolean {
  return jsonOutput;
}

export function success(message: string): void {
  if (!jsonOutput) {
    console.log(chalk.green('✓'), message);
  }
}

export function error(message: string): void {
  if (!jsonOutput) {
    console.log(chalk.red('✗'), 'Error:', message);
  }
}

export function info(message: string): void {
  if (!jsonOutput) {
    console.log(chalk.blue('ℹ'), message);
  }
}

export function warn(message: string): void {
  if (!jsonOutput) {
    console.log(chalk.yellow('⚠'), message);
  }
}

export function printJson(data: unknown): void {
  console.log(JSON.stringify(data, null, 2));
}

export function printTable(headers: string[], rows: string[][]): void {
  if (jsonOutput) {
    return;
  }

  const colWidths = headers.map((header, i) => {
    const maxDataWidth = Math.max(...rows.map(row => (row[i] || '').length));
    return Math.max(header.length, maxDataWidth);
  });

  const headerLine = headers.map((h, i) => h.padEnd(colWidths[i])).join('  ');
  const separator = colWidths.map(w => '-'.repeat(w)).join('  ');

  console.log(chalk.bold(headerLine));
  console.log(separator);

  rows.forEach(row => {
    const line = row.map((cell, i) => (cell || '').padEnd(colWidths[i])).join('  ');
    console.log(line);
  });
}

export function printKeyValue(data: Record<string, unknown>, indent = 0): void {
  if (jsonOutput) {
    return;
  }

  const padding = '  '.repeat(indent);

  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) {
      console.log(`${padding}${chalk.gray(key)}: ${chalk.dim('—')}`);
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      console.log(`${padding}${chalk.gray(key)}:`);
      printKeyValue(value as Record<string, unknown>, indent + 1);
    } else if (Array.isArray(value)) {
      console.log(`${padding}${chalk.gray(key)}: ${value.join(', ')}`);
    } else {
      console.log(`${padding}${chalk.gray(key)}: ${value}`);
    }
  }
}

export function printUrls(urls: string[]): void {
  urls.forEach(url => console.log(url));
}

export function output(data: unknown): void {
  if (jsonOutput) {
    printJson(data);
  }
}
