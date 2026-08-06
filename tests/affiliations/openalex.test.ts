import { describe, expect, it } from "vitest";
import { OpenAlexClient } from "../../src/affiliations/sources/openalex";

describe("OpenAlex DOI batching", () => {
  it("uses one doi filter with canonical DOI URLs", async () => {
    let requested = "";
    const client = new OpenAlexClient("test-key", { request: async (url) => { requested = url; return { results: [] }; } });
    await client.worksByDoi(["10.1000/a", "10.1000/b"]);
    expect(requested).toContain("filter=doi%3Ahttps%3A%2F%2Fdoi.org%2F10.1000%2Fa%7Chttps%3A%2F%2Fdoi.org%2F10.1000%2Fb");
    expect(requested).toContain("api_key=test-key");
  });
});
