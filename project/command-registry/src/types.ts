// 引数1つの型を、実行時にも判定できる文字列タグで表す
export type ArgType = "string" | "number" | "boolean";

// タグ文字列から、対応するTypeScriptの型を引けるようにする対応表
type ArgTypeMap = {
  string: string;
  number: number;
  boolean: boolean;
};

// 1コマンドが受け取る引数の並び（例: { amount: "number", memo: "string" }）
export type ArgSchema = Record<string, ArgType>;

// スキーマから、実際に渡ってくる引数オブジェクトの型を導出する（マップ型）
export type InferArgs<TSchema extends ArgSchema> = {
  [K in keyof TSchema]: ArgTypeMap[TSchema[K]];
};

export type CommandHandler<TSchema extends ArgSchema> = (
  args: InferArgs<TSchema>
) => string | Promise<string>;

export type CommandDefinition<TSchema extends ArgSchema = ArgSchema> = {
  name: string;
  description: string;
  args: TSchema;
  handler: CommandHandler<TSchema>;
};
