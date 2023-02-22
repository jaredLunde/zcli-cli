import { args, command, flag, flags, fmt, z } from "../../zcli.ts";
import { path } from "../../deps.ts";
import { AppExistsError } from "../../errors.ts";

export const init = command("init", {
  use: [`zcli init <name> [flags]`, `zcli init [flags]`].join("\n  "),
  short: "Create a new CLI application.",
  long: `
    Create a new CLI application. This command will create a new directory in the
    current working directory with the name of your CLI application. It will also
    create the following files:

    - \`mod.ts\` - The entry point for your zCLI application.
    - \`test/mod.test.ts\` - A file for writing tests in your zCLI application.
    - \`commands\` - A directory for your zCLI commands.
    - \`commands/mod.ts\` - An auto-generated file for importing your zCLI commands.
    - \`deps.ts\` - A file for importing dependencies.
    - \`errors.ts\` - A file for defining custom errors.
    - \`zcli.ts\` - A file for importing zCLI.
    - \`deno.jsonc\` - A configuration file for Deno.

    To add a command to your CLI application, run \`zcli add <command>\`.
    
    To run your CLI application, run:
    \`\`\`
    deno task run
    \`\`\`

    To test your CLI application, run:
    \`\`\`
    deno task test
    \`\`\`
    
    To compile your CLI application, run:
    \`\`\`
    deno task compile
    \`\`\`

    To generate documentation for your CLI application, run:
    \`\`\`
    deno task docs
    \`\`\`
  `,

  args: args({
    short: "The name of the zCLI application.",
    long: `
      The name of the CLI application. This will be used as the name of the directory
      to create the CLI application in. If not provided, the current working directory
      will be used.
    `,
  }).tuple([z.string().describe("The name of the zCLI application.")])
    .optional(),

  flags: flags({
    cwd: flag({
      short: "The directory to create the zCLI application in.",
    })
      .string().default(Deno.cwd()),
    short: flag({
      short: "The short description of the zCLI application.",
      aliases: ["s"],
    })
      .string().default("An awesome new zCLI application."),
    license: flag({
      short: "The license of the zCLI application.",
      aliases: ["l"],
    }).enum([
      "agpl3",
      "apache",
      "bsd2",
      "bsd3",
      "cc0",
      "cc_by",
      "cc_by_nc",
      "cc_by_nc_sa",
      "cc_by_nd",
      "cc_by_sa",
      "epl",
      "gpl2",
      "gpl3",
      "isc",
      "lgpl",
      "mit",
      "mpl",
      "unilicense",
      "wtfpl",
      "x11",
      "zlib",
    ]).default("mit"),
    org: flag({
      short: "The organization of the zCLI application.",
      long: `
        The organization of the zCLI application. This will be used in the license.
      `,
      aliases: ["o"],
    }).string().default(""),
  }),
}).run(
  async function* ({ args, flags }) {
    const cwd = path.isAbsolute(flags.cwd)
      ? flags.cwd
      : path.join(Deno.cwd(), flags.cwd);
    const appName = args[0] || path.basename(cwd);
    const appDir = args[0] ? `${cwd}/${appName}` : cwd;

    if (appName === path.basename(cwd)) {
      if (
        !window.confirm(
          `Are you sure you want to create a zCLI application in this directory? (${appName})`,
        )
      ) {
        Deno.exit(1);
      }
    }

    try {
      Deno.statSync(appDir);
    } catch (_err) {
      await Deno.mkdir(appDir, { recursive: true });
    }

    try {
      Deno.statSync(`${appDir}/mod.ts`);
      Deno.statSync(`${appDir}/commands`);
      throw new AppExistsError(appName);
    } catch (err) {
      // Ignore
      if (!(err instanceof Deno.errors.NotFound)) {
        throw err;
      }
    }

    await Promise.all([
      Deno.mkdir(path.join(appDir, ".scripts"), { recursive: true }),
      Deno.mkdir(path.join(appDir, "commands"), { recursive: true }),
      Deno.mkdir(path.join(appDir, "test"), { recursive: true }),
    ]);

    const files: Promise<void>[] = [];

    // Create the `deno.jsonc` file.
    files.push(
      Deno.writeTextFile(
        `${appDir}/deno.jsonc`,
        DENO_JSONC.replaceAll("{{appName}}", appName),
      ),
    );

    // Create the `mod.ts` file.
    files.push(
      Deno.writeTextFile(
        `${appDir}/mod.ts`,
        MOD_TS.replaceAll("{{appName}}", appName).replaceAll(
          "{{short}}",
          JSON.stringify(flags.short),
        ),
      ),
    );

    // Create the `errors.ts` file.
    files.push(
      Deno.writeTextFile(
        `${appDir}/errors.ts`,
        ERRORS_TS.replaceAll("{{appName}}", appName),
      ),
    );

    // Create the `test/mod.test.ts` file.
    files.push(
      Deno.writeTextFile(
        `${appDir}/test/mod.test.ts`,
        MOD_TEST_TS.replaceAll("{{appName}}", appName),
      ),
    );

    // Create the `deps.ts` file.
    files.push(Deno.writeTextFile(`${appDir}/deps.ts`, DEPS_TS));

    // Create the `zcli.ts` file.
    files.push(Deno.writeTextFile(`${appDir}/zcli.ts`, ZCLI_TS));

    // Create the `commands/mod.ts` file.
    files.push(
      Deno.writeTextFile(`${appDir}/commands/mod.ts`, COMMANDS_MOD_TS),
    );

    // Create a README.md file.
    files.push(
      Deno.writeTextFile(
        `${appDir}/README.md`,
        README_MD.replaceAll("{{appName}}", appName).replaceAll(
          "{{short}}",
          flags.short,
        ),
      ),
    );

    // Create a script to generate documentation
    files.push(
      Deno.writeTextFile(
        `${appDir}/.scripts/generate-docs.ts`,
        GENERATE_DOCS_TS.replaceAll("{{appName}}", appName).replaceAll(
          "{{short}}",
          JSON.stringify(flags.short),
        ),
      ),
    );

    files.push(
      fetch(
        `https://raw.githubusercontent.com/licenses/license-templates/master/templates/${flags.license}.txt`,
      ).then((res) => {
        return res.text();
      }).then((license) => {
        return Deno.writeTextFile(
          `${appDir}/LICENSE`,
          license.replaceAll(
            "{{ year }}",
            new Date().getFullYear() + "",
          )
            .replaceAll("{{ project }}", appName)
            .replaceAll("{{ organization }}", flags.org),
        );
      }),
    );

    await Promise.all(files);
    yield `✨ Created ${fmt.colors.bold(appName)} in ${appDir}`;
  },
);

