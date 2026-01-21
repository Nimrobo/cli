import tabtab from 'tabtab';

// Define the complete command tree for Nimrobo CLI
const completionTree: Record<string, string[] | Record<string, string[]>> = {
  // Top-level commands
  '': ['login', 'logout', 'status', 'screen', 'net', 'completion', 'install', '--json', '--help', '--version'],

  // Screen commands
  'screen': ['user', 'projects', 'links', 'sessions'],

  // Screen > user
  'screen user': ['profile'],
  'screen user profile': ['--json'],

  // Screen > projects
  'screen projects': ['list', 'create', 'get', 'update', 'use'],
  'screen projects list': ['--json'],
  'screen projects create': ['--json', '--name', '--description', '--time-limit', '--system-prompt', '--evaluation-prompt'],
  'screen projects get': ['--json'],
  'screen projects update': ['--json', '--name', '--description', '--time-limit', '--system-prompt', '--evaluation-prompt'],
  'screen projects use': ['--json'],

  // Screen > links
  'screen links': ['list', 'create', 'cancel', 'update'],
  'screen links list': ['--json', '--project', '--status', '--limit', '--skip'],
  'screen links create': ['--json', '--project', '--name', '--email', '--phone', '--max-uses', '--expires'],
  'screen links cancel': ['--json'],
  'screen links update': ['--json', '--name', '--max-uses', '--expires'],

  // Screen > sessions
  'screen sessions': ['status', 'transcript', 'audio', 'evaluation', 'summary', 'summary-regenerate'],
  'screen sessions status': ['--json'],
  'screen sessions transcript': ['--json'],
  'screen sessions audio': ['--json', '--output'],
  'screen sessions evaluation': ['--json'],
  'screen sessions summary': ['--json'],
  'screen sessions summary-regenerate': ['--json'],

  // Net commands
  'net': ['my', 'users', 'orgs', 'posts', 'applications', 'channels', 'context'],

  // Net > my
  'net my': ['profile', 'update', 'orgs', 'posts', 'applications', 'invites', 'join-requests', 'summary'],
  'net my profile': ['--json'],
  'net my update': ['--json', '--file', '--stdin', '--content-file', '--name', '--city', '--country', '--bio', '--content'],
  'net my orgs': ['--json', '--limit', '--skip'],
  'net my posts': ['--json', '--limit', '--skip'],
  'net my applications': ['--json', '--limit', '--skip', '--status', '--keyword'],
  'net my invites': ['--json', '--limit', '--skip'],
  'net my join-requests': ['--json', '--limit', '--skip'],
  'net my summary': ['--json'],

  // Net > users
  'net users': ['get', 'search', 'use'],
  'net users get': ['--json', '--use'],
  'net users search': ['--json', '--keyword', '--name', '--city', '--country', '--limit', '--skip', '--sort', '--order'],
  'net users use': ['--json'],

  // Net > orgs
  'net orgs': ['create', 'list', 'get', 'update', 'delete', 'leave', 'posts', 'use', 'join', 'accept-invite', 'decline-invite', 'cancel-join-request', 'manage'],
  'net orgs create': ['--json', '--file', '--stdin', '--name', '--description', '--website', '--use'],
  'net orgs list': ['--json', '--keyword', '--name', '--status', '--limit', '--skip', '--sort', '--order'],
  'net orgs get': ['--json', '--use'],
  'net orgs update': ['--json', '--file', '--stdin', '--name', '--description', '--website'],
  'net orgs delete': ['--json'],
  'net orgs leave': ['--json'],
  'net orgs posts': ['--json', '--limit', '--skip'],
  'net orgs use': ['--json'],
  'net orgs join': ['--json', '--file', '--stdin', '--message'],
  'net orgs accept-invite': ['--json'],
  'net orgs decline-invite': ['--json'],
  'net orgs cancel-join-request': ['--json'],

  // Net > orgs > manage
  'net orgs manage': ['members', 'remove-member', 'update-role', 'invite', 'invites', 'cancel-invite', 'join-requests', 'approve-request', 'reject-request'],
  'net orgs manage members': ['--json', '--limit', '--skip'],
  'net orgs manage remove-member': ['--json'],
  'net orgs manage update-role': ['--json', '--role'],
  'net orgs manage invite': ['--json', '--file', '--stdin', '--email', '--role'],
  'net orgs manage invites': ['--json', '--limit', '--skip'],
  'net orgs manage cancel-invite': ['--json'],
  'net orgs manage join-requests': ['--json', '--limit', '--skip'],
  'net orgs manage approve-request': ['--json', '--role'],
  'net orgs manage reject-request': ['--json'],

  // Net > posts
  'net posts': ['create', 'list', 'get', 'update', 'close', 'delete', 'apply', 'applications', 'check-applied', 'use'],
  'net posts create': ['--json', '--file', '--stdin', '--content-file', '--title', '--expires', '--org', '--compensation', '--employment', '--remote', '--education', '--salary', '--salary-currency', '--hourly-rate', '--hourly-currency', '--experience', '--skills', '--city', '--country', '--urgent', '--content', '--use'],
  'net posts list': ['--json', '--keyword', '--status', '--org', '--compensation', '--employment', '--remote', '--education', '--salary-min', '--salary-max', '--hourly-min', '--hourly-max', '--experience-min', '--experience-max', '--skills', '--city', '--country', '--urgent', '--include-applied', '--limit', '--skip', '--sort', '--order'],
  'net posts get': ['--json', '--use'],
  'net posts update': ['--json', '--file', '--stdin', '--content-file', '--expires', '--content', '--title', '--compensation', '--employment', '--remote', '--salary', '--hourly-rate', '--experience', '--skills', '--city', '--country'],
  'net posts close': ['--json'],
  'net posts delete': ['--json'],
  'net posts apply': ['--json', '--file', '--stdin', '--content-file', '--cover-note', '--expected-salary', '--availability', '--content'],
  'net posts applications': ['--json', '--status', '--keyword', '--limit', '--skip'],
  'net posts check-applied': ['--json'],
  'net posts use': ['--json'],

  // Net > applications
  'net applications': ['get', 'accept', 'reject', 'withdraw', 'batch-action'],
  'net applications get': ['--json'],
  'net applications accept': ['--json', '--file', '--stdin', '--channel-expires', '--context'],
  'net applications reject': ['--json', '--file', '--stdin', '--reason'],
  'net applications withdraw': ['--json'],
  'net applications batch-action': ['--json', '--file', '--stdin', '--action', '--ids', '--channel-expires', '--reason'],

  // Net > channels
  'net channels': ['list', 'get', 'messages', 'send', 'message', 'mark-read', 'mark-unread', 'read-all', 'use'],
  'net channels list': ['--json', '--status', '--application', '--post', '--limit', '--skip'],
  'net channels get': ['--json', '--use'],
  'net channels messages': ['--json', '--limit', '--skip'],
  'net channels send': ['--json', '--file', '--stdin', '--content-file', '--message'],
  'net channels message': ['--json'],
  'net channels mark-read': ['--json'],
  'net channels mark-unread': ['--json'],
  'net channels read-all': ['--json'],
  'net channels use': ['--json'],

  // Net > context
  'net context': ['show', 'clear', 'get'],
  'net context show': ['--json'],
  'net context clear': ['--json', 'org', 'post', 'channel', 'user', 'all'],
  'net context get': ['--json', 'org', 'post', 'channel', 'user'],

  // Completion commands
  'completion': ['install', 'uninstall'],

  // Install commands
  'install': ['skills'],
};

