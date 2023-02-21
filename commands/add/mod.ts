import { args, command, flag, flags, textEncoder, z } from "../../zcli.ts";
import { changeCase, path } from "../../deps.ts";

export const add = command("add", {
  short: "Add a new command to your zCLI application.",
  long: `
    Add a new command to your zCLI application.

    This command will create a new file in the \`commands\` directory of your zCLI application.

    To add a sub-command to an existing command, separate the command arguments with a space.

    For example, \`zcli add foo bar\` will create a new command called \`bar\` in the \`foo\`
    directory.
  `,

  args: args({
    short: "The name of the command to add.",
    long: `
      The name of the command to add. To add a sub-command to an existing command, separate the 
      command names with a space.
    `,
  }).array(
    z.string(),
  ).min(1),

  flags: flags({
    short: flag({
      short: "Add a short description for the command.",
      aliases: ["s"],
    })
      .string().default(""),
  }),
}).run(
  async ({ args, flags }) => {
    const name = args[args.length - 1];
    const cmdDir = `${Deno.cwd()}/commands/${args.join("/")}`;

    try {
      Deno.statSync(cmdDir);
    } catch (_err) {
      await Deno.mkdir(cmdDir, { recursive: true });
    }

    const cmdPath = `${cmdDir}/mod.ts`;

    await Deno.writeFile(
      cmdPath,
      textEncoder.encode(
        COMMAND_TEMPLATE.replaceAll("{{varName}}", changeCase.camelCase(name))
          .replaceAll("{{name}}", name)
          .replaceAll("{{short}}", JSON.stringify(flags.short))
          .replaceAll(
            "{{commandImportPath}}",
            path.join(path.relative(cmdDir, Deno.cwd()), "zcli.ts"),
          ),
      ),
    );
  },
);

const COMMAND_TEMPLATE = `import { command } from "{{commandImportPath}}";

export const {{varName}} = command("{{name}}", {
  short: {{short}},
}).run(
  ({ args, flags, ctx }) => {
    console.log('Arguments:', args);
    console.log('Flags:', flags);
    console.log('Context:', ctx);
  },
);
`;
