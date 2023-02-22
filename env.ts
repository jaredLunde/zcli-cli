import { env as zcliEnv, z } from "./zcli.ts";

export const env = zcliEnv({
  HOME: z.string().default(""),
});
