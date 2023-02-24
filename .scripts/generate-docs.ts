import { zcliDoc } from "https://deno.land/x/zcli@1.1.0/zcli-doc.ts";
import { app } from "../zcli.ts";
import { root } from "../mod.ts";

await zcliDoc(app, root, {
  output: "README.md",
  title: "zCLI",
  description: `
    A command-line tool for easily managing
    [zCLI](https://github.com/jaredLunde/zcli) applications and commands with Deno.
    
    ## Installation
    
    \`\`\`sh
    curl -fsSL https://raw.githubusercontent.com/jaredLunde/zcli-cli/main/install.sh | sh
    \`\`\`

    ## Getting Started

    Get started by running \`zcli init\` to create a new zCLI application. For more
    information, see [\`zcli init\`](#-zcli-init).
    
    Then run \`zcli add <command>\` to add a new command to your zCLI application.
    The command will be created in the \`commands\` directory of your zCLI application.
    It will be automatically imported and added to the \`commands\` array in your
    \`commands/mod.ts\` file. Sub-commands are supported.
  `,
  ignoreCommands(_cmd, path) {
    return path.length > 1 && path.includes("help");
  },
});
