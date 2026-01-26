import { Command } from 'commander';
import { setJsonOutput } from './utils/output';
import { registerLoginCommand } from './commands/login';
import { registerLogoutCommand } from './commands/logout';
import { registerStatusCommand } from './commands/status';
import { registerUserCommands } from './commands/user';
import { registerProjectsCommands } from './commands/projects';
import { registerLinksCommands } from './commands/links';
import { registerSessionsCommands } from './commands/sessions';
import { registerNetCommands } from './commands/net';
import { registerInstallCommands } from './commands/install/skills';
import { registerOnboardCommand } from './commands/onboard';
import { handleCompletion, installCompletion, uninstallCompletion } from './completion';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageJson = require('../package.json');

// Handle shell completion requests before parsing commands
(async () => {
  const isCompletion = await handleCompletion();
  if (isCompletion) {
    process.exit(0);
  }

  const program = new Command();

  program
    .name('nimrobo')
    .description('CLI tool for interacting with Nimrobo AI APIs')
    .version(packageJson.version)
    .option('--json', 'Output in JSON format')
    .hook('preAction', (thisCommand) => {
      const opts = thisCommand.opts();
      if (opts.json) {
        setJsonOutput(true);
      }
    });

  // Global auth commands (shared across both platforms)
  registerLoginCommand(program);
  registerLogoutCommand(program);
  registerStatusCommand(program);
  registerOnboardCommand(program);

  // Voice commands (Voice Screening Platform)
  const voiceCommand = program
    .command('voice')
    .description('Voice screening platform commands');

  registerUserCommands(voiceCommand);
  registerProjectsCommands(voiceCommand);
  registerLinksCommands(voiceCommand);
  registerSessionsCommands(voiceCommand);

  // Net commands (Matching Network)
  registerNetCommands(program);

  // Completion commands
  const completionCommand = program
    .command('completion')
    .description('Shell completion commands');

  completionCommand
    .command('install')
    .description('Install shell tab completion')
    .action(async () => {
      await installCompletion();
    });

  completionCommand
    .command('uninstall')
    .description('Uninstall shell tab completion')
    .action(async () => {
      await uninstallCompletion();
    });

  // Install commands (skills, etc.)
  registerInstallCommands(program);

  program.parse(process.argv);
})();
