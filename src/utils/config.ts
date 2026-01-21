import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Config, ContextType, NetContext } from '../types';

const CONFIG_DIR = path.join(os.homedir(), '.nimrobo');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

const DEFAULT_CONTEXT: NetContext = {
  orgId: null,
  postId: null,
  channelId: null,
  userId: null,
};

const DEFAULT_CONFIG: Config = {
  API_BASE_URL: 'https://app.nimroboai.com/api',
  //NET_API_BASE_URL: 'http://localhost:3000',
  NET_API_BASE_URL: 'https://net-315108406092.asia-south1.run.app/', 
  API_KEY: null,
  defaultProject: null,
  context: { ...DEFAULT_CONTEXT },
};

export function ensureConfigDir(): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

export function loadConfig(): Config {
  ensureConfigDir();

  if (!fs.existsSync(CONFIG_FILE)) {
    return { ...DEFAULT_CONFIG };
  }

  try {
    const content = fs.readFileSync(CONFIG_FILE, 'utf-8');
    const config = JSON.parse(content);
    return { ...DEFAULT_CONFIG, ...config };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function saveConfig(config: Config): void {
  ensureConfigDir();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export function getApiKey(): string | null {
  const config = loadConfig();
  return config.API_KEY;
}

export function setApiKey(apiKey: string): void {
  const config = loadConfig();
  config.API_KEY = apiKey;
  saveConfig(config);
}

export function clearApiKey(): void {
  const config = loadConfig();
  config.API_KEY = null;
  saveConfig(config);
}

export function getDefaultProject(): string | null {
  const config = loadConfig();
  return config.defaultProject;
}

export function setDefaultProject(projectId: string | null): void {
  const config = loadConfig();
  config.defaultProject = projectId;
  saveConfig(config);
}

export function getApiBaseUrl(): string {
  const config = loadConfig();
  return config.API_BASE_URL;
}

export function isAuthenticated(): boolean {
  return getApiKey() !== null;
}

export function resolveProjectId(projectIdOrDefault: string | undefined): string | null {
  if (!projectIdOrDefault) {
    return null;
  }

  if (projectIdOrDefault.toLowerCase() === 'default') {
    return getDefaultProject();
  }

  return projectIdOrDefault;
}

// Net API Base URL
export function getNetApiBaseUrl(): string {
  const config = loadConfig();
  return config.NET_API_BASE_URL;
}

export function setNetApiBaseUrl(url: string): void {
  const config = loadConfig();
  config.NET_API_BASE_URL = url;
  saveConfig(config);
}

// Context management for net commands
const CONTEXT_KEYS: Record<ContextType, keyof NetContext> = {
  org: 'orgId',
  post: 'postId',
  channel: 'channelId',
  user: 'userId',
};

export function getContext(type: ContextType): string | null {
  const config = loadConfig();
  if (!config.context) {
    return null;
  }
  return config.context[CONTEXT_KEYS[type]];
}

export function setContext(type: ContextType, id: string): void {
  const config = loadConfig();
  if (!config.context) {
    config.context = { ...DEFAULT_CONTEXT };
  }
  config.context[CONTEXT_KEYS[type]] = id;
  saveConfig(config);
}

export function clearContext(type: ContextType): void {
  const config = loadConfig();
  if (!config.context) {
    config.context = { ...DEFAULT_CONTEXT };
  }
  config.context[CONTEXT_KEYS[type]] = null;
  saveConfig(config);
}

export function clearAllContext(): void {
  const config = loadConfig();
  config.context = { ...DEFAULT_CONTEXT };
  saveConfig(config);
}

export function getAllContext(): NetContext {
  const config = loadConfig();
  return config.context || { ...DEFAULT_CONTEXT };
}

/**
 * Resolves an ID that might be "current" to the actual stored context ID.
 * Returns the provided ID if not "current", or the context ID if "current" is passed.
 * Throws error if "current" is passed but no context is set.
 */
export function resolveId(idOrCurrent: string | undefined, contextType: ContextType): string | null {
  if (!idOrCurrent) {
    return null;
  }

  if (idOrCurrent.toLowerCase() === 'current') {
    const contextId = getContext(contextType);
    if (!contextId) {
      throw new Error(`No ${contextType} context set. Use 'net ${contextType}s use <id>' to set one.`);
    }
    return contextId;
  }

  return idOrCurrent;
}

/**
 * Gets required ID - either from argument or from context if "current".
 * Throws if neither is available.
 */
export function requireId(idOrCurrent: string | undefined, contextType: ContextType, argName: string): string {
  const resolved = resolveId(idOrCurrent, contextType);
  if (!resolved) {
    throw new Error(`${argName} is required. Provide it as an argument or use 'current' to use the stored context.`);
  }
  return resolved;
}
