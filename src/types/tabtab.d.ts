declare module 'tabtab' {
  interface TabtabEnv {
    complete: boolean;
    words: number;
    point: number;
    line: string;
    partial: string;
    last: string;
    lastPartial: string;
    prev: string;
  }

  interface InstallOptions {
    name: string;
    completer: string;
    shell?: string;
  }

  interface UninstallOptions {
    name: string;
  }

  function parseEnv(env: NodeJS.ProcessEnv): TabtabEnv;
  function log(completions: string[]): Promise<void>;
  function install(options: InstallOptions): Promise<void>;
  function uninstall(options: UninstallOptions): Promise<void>;
  function installShellConfig(options: { name: string; completer: string; shell: string; location?: string }): Promise<void>;

  export { parseEnv, log, install, uninstall, installShellConfig, TabtabEnv, InstallOptions, UninstallOptions };
  export default {
    parseEnv,
    log,
    install,
    uninstall,
    installShellConfig,
  };
}
