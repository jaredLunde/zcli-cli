import { zcliDoc } from "https://deno.land/x/zcli@1.0.0/zcli-doc.ts";
import { app } from "../zcli.ts";
import { root } from "../mod.ts";

await zcliDoc(app, root, {
  output: "README.md",
  title: "zCLI",
  description: `
    A command-line tool for easily creating zCLI applications and commands with Deno.

    Get started by running \`zcli init\` to create a new zCLI application. For
    more information, see [\`zcli init\`](#-zcli-init).

    Then run \`zcli add <command>\` to add a new command to your zCLI application.
  `,
  ignoreCommands(_cmd, path) {
    return path.length > 1 && path.includes("help");
  },
});
