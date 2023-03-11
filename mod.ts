import { root } from "./commands/mod.ts";
import { ZcliError } from "./errors.ts";

if (import.meta.main) {
  try {
    await root.execute();
  } catch (err) {
    if (err instanceof ZcliError) {
      console.error(err.message);
      Deno.exit(err.code);
    }

    throw err;
  }
}
