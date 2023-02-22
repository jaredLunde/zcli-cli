// deno-lint-ignore-file no-explicit-any
import { tsMorph } from "../../deps.ts";
import { args, command, flag, flags, fmt, textEncoder, z } from "../../zcli.ts";
import { changeCase, path } from "../../deps.ts";
import {
  CommandExistsError,
  CommandsArrayNotFoundError,
} from "../../errors.ts";
import { reservedKeywords } from "../../lib/reserved-keywords.ts";

export const add = command("add", {
  short: "Add a new command to your zCLI application.",
  long: `
    Add a new command to your zCLI application.

    This command will create a new file in the \`commands\` directory of your zCLI application.

    To add a sub-command to an existing command, separate the command arguments with a space.

    For example, \`zcli add foo bar\` will create a new command called \`bar\` in the \`foo\`
    directory. If the \`foo\` command does not exist, it will be created as well.
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
    }).string().default("Deno.cwd()"),
  }),
}).run(
  async function* ({ args, flags }) {
    const cwd = flags.cwd === "Deno.cwd()"
      ? Deno.cwd()
      : path.isAbsolute(flags.cwd)
      ? flags.cwd
      : path.join(Deno.cwd(), flags.cwd);
    const name = args[args.length - 1];
    const variableName = formatName(name);
    const cmdDir = `${cwd}/commands/${args.join("/")}`;
    const cmdPath = `${cmdDir}/mod.ts`;

    try {
      Deno.statSync(cmdDir);
      Deno.statSync(cmdPath);
      throw new CommandExistsError(name);
    } catch (err) {
      if (err instanceof Deno.errors.NotFound) {
        await Deno.mkdir(cmdDir, { recursive: true });
      } else {
        throw err;
      }
    }

    try {
      for await (
        const line of putCommandModules(cmdPath, {
          variableName,
          short: flags.short,
          cwd,
        })
      ) {
        yield line;
      }
    } catch (err) {
      yield fmt.colors.yellow("Caught error. Rolling back changes...");
      await Deno.remove(cmdPath);
      yield `Removed ${cmdPath}`;

      try {
        await Deno.remove(cmdDir);
        yield `Removed ${cmdDir}`;
      } catch (_err) {
        // Ignore not empty error.
      }

      throw err;
    }
  },
);

async function* putCommandModules(
  commandPath: string,
  options: { variableName: string; short: string; cwd: string },
): AsyncIterableIterator<string> {
  const commandDir = path.dirname(commandPath);
  const name = path.basename(commandDir);

  await Deno.writeFile(
    commandPath,
    textEncoder.encode(
      COMMAND_TEMPLATE.replaceAll("{{varName}}", options.variableName)
        .replaceAll("{{name}}", name)
        .replaceAll("{{short}}", JSON.stringify(options.short))
        .replaceAll(
          "{{commandImportPath}}",
          path.join(path.relative(commandDir, options.cwd), "zcli.ts"),
        ),
    ),
  );

  yield `✅ Created command ${fmt.colors.bold(name)} in ${
    path.relative(options.cwd, commandPath)
  }`;

  const isSubCommand = commandDir !== path.join(options.cwd, "commands", name);

  if (!isSubCommand) {
    // Update the `commands/mod.ts` file to export the new command.
    for await (
      const line of putCommandReferences(`${options.cwd}/commands/mod.ts`, {
        variableName: "commands",
        cwd: options.cwd,
      })
    ) {
      yield line;
    }
  } else {
    // Update the `commands/<parent>/mod.ts` file to export the new command.
    const parentCmdDir = path.dirname(commandDir);
    const parentCmdPath = `${parentCmdDir}/mod.ts`;

    try {
      Deno.statSync(parentCmdPath);
    } catch (_err) {
      const variableName = formatName(path.basename(parentCmdDir));

      for await (
        const line of putCommandModules(parentCmdPath, {
          variableName,
          cwd: options.cwd,
          short: "",
        })
      ) {
        yield line;
      }
    }

    for await (
      const line of putCommandReferences(parentCmdPath, {
        variableName: "subCommands",
        cwd: options.cwd,
      })
    ) {
      yield line;
    }
  }
}

async function* putCommandReferences(
  modulePath: string,
  options: { variableName: string; cwd: string },
) {
  const project = new tsMorph.Project({
    useInMemoryFileSystem: true,
    manipulationSettings: {
      indentationText: tsMorph.IndentationText.TwoSpaces,
      useTrailingCommas: true,
    },
  });
  const moduleDir = path.dirname(modulePath);
  const currentCommandsMod = await Deno.readTextFile(modulePath);
  const sourceFile = project.createSourceFile(modulePath, (writer) => {
    if (currentCommandsMod) {
      writer.write(currentCommandsMod);
    } else {
      writer.writeLine(`/**
* This variable is automatically generated by \`zcli add\`. Do not remove this 
* or change its name unless you're no longer using \`zcli add\`.
*/`);
      writer
        .writeLine("export const commands = [];");
    }
  });

  let commandsArray: tsMorph.VariableDeclaration | tsMorph.Expression<any>;

  try {
    commandsArray = sourceFile.getVariableDeclarationOrThrow(
      options.variableName,
    )
      .getInitializerOrThrow();
  } catch (_err) {
    throw new CommandsArrayNotFoundError({ ...options, modulePath });
  }

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

  for await (const dirEntry of Deno.readDir(moduleDir)) {
    if (dirEntry.isDirectory) {
      try {
        const modPath = path.join(moduleDir, dirEntry.name, "mod.ts");
        const moduleSpecifier = `./${path.relative(moduleDir, modPath)}`;
        const varName = formatName(dirEntry.name);

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

          yield `✅ Added ${fmt.colors.bold(varName)} to ${
            fmt.colors.bold(options.variableName)
          } in ${path.relative(options.cwd, modulePath)}...`;
        }
      } catch (_err) {
        // Ignore
      }
    }
  }

  sourceFile.formatText();

  await Deno.writeFile(
    modulePath,
    textEncoder.encode(sourceFile.getFullText().trimStart()),
  );
}

function formatName(name: string) {
  let formattedName = changeCase.camelCase(name);

  if (reservedKeywords.has(formattedName)) {
    formattedName = `${formattedName}_`;
  }

  return formattedName;
}

const COMMAND_TEMPLATE = `import { command } from "{{commandImportPath}}";

/**
 * This variable is automatically generated by \`zcli add\`. Do not remove this 
 * or change its name unless you're no longer using \`zcli add\`.
 */
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