const DENO_JSONC = JSON.stringify(
  {
    tasks: {
      run: `deno run --allow-all mod.ts`,
      "compile":
        "deno task compile:macos && deno task compile:macos-arm && deno task compile:linux && deno task compile:windows",
      "compile:macos":
        "deno compile --allow-all --target x86_64-apple-darwin --output bin/macos/{{appName}} mod.ts",
      "compile:macos-arm":
        "deno compile --allow-all --target aarch64-apple-darwin --output bin/macos-arm/{{appName}} mod.ts",
      "compile:linux":
        "deno compile --allow-all --target x86_64-unknown-linux-gnu --output bin/linux/{{appName}} mod.ts",
      "compile:windows":
        "deno compile --allow-all --target x86_64-pc-windows-msvc --output bin/windows/{{appName}} mod.ts",
      "docs": "deno run --allow-all .scripts/generate-docs.ts",
      "test": "deno test --allow-all",
    },
    "test": {
      "files": {
        "include": ["test"],
      },
    },
  },
  null,
  2,
);

const MOD_TS = `import { app, version } from "./zcli.ts";
import { commands } from "./commands/mod.ts";
import { AppError } from "./errors.ts";

export const root = app.command("{{appName}}", {
  short: {{short}},
  long: {{short}},
  commands: [
    ...commands,
    version(app)
  ],
});

if (import.meta.main) {
  try {
    await root.execute();
  } catch (err) {
    // Catch known errors and exit with the appropriate code.
    if (err instanceof AppError) {
      console.error(err.message);
      Deno.exit(err.code);
    }
    
    throw err;
  }
}
`;

const ERRORS_TS = `
export class AppError extends Error {
  readonly code: number = 1;

  constructor({ message, code }: { message: string; code?: number }) {
    super(message);
    this.code = code ?? 1;
  }
}
`.trimStart();

const MOD_TEST_TS = `
import { describe, it } from "https://deno.land/std/testing/bdd.ts";
import { assertSpyCalls } from "https://deno.land/std/testing/mock.ts";
import { stub } from "https://deno.land/std/testing/mock.ts";
import { assert } from "https://deno.land/std/testing/asserts.ts";
import { root } from "../mod.ts";

describe("{{appName}}", () => {
  it("should print version", async () => {
    const stdoutStub = stub(Deno.stdout, "write");
    await root.execute(["version"]);

    assertSpyCalls(stdoutStub, 1);
    assert(
      new TextDecoder().decode(stdoutStub.calls[0].args[0]).startsWith(
        "{{appName}} v",
      ),
    );

    stdoutStub.restore();
  });
});
`.trimStart();

const ZCLI_TS = `import { init } from "https://deno.land/x/zcli/mod.ts";

export const app = init({
  ctx: {
    meta: {
      version: "0.1.0-dev",
      date: new Date().toISOString(),
    }
  }
});

export const { command } = app
export * from "https://deno.land/x/zcli/mod.ts";
`;

const COMMANDS_MOD_TS = `
/**
 * This variable is automatically generated by \`zcli add\`. Do not remove this 
 * or change its name unless you're no longer using \`zcli add\`.
 */
export const commands = [];
`.trimStart();

const README_MD = `# {{appName}}

> {{short}}

## Getting Started

Run your zCLI application:

\`\`\`sh
deno task run --help
\`\`\`

Add a command to your zCLI application:

\`\`\`sh
zcli add [name]
\`\`\`

Compile your zCLI application:

\`\`\`sh
deno task compile
\`\`\`

Test your zCLI application:

\`\`\`sh
deno task test
\`\`\`

Generate documentation for your zCLI application:

\`\`\`sh
deno task docs
\`\`\`

## Credits

🎨 Created with [zCLI](https://github.com/jaredLunde/zcli-cli)
`;

const GENERATE_DOCS_TS = `
import { zcliDoc } from "https://deno.land/x/zcli/zcli-doc.ts";
import { app } from "../zcli.ts";
import { root } from "../mod.ts";

try {
  Deno.statSync("docs");
} catch(_err) {
  await Deno.mkdir("docs");
}

await zcliDoc(app, root, {
  output: "docs/{{appName}}.md",
  title: "{{appName}}",
  description: {{short}},
  ignoreCommands(_cmd, path) {
    return path.length > 1 && path.includes("help");
  },
});
`.trimStart();

const DEPS_TS = `
export * as path from "https://deno.land/std/path/mod.ts";
`.trimStart();
