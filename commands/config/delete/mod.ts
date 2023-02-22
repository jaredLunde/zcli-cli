import { args, command, z } from "../../../zcli.ts";
import { config, configPaths } from "../../../config.ts";

/**
 * This variable is automatically generated by `zcli add`. Do not remove this
 * or change its name unless you're no longer using `zcli add`.
 */
const subCommands: ReturnType<typeof command>[] = [];

export const delete_ = command("delete", {
  short: "Delete a configuration value.",
  commands: subCommands,
  args: args({
    short: "The key to delete.",
  }).tuple([z.enum(configPaths)]),
}).run(
  async function* ({ args }) {
    const [key] = args;
    await config.delete(key);
    const newValue = await config.get(key);

    if (newValue) {
      yield `${key} = ${newValue}`;
    } else {
      yield `${key} deleted`;
    }
  },
);
