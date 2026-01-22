import { Command } from 'commander';
import { promptApiKey } from '../utils/prompts';
import { setApiKey, getApiBaseUrl } from '../utils/config';
import { resetApiClient } from '../api/client';
import { validateApiKey } from '../api/user';
import { success, info, error as errorLog, output, isJsonOutput } from '../utils/output';
import { handleError } from '../utils/errors';
import axios from 'axios';
import chalk from 'chalk';

// Device auth response types
interface DeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  verification_uri_complete: string;
  expires_in: number;
  interval: number;
}

interface DeviceTokenResponse {
  status: 'pending' | 'authorized' | 'denied' | 'expired';
  api_token?: string;
  error?: string;
}

/**
 * Open the browser with the verification URL
 */
async function openBrowser(url: string): Promise<boolean> {
  try {
    // Dynamically import 'open' to handle the ESM module
    const open = (await import('open')).default;
    await open(url);
    return true;
  } catch {
    // If open fails, it's not critical - user can manually open the URL
    return false;
  }
}

/**
 * Request a device code from the API
 */
async function requestDeviceCode(baseUrl: string): Promise<DeviceCodeResponse> {
  const response = await axios.post<DeviceCodeResponse>(`${baseUrl}/api/auth/device/code`);
  return response.data;
}

/**
 * Poll for the token until authorized, denied, or expired
 */
async function pollForToken(
  baseUrl: string,
  deviceCode: string,
  interval: number,
  expiresIn: number
): Promise<{ success: boolean; token?: string; error?: string }> {
  const startTime = Date.now();
  const timeoutMs = expiresIn * 1000;

  while (Date.now() - startTime < timeoutMs) {
    try {
      const response = await axios.post<DeviceTokenResponse>(`${baseUrl}/api/auth/device/token`, {
        device_code: deviceCode,
      });

      const { status, api_token, error } = response.data;

      if (status === 'authorized' && api_token) {
        return { success: true, token: api_token };
      }

      if (status === 'denied') {
        return { success: false, error: 'Authorization was denied' };
      }

      if (status === 'expired') {
        return { success: false, error: 'Authorization code expired' };
      }

      // Still pending, wait and try again
      await new Promise(resolve => setTimeout(resolve, interval * 1000));
    } catch (err: any) {
      // Handle 400/403 errors that indicate terminal states
      if (err.response?.data?.status === 'expired') {
        return { success: false, error: 'Authorization code expired' };
      }
      if (err.response?.data?.status === 'denied') {
        return { success: false, error: 'Authorization was denied' };
      }
      // For other errors, continue polling
      await new Promise(resolve => setTimeout(resolve, interval * 1000));
    }
  }

  return { success: false, error: 'Authorization timed out' };
}

/**
 * Device authorization flow (browser-based login)
 */
async function deviceAuthFlow(): Promise<void> {
  const baseUrl = getApiBaseUrl().replace('/api', ''); // Remove /api suffix for the base URL
  
  info('Starting browser-based login...');

  // Step 1: Request device code
  let deviceCode: DeviceCodeResponse;
  try {
    deviceCode = await requestDeviceCode(baseUrl);
  } catch (err: any) {
    throw new Error('Failed to initiate login. Please try again or use --api-key for manual login.');
  }

  // Step 2: Display the verification code and open browser
  console.log();
  console.log(chalk.bold('Your verification code:'));
  console.log();
  console.log(chalk.cyan.bold(`  ${deviceCode.user_code}`));
  console.log();
  console.log(`Verify this code matches what you see in your browser.`);
  console.log();

  // Always show the link so users can copy it if needed
  console.log(chalk.gray('Open this link in your browser to authorize:'));
  console.log();
  console.log(`  ${chalk.underline.cyan(deviceCode.verification_uri_complete)}`);
  console.log();

  const browserOpened = await openBrowser(deviceCode.verification_uri_complete);
  
  if (browserOpened) {
    info('Browser opened. Please authorize the CLI in the browser.');
  } else {
    info('Could not open browser automatically. Please open the link above manually.');
  }

  console.log();
  info('Waiting for authorization...');

  // Step 3: Poll for token
  const result = await pollForToken(
    baseUrl,
    deviceCode.device_code,
    deviceCode.interval,
    deviceCode.expires_in
  );

  if (!result.success) {
    throw new Error(result.error || 'Authorization failed');
  }

  // Step 4: Validate and save the token
  const apiToken = result.token!;
  const user = await validateApiKey(apiToken);

  setApiKey(apiToken);
  resetApiClient();

  if (isJsonOutput()) {
    output({ success: true, user });
  } else {
    console.log();
    const displayName = user.name || user.email || user.id;
    const emailPart = user.email ? ` (${user.email})` : '';
    success(`Logged in as ${displayName}${emailPart}`);
  }
}

/**
 * Manual API key flow (existing behavior)
 */
async function manualApiKeyFlow(): Promise<void> {
  const apiKey = await promptApiKey();
  const user = await validateApiKey(apiKey);

  setApiKey(apiKey);
  resetApiClient();

  if (isJsonOutput()) {
    output({ success: true, user });
  } else {
    const displayName = user.name || user.email || user.id;
    const emailPart = user.email ? ` (${user.email})` : '';
    success(`Logged in as ${displayName}${emailPart}`);
  }
}

export function registerLoginCommand(program: Command): void {
  program
    .command('login')
    .description('Authenticate with Nimrobo')
    .option('--api-key', 'Use manual API key entry instead of browser-based login')
    .action(async (options) => {
      try {
        if (options.apiKey) {
          await manualApiKeyFlow();
        } else {
          await deviceAuthFlow();
        }
      } catch (err) {
        handleError(err);
      }
    });
}