/**
 * Handle shell completion requests
 */
export async function handleCompletion(): Promise<boolean> {
  // Check for completion request via environment variables
  // Supports both tabtab format and standard COMP_* variables
  const compLine = process.env.COMP_LINE;
  const compCword = process.env.COMP_CWORD;
  const compPoint = process.env.COMP_POINT;

  // Only respond if this is a completion request
  if (!compLine) {
    // Try tabtab format as fallback
    const env = tabtab.parseEnv(process.env);
    if (!env.complete) {
      return false;
    }
    // Use tabtab's parsed environment
    return handleCompletionWithEnv(env.line, env.lastPartial);
  }

  // Parse completion context from COMP_* environment variables
  // Use COMP_POINT to respect cursor position (zsh uses this heavily)
  const cursor = Number.isFinite(Number(compPoint)) ? Number(compPoint) : undefined;
  const lineForCompletion = cursor !== undefined ? compLine.slice(0, cursor) : compLine;
  const words = lineForCompletion.split(/\s+/).filter(Boolean);
  const wordIndex = parseInt(compCword || '0', 10);

  // Determine the partial word being completed
  // If cursor is at end of line with trailing space, we're completing a new word
  const trailingSpace = lineForCompletion.endsWith(' ');
  const lastWord = trailingSpace ? '' : (words[wordIndex] || '');

  return handleCompletionWithEnv(lineForCompletion, lastWord);
}

/**
 * Internal handler for completion with parsed environment
 */
