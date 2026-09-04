import { CommandNotFoundError } from "./errors.js";
import { parseArgs } from "./parse-args.js";
import type { ArgSchema, CommandDefinition } from "./types.js";

export class CommandRegistry {
  // 内部的にはanyでまとめて保持する（コマンドごとに引数の型がバラバラなので、
  // 1つのMapに型パラメータをそのまま持たせることはできない）。
  // 外に公開しているregister/executeのシグネチャが型安全なら、
  // 内部実装がanyでもこのクラスの利用者が型の恩恵を失うことはない。
  private commands = new Map<string, CommandDefinition<any>>();

  register<TSchema extends ArgSchema>(command: CommandDefinition<TSchema>): void {
    this.commands.set(command.name, command);
  }

  list(): CommandDefinition[] {
    return [...this.commands.values()];
  }

  async execute(name: string, rawArgs: Record<string, string>): Promise<string> {
    const command = this.commands.get(name);
    if (command === undefined) {
      throw new CommandNotFoundError(name);
    }
    const args = parseArgs(command.args, rawArgs);
    return command.handler(args);
  }
}
