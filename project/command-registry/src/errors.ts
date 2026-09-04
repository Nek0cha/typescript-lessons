export class ArgParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ArgParseError";
  }
}

export class CommandNotFoundError extends Error {
  constructor(commandName: string) {
    super(`コマンド "${commandName}" は登録されていません`);
    this.name = "CommandNotFoundError";
  }
}
