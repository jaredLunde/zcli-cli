import { describe, it } from "https://deno.land/std@0.178.0/testing/bdd.ts";
import { assertSpyCalls } from "https://deno.land/std@0.178.0/testing/mock.ts";
import { stub } from "https://deno.land/std@0.178.0/testing/mock.ts";
import { assert } from "https://deno.land/std@0.178.0/testing/asserts.ts";
import { root } from "../mod.ts";

describe("zcli", () => {
  it("should print version", async () => {
    const stdoutStub = stub(Deno.stdout, "write");
    await root.execute(["version"]);

    assertSpyCalls(stdoutStub, 1);
    assert(
      new TextDecoder().decode(stdoutStub.calls[0].args[0]).startsWith(
        "zcli v",
      ),
    );

    stdoutStub.restore();
  });
});
