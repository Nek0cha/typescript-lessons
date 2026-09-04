import { describe, expect, it } from "vitest";
import { ArgParseError, CommandNotFoundError } from "../src/errors.js";
import { CommandRegistry } from "../src/registry.js";

describe("CommandRegistry", () => {
  it("registers and executes a command with no args", async () => {
    const registry = new CommandRegistry();
    registry.register({
      name: "ping",
      description: "",
      args: {},
      handler: () => "pong",
    });

    expect(await registry.execute("ping", {})).toBe("pong");
  });

  it("parses raw string args into typed args before calling the handler", async () => {
    const registry = new CommandRegistry();
    registry.register({
      name: "add",
      description: "",
      args: { a: "number", b: "number" },
      handler: ({ a, b }) => String(a + b),
    });

    expect(await registry.execute("add", { a: "2", b: "5" })).toBe("7");
  });

  it("throws CommandNotFoundError for an unregistered command", async () => {
    const registry = new CommandRegistry();
    await expect(registry.execute("nope", {})).rejects.toThrow(CommandNotFoundError);
  });

  it("throws ArgParseError when a number arg is not numeric", async () => {
    const registry = new CommandRegistry();
    registry.register({
      name: "add",
      description: "",
      args: { a: "number", b: "number" },
      handler: ({ a, b }) => String(a + b),
    });

    await expect(registry.execute("add", { a: "abc", b: "5" })).rejects.toThrow(ArgParseError);
  });

  it("throws ArgParseError when a required arg is missing", async () => {
    const registry = new CommandRegistry();
    registry.register({
      name: "add",
      description: "",
      args: { a: "number", b: "number" },
      handler: ({ a, b }) => String(a + b),
    });

    await expect(registry.execute("add", { a: "2" })).rejects.toThrow(ArgParseError);
  });
});