async function handleCompletionWithEnv(line: string, lastPartial: string): Promise<boolean> {
  // Build the completion key from the command line
  const words = line.split(/\s+/).filter(Boolean);

  // Remove the CLI name from the start
  const commandWords = words.slice(1);

  // If the user is typing a new word, don't include the partial word
  const lastWord = lastPartial || '';
  if (lastWord && commandWords.length > 0 && commandWords[commandWords.length - 1] === lastWord) {
    commandWords.pop();
  }

  // Build the key to look up in the completion tree
  const key = commandWords.join(' ');

  // Get completions for this context
  let completions = completionTree[key] || completionTree[''];

  // If it's an array, use it directly
  if (Array.isArray(completions)) {
    // Filter completions based on what the user has already typed
    if (lastWord) {
      completions = completions.filter(c => c.startsWith(lastWord));
    }

    // Don't suggest options that have already been used
    const usedOptions = words.filter((w: string) => w.startsWith('-'));
    completions = completions.filter(c => !usedOptions.includes(c));

    // Output completions (one per line for shell consumption)
    completions.forEach(c => console.log(c));
  }

  return true;
}

/**
 * Detect the current shell from environment
 */
function detectShell(): string | null {
  const shell = process.env.SHELL || '';
  if (shell.includes('zsh')) return 'zsh';
  if (shell.includes('bash')) return 'bash';
  if (shell.includes('fish')) return 'fish';
  return null;
}

/**
 * Install shell completions (interactive mode)
 */
export async function installCompletion(): Promise<void> {
  await tabtab.install({
    name: 'nimrobo',
    completer: 'nimrobo',
  });
  console.log('Shell completion installed! Please restart your shell or source your shell config.');
}

/**
 * Install shell completions silently (auto-detect shell)
 * Used for postinstall hook
 */
export async function installCompletionSilent(): Promise<void> {
  const shell = detectShell();

  if (!shell) {
    // Can't detect shell, skip silently
    return;
  }

  try {
    const fs = await import('fs');
    const path = await import('path');
    const os = await import('os');

    const homeDir = os.homedir();
    let configFile: string;
    let completionScript: string;

    // Determine shell config file and completion script
    // These scripts set tabtab-compatible env vars and call nimrobo
    switch (shell) {
      case 'bash':
        configFile = path.join(homeDir, '.bashrc');
        completionScript = `
# nimrobo completion - added by nimrobo CLI
_nimrobo_completions() {
  local IFS=$'\\n'
  COMPREPLY=($(COMP_CWORD="$COMP_CWORD" \\
               COMP_LINE="$COMP_LINE" \\
               COMP_POINT="$COMP_POINT" \\
               nimrobo 2>/dev/null))
}
complete -o default -F _nimrobo_completions nimrobo
`;
        break;

      case 'zsh':
        configFile = path.join(homeDir, '.zshrc');
        completionScript = `
# nimrobo completion - added by nimrobo CLI
if ! command -v compdef >/dev/null 2>&1; then
  autoload -Uz compinit
  compinit
fi
_nimrobo() {
  local IFS=$'\\n'
  local completions=($(COMP_CWORD="$((CURRENT-1))" \\
                       COMP_LINE="$BUFFER" \\
                       COMP_POINT="$CURSOR" \\
                       nimrobo 2>/dev/null))
  _describe 'command' completions
}
compdef _nimrobo nimrobo
`;
        break;

      case 'fish':
        configFile = path.join(homeDir, '.config', 'fish', 'config.fish');
        // Ensure fish config directory exists
        const fishConfigDir = path.join(homeDir, '.config', 'fish');
        if (!fs.existsSync(fishConfigDir)) {
          fs.mkdirSync(fishConfigDir, { recursive: true });
        }
        completionScript = `
# nimrobo completion - added by nimrobo CLI
function __nimrobo_completions
  set -lx COMP_LINE (commandline -cp)
  set -lx COMP_POINT (string length (commandline -cp))
  set -lx COMP_CWORD (count (commandline -opc))
  nimrobo 2>/dev/null
end
complete -c nimrobo -a '(__nimrobo_completions)' -f
`;
        break;

      default:
        return;
    }

    // Check if already installed
    if (fs.existsSync(configFile)) {
      const content = fs.readFileSync(configFile, 'utf8');
      if (content.includes('nimrobo completion')) {
        // Already installed
        return;
      }
    }

    // Append completion script to config file
    fs.appendFileSync(configFile, completionScript);
    console.log(`Shell completion installed for ${shell}. Restart your shell to enable.`);
  } catch {
    // Fail silently - completion is optional
  }
}

/**
 * Uninstall shell completions
 */
export async function uninstallCompletion(): Promise<void> {
  await tabtab.uninstall({
    name: 'nimrobo',
  });
  console.log('Shell completion uninstalled.');
}
