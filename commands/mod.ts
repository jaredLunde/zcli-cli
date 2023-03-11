import { app, completion, version } from "../zcli.ts";
import { add } from "./add/mod.ts";
import { init } from "./init/mod.ts";
import { config } from "./config/mod.ts";

export const commands = [
  add,
  init,
  config,
];

export const root = app.command("zcli", {
  short:
    "A command-line tool for easily creating zCLI applications and commands with Deno.",
  long: `
    A command-line tool for easily creating zCLI applications and commands with Deno.

    Get started by running \`zcli init\` to create a new zCLI application. For
    more information, run \`zcli help init\`.

    Then run \`zcli add <command>\` to add a new command to your zCLI application.
  `,
  commands: [
    ...commands,
    version(app),
    completion(app),
  ],
});
