import { ArgParseError } from "./errors.js";
import type { ArgSchema, ArgType, InferArgs } from "./types.js";

function parseValue(raw: string, type: ArgType, key: string): string | number | boolean {
  switch (type) {
    case "string":
      return raw;
    case "number": {
      const value = Number(raw);
      if (Number.isNaN(value)) {
        throw new ArgParseError(
          `引数 "${key}" は数値である必要があります（受け取った値: "${raw}"）`
        );
      }
      return value;
    }
    case "boolean": {
      if (raw === "true") return true;
      if (raw === "false") return false;
      throw new ArgParseError(
        `引数 "${key}" はtrue/falseである必要があります（受け取った値: "${raw}"）`
      );
    }
    default: {
      // ArgTypeに新しい種類を追加したのに、ここの分岐を追加し忘れると
      // exhaustiveCheckの型がneverでなくなり、コンパイルエラーで気づける
      const exhaustiveCheck: never = type;
      throw new ArgParseError(`未知の引数型です: ${exhaustiveCheck}`);
    }
  }
}

export function parseArgs<TSchema extends ArgSchema>(
  schema: TSchema,
  rawArgs: Record<string, string>
): InferArgs<TSchema> {
  const result = {} as InferArgs<TSchema>;
  for (const key of Object.keys(schema) as (keyof TSchema)[]) {
    const type = schema[key];
    const raw = rawArgs[key as string];
    if (raw === undefined) {
      throw new ArgParseError(`引数 "${String(key)}" が指定されていません`);
    }
    result[key] = parseValue(raw, type, String(key)) as InferArgs<TSchema>[typeof key];
  }
  return result;
}
