// TypeScript 5系の標準デコレータ（experimentalDecoratorsフラグ不要）。
// メソッドの呼び出し前後にログを挟む、横断的な処理の典型例。
export function logCall<This, Args extends unknown[], Return>(
  target: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
) {
  const methodName = String(context.name);

  function replacementMethod(this: This, ...args: Args): Return {
    console.log(`[call] ${methodName}(${args.map((a) => JSON.stringify(a)).join(", ")})`);
    return target.call(this, ...args);
  }

  return replacementMethod;
}
