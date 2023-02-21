import { textEncoder } from "https://deno.land/x/zcli@1.0.4/lib/text-encoder.ts";
import { init } from "https://deno.land/x/zcli@1.0.4/mod.ts";

export const app = init({
  ctx: {
    meta: {
      version: "0.1.0-dev",
      date: new Date().toISOString(),
    },
  },
});

export const { command } = app;
export { textEncoder };
export * from "https://deno.land/x/zcli@1.0.4/mod.ts";
