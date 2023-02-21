import { tsMorph } from "../../deps.ts";
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
    cwd: flag({
      short: "The current working directory.",
    }).string().default(Deno.cwd()),
  }),
}).run(
  async ({ args, flags }) => {
    const cwd = path.isAbsolute(flags.cwd)
      ? flags.cwd
      : path.join(Deno.cwd(), flags.cwd);
    const name = args[args.length - 1];
    const varName = changeCase.camelCase(name);
    const cmdDir = `${cwd}/commands/${args.join("/")}`;
    const cmdPath = `${cmdDir}/mod.ts`;

    try {
      Deno.statSync(cmdDir);
      Deno.statSync(cmdPath);
      throw new Error(`Command "${name}" already exists.`);
    } catch (err) {
      if (err instanceof Deno.errors.NotFound) {
        await Deno.mkdir(cmdDir, { recursive: true });
      } else {
        throw err;
      }
    }

    await Deno.writeFile(
      cmdPath,
      textEncoder.encode(
        COMMAND_TEMPLATE.replaceAll("{{varName}}", varName)
          .replaceAll("{{name}}", name)
          .replaceAll("{{short}}", JSON.stringify(flags.short))
          .replaceAll(
            "{{commandImportPath}}",
            path.join(path.relative(cmdDir, cwd), "zcli.ts"),
          ),
      ),
    );

    // Update the `commands/mod.ts` file to export the new command.
    const commandsDir = `${cwd}/commands`;
    const commandsModPath = `${commandsDir}/mod.ts`;
    const project = new tsMorph.Project({
      useInMemoryFileSystem: true,
      manipulationSettings: {
        indentationText: tsMorph.IndentationText.TwoSpaces,
      },
    });
    const currentCommandsMod = await Deno.readTextFile(commandsModPath);
    const sourceFile = project.createSourceFile(commandsModPath, (writer) => {
      if (currentCommandsMod) {
        writer.write(currentCommandsMod);
      } else {
        writer.writeLine(`/**
* This file is automatically generated by \`zcli add\`. Do not edit this file directly
* unless you're no longer using \`zcli add\`.
*/`);
        writer
          .writeLine("export const commands = [];");
      }
    });

    const commandsArray = sourceFile.getVariableDeclarationOrThrow("commands")
      .getInitializerOrThrow();
    const importDeclarations = sourceFile.getImportDeclarations().flatMap(
      (decl) => {
        return decl.getNamedImports().map((imp) => {
          return {
            name: imp.getName(),
            module: decl.getModuleSpecifier().getText(),
          };
        });
      },
    );

    // Read the shallow contents of the `commands` directory.
    for await (const dirEntry of Deno.readDir(commandsDir)) {
      if (dirEntry.isDirectory) {
        try {
          const modPath = path.join(commandsDir, dirEntry.name, "mod.ts");
          const moduleSpecifier = `./${path.relative(commandsDir, modPath)}`;
          const varName = changeCase.camelCase(dirEntry.name);

          if (
            importDeclarations.find((imp) =>
              imp.name === varName || imp.module === moduleSpecifier
            )
          ) {
            continue;
          }

          Deno.statSync(modPath);

          sourceFile.insertImportDeclarations(
            (sourceFile.getLastChildByKind(tsMorph.SyntaxKind.ImportDeclaration)
              ?.getChildIndex() ?? -1) + 1,
            [
              {
                kind: tsMorph.StructureKind.ImportDeclaration,
                namedImports: [varName],
                moduleSpecifier,
              },
            ],
          );

          if (
            tsMorph.ArrayLiteralExpression.isArrayLiteralExpression(
              commandsArray,
            )
          ) {
            commandsArray.addElement(varName, { useNewLines: true });
          }
        } catch (_err) {
          // Ignore
        }
      }
    }

    sourceFile.formatText();

    await Deno.writeFile(
      commandsModPath,
      textEncoder.encode(sourceFile.getFullText().trimStart()),
    );
  },
);

const COMMAND_TEMPLATE = `import { command } from "{{commandImportPath}}";

const subCommands: ReturnType<typeof command>[] = [];

export const {{varName}} = command("{{name}}", {
  short: {{short}},
  commands: subCommands,
}).run(
  ({ args, flags, ctx }) => {
    console.log('Arguments:', args);
    console.log('Flags:', flags);
    console.log('Context:', ctx);
  },
);
`;
