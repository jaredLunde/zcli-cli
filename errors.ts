import { path } from "./deps.ts";
import { fmt } from "./zcli.ts";

export class ZcliError extends Error {
  code: number;
  constructor({ message, code = 1 }: { message: string; code?: number }) {
    super(message);
    this.code = code;
  }
}

export class CommandExistsError extends ZcliError {
  constructor(name: string) {
    super({
      message: `Command "${name}" already exists`,
      code: 1,
    });
  }
}

export class AppExistsError extends ZcliError {
  constructor(name: string) {
    super({
      message: `An application in "${name}" already exists`,
      code: 1,
    });
  }
}

export class CommandsArrayNotFoundError extends ZcliError {
  constructor(
    { variableName, modulePath }: { variableName: string; modulePath: string },
  ) {
    super({
      message:
        `An array named "${fmt.colors.bold(variableName)}" must be defined in ${
          fmt.colors.bold(path.relative(Deno.cwd(), modulePath))
        } to use the "add" command.\n\n` +
        `For example:\nconst ${variableName} = [];`,
      code: 1,
    });
  }
}
