import { path } from "./deps.ts";
import { softwareLicenses } from "./lib/software-licenses.ts";
import { config as zcliConfig, z } from "./zcli.ts";
import { env } from "./env.ts";

export const configShape = {
  org: z.ostring(),
  license: z.enum(softwareLicenses),
};

export const config = zcliConfig(configShape, {
  defaultConfig: {
    license: "mit",
  },
  format: "toml",
  path: path.join(env.get("HOME"), ".zcli/config.toml"),
});

export const configPaths = deepKeys(configShape) as [string, ...string[]];

function deepKeys(obj: Record<string | number | symbol, unknown>): string[] {
  // Use tail call optimization
  const stack = [obj];
  const keys: string[] = [];

  while (stack.length > 0) {
    const obj = stack.pop();
    for (const key in obj) {
      keys.push(key);
      const value = obj[key];

      if (value instanceof z.ZodObject) {
        stack.push(value.shape);
      }
    }
  }

  return keys;
}
