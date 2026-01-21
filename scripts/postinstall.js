#!/usr/bin/env node

/**
 * Postinstall script to set up shell completion
 * Runs silently - does not fail the install if completion setup fails
 */

const path = require('path');

async function main() {
  // Skip in CI environments
  if (process.env.CI || process.env.CONTINUOUS_INTEGRATION) {
    return;
  }

  // Skip if explicitly disabled
  if (process.env.NIMROBO_SKIP_COMPLETION === '1') {
    return;
  }

  try {
    // Import the compiled completion module
    const completionPath = path.join(__dirname, '..', 'dist', 'completion.js');
    const { installCompletionSilent } = require(completionPath);
    await installCompletionSilent();
  } catch (err) {
    // Fail silently - completion is optional
    // This might fail if dist doesn't exist yet (first install)
  }
}

main();
