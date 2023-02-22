# zCLI

A command-line tool for easily creating zCLI applications and commands with
Deno.

Get started by running `zcli init` to create a new zCLI application. For more
information, run `zcli help init`.

Then run `zcli add <command>` to add a new command to your zCLI application.

## Available Commands

| Command                                          | Description                                                                       |
| ------------------------------------------------ | --------------------------------------------------------------------------------- |
| [**`zcli`**](#-zcli)                             | A command-line tool for easily creating zCLI applications and commands with Deno. |
| [**`zcli add`**](#-zcli-add)                     | Add a new command to your zCLI application.                                       |
| [**`zcli help`**](#-zcli-help)                   | Show help for a zcli command                                                      |
| [**`zcli help commands`**](#-zcli-help-commands) | List zcli commands                                                                |
| [**`zcli init`**](#-zcli-init)                   | Create a new CLI application.                                                     |
| [**`zcli version`**](#-zcli-version)             | Show version information                                                          |

---

## `$ zcli`

A command-line tool for easily creating zCLI applications and commands with
Deno.

Get started by running `zcli init` to create a new zCLI application. For more
information, run `zcli help init`.

Then run `zcli add <command>` to add a new command to your zCLI application.

### Global Flags

These flags are available on all commands.

| Name       | Type      | Required? | Default | Description             |
| ---------- | --------- | --------- | ------- | ----------------------- |
| --help, -h | `boolean` | No        |         | Show help for a command |

[**⇗ Back to top**](#available-commands)

---

## `$ zcli add`

Add a new command to your zCLI application.

This command will create a new file in the `commands` directory of your zCLI
application.

To add a sub-command to an existing command, separate the command arguments with
a space.

For example, `zcli add foo bar` will create a new command called `bar` in the
`foo` directory.

### Arguments

The name of the command to add. To add a sub-command to an existing command,
separate the command names with a space.

| Type     | Variadic? | Description |
| -------- | --------- | ----------- |
| `string` | Yes       |             |

### Flags

| Name        | Type     | Required? | Default | Description                              |
| ----------- | -------- | --------- | ------- | ---------------------------------------- |
| --short, -s | `string` | No        |         | Add a short description for the command. |

### Global Flags

These flags are available on all commands.

| Name       | Type      | Required? | Default | Description             |
| ---------- | --------- | --------- | ------- | ----------------------- |
| --help, -h | `boolean` | No        |         | Show help for a command |

[**⇗ Back to top**](#available-commands)

---

## `$ zcli help`

Show help for a zcli command

### Arguments

| Type                                     | Variadic? | Description                   |
| ---------------------------------------- | --------- | ----------------------------- |
| `"add" \| "init" \| "version" \| "help"` | No        | The command to show help for. |

### Global Flags

These flags are available on all commands.

| Name       | Type      | Required? | Default | Description             |
| ---------- | --------- | --------- | ------- | ----------------------- |
| --help, -h | `boolean` | No        |         | Show help for a command |

[**⇗ Back to top**](#available-commands)

---

## `$ zcli help commands`

List zcli commands

### Flags

| Name      | Type      | Required? | Default | Description                              |
| --------- | --------- | --------- | ------- | ---------------------------------------- |
| --all, -a | `boolean` | No        |         | Show all commands, including hidden ones |

### Global Flags

These flags are available on all commands.

| Name       | Type      | Required? | Default | Description             |
| ---------- | --------- | --------- | ------- | ----------------------- |
| --help, -h | `boolean` | No        |         | Show help for a command |

[**⇗ Back to top**](#available-commands)

---

## `$ zcli init`

Create a new CLI application. This command will create a new directory in the
current working directory with the name of your CLI application. It will also
create the following files:

- `mod.ts` - The entry point for your zCLI application.
- `test/mod.test.ts` - A file for writing tests in your zCLI application.
- `commands` - A directory for your zCLI commands.
- `commands/mod.ts` - An auto-generated file for importing your zCLI commands.
- `deps.ts` - A file for importing dependencies.
- `zcli.ts` - A file for importing zCLI.
- `deno.jsonc` - A configuration file for Deno.

To add a command to your CLI application, run `zcli add <command>`.

To run your CLI application, run:

```
deno task run
```

To test your CLI application, run:

```
deno task test
```

To compile your CLI application, run:

```
deno task compile
```

### Arguments

The name of the CLI application. This will be used as the name of the directory
to create the CLI application in. If not provided, the current working directory
will be used.

| Type     | Variadic? | Description                       |
| -------- | --------- | --------------------------------- |
| `string` | No        | The name of the zCLI application. |

### Flags

| Name        | Type     | Required? | Default                              | Description                                      |
| ----------- | -------- | --------- | ------------------------------------ | ------------------------------------------------ |
| --cwd       | `string` | No        | `Deno.cwd()`                         | The directory to create the zCLI application in. |
| --short, -s | `string` | No        | `"An awesome new zCLI application."` | The short description of the zCLI application.   |

### Global Flags

These flags are available on all commands.

| Name       | Type      | Required? | Default | Description             |
| ---------- | --------- | --------- | ------- | ----------------------- |
| --help, -h | `boolean` | No        |         | Show help for a command |

[**⇗ Back to top**](#available-commands)

---

## `$ zcli version`

Shows version information command, including version number and build date.

### Global Flags

These flags are available on all commands.

| Name       | Type      | Required? | Default | Description             |
| ---------- | --------- | --------- | ------- | ----------------------- |
| --help, -h | `boolean` | No        |         | Show help for a command |

[**⇗ Back to top**](#available-commands)
