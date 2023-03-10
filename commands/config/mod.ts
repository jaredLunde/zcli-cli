import { command } from "../../zcli.ts";
import { set } from "./set/mod.ts";
import { get } from "./get/mod.ts";
import { delete_ } from "./delete/mod.ts";
import { config as zcliConfig, configPaths } from "../../config.ts";

/**
 * This variable is automatically generated by `zcli add`. Do not remove this
 * or change its name unless you're no longer using `zcli add`.
 */
const subCommands: ReturnType<typeof command>[] = [
  set,
  get,
  delete_,
];

export const config = command("config", {
  short: "Manage your zCLI configuration.",
  long: `
    This command manages your zCLI configuration. You can use it to set, get, and 
    delete configuration values. Running this command without any subcommands will
    print your current configuration.

    Your configuration is stored in a TOML file at \`~/.zcli/config.toml\`. 

    The following configuration values are available:

    - \`license\`: The default license to use when creating a new application.
    - \`org\`: The default organization to use when creating a new application.

    For example, to set the default license to MIT, run: 
    \`\`\`
    zcli config set license "mit"
    \`\`\`
  `,
  commands: subCommands,
}).run(
  async function* () {
    for (const key of configPaths) {
      const value = await zcliConfig.get(key);
      if (value === undefined) continue;
      yield `${key} = ${JSON.stringify(value)}`;
    }
  },
);
