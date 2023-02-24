import { textEncoder } from "https://deno.land/x/zcli@1.1.0/lib/text-encoder.ts";
import { init } from "https://deno.land/x/zcli@1.1.0/mod.ts";

const VERSION = "0.1.0-dev";
const COMMIT = "development";

export const app = init({
  ctx: {
    meta: {
      version: VERSION,
      commit: COMMIT,
      date: new Date().toISOString(),
    },
  },
});

export const { command } = app;
export { textEncoder };
export * from "https://deno.land/x/zcli@1.1.0/mod.ts";
