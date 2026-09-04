import { logCall } from "./decorators.js";
import { CommandRegistry } from "./registry.js";
import type { CommandDefinition } from "./types.js";

// logCallデコレータの動作確認用。CommandRegistry自体には適用していない
// （テスト実行時のビルドツールとの相性の都合。詳しくは18章を参照）。
class Greeter {
  @logCall
  greet(name: string): string {
    return `こんにちは、${name}さん`;
  }
}

const registry = new CommandRegistry();

const pingCommand: CommandDefinition<Record<string, never>> = {
  name: "ping",
  description: "生存確認",
  args: {},
  handler: () => "pong!",
};

const addCommand: CommandDefinition<{ a: "number"; b: "number" }> = {
  name: "add",
  description: "2つの数を足す",
  args: { a: "number", b: "number" },
  handler: ({ a, b }) => `${a} + ${b} = ${a + b}`,
};

registry.register(pingCommand);
registry.register(addCommand);

async function main() {
  console.log(new Greeter().greet("Neko"));

  console.log(await registry.execute("ping", {}));
  console.log(await registry.execute("add", { a: "3", b: "4" }));

  try {
    await registry.execute("add", { a: "abc", b: "4" });
  } catch (error) {
    if (error instanceof Error) {
      console.log(`想定通りのエラー: ${error.name}: ${error.message}`);
    }
  }
}

main();
