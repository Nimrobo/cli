import inquirer from 'inquirer';
import { ExpiryPreset } from '../types';

export async function promptApiKey(): Promise<string> {
  const { apiKey } = await inquirer.prompt([
    {
      type: 'password',
      name: 'apiKey',
      message: 'Enter your Nimrobo API key:',
      mask: '*',
      validate: (input: string) => {
        if (!input || input.trim().length === 0) {
          return 'API key is required';
        }
        if (!input.startsWith('api_')) {
          return 'API key should start with "api_"';
        }
        return true;
      },
    },
  ]);
  return apiKey.trim();
}

export async function promptProjectName(): Promise<string> {
  const { name } = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Project name:',
      validate: (input: string) => input.trim().length > 0 || 'Project name is required',
    },
  ]);
  return name.trim();
}

export async function promptProjectPrompt(): Promise<string> {
  const { prompt } = await inquirer.prompt([
    {
      type: 'editor',
      name: 'prompt',
      message: 'AI prompt for the voice agent (opens editor):',
      validate: (input: string) => input.trim().length > 0 || 'Prompt is required',
    },
  ]);
  return prompt.trim();
}

export async function promptLabels(): Promise<string[]> {
  const { labels } = await inquirer.prompt([
    {
      type: 'input',
      name: 'labels',
      message: 'Enter labels (comma-separated):',
      validate: (input: string) => {
        const items = input.split(',').map(s => s.trim()).filter(s => s.length > 0);
        return items.length > 0 || 'At least one label is required';
      },
    },
  ]);
  return labels.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0);
}

export async function promptExpiry(): Promise<ExpiryPreset> {
  const { expiry } = await inquirer.prompt([
    {
      type: 'list',
      name: 'expiry',
      message: 'Link expiry:',
      choices: [
        { name: '1 day', value: '1_day' },
        { name: '1 week', value: '1_week' },
        { name: '1 month', value: '1_month' },
      ],
    },
  ]);
  return expiry;
}

export async function promptInstantLinkPrompt(): Promise<string> {
  const { prompt } = await inquirer.prompt([
    {
      type: 'editor',
      name: 'prompt',
      message: 'AI prompt for the voice link (opens editor):',
      validate: (input: string) => input.trim().length > 0 || 'Prompt is required',
    },
  ]);
  return prompt.trim();
}

export async function promptConfirm(message: string): Promise<boolean> {
  const { confirmed } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmed',
      message,
      default: false,
    },
  ]);
  return confirmed;
}
