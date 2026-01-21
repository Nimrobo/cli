import { Command } from 'commander';
import { registerSessionsStatusCommand } from './status';
import { registerSessionsTranscriptCommand } from './transcript';
import { registerSessionsAudioCommand } from './audio';
import { registerSessionsEvaluationCommand } from './evaluation';
import { registerSessionsSummaryCommand } from './summary';
import { registerSessionsSummaryRegenerateCommand } from './summary-regenerate';

export function registerSessionsCommands(program: Command): void {
  const sessionsCommand = program
    .command('sessions')
    .description('Session management commands');

  registerSessionsStatusCommand(sessionsCommand);
  registerSessionsTranscriptCommand(sessionsCommand);
  registerSessionsAudioCommand(sessionsCommand);
  registerSessionsEvaluationCommand(sessionsCommand);
  registerSessionsSummaryCommand(sessionsCommand);
  registerSessionsSummaryRegenerateCommand(sessionsCommand);
}
