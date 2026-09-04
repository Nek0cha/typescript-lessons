# デコレータは「クラスやメソッドに、後付けで処理を挟み込む」構文

デコレータ(decorator)は、クラスやそのメソッド・プロパティに対して`@関数名`という形で機能を追加できる構文です。08章で見たクラスの中身を直接書き換えずに、「呼び出しの前後に共通の処理を挟む」ような横断的な関心事を、元のコードから分離して扱うのに向いています。ログ出力・実行時間の計測・権限チェックなどが典型的な用途です。

## メソッドデコレータの基本形

TypeScript 5系では、以前の実験的なデコレータ構文(`experimentalDecorators`という設定が必要だったもの)に代わり、ECMAScriptの標準に沿ったデコレータが使えるようになっています。追加の設定は不要です。

```typescript
// src/decorators.ts
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
```

メソッドデコレータとして書く関数は、2つの引数を受け取ります。

- `target` … デコレータを付けた元のメソッドそのもの(関数として)
- `context` … そのメソッドに関する情報(メソッド名など)を持つオブジェクト

そして、元のメソッドの代わりに使われる新しい関数を`return`します。ここでは`replacementMethod`が、「ログを出力してから、元の`target`を呼び出す」という処理を挟んだ関数になっています。`<This, Args extends unknown[], Return>`という3つの型引数は、13章で学んだジェネリクスです。「元のメソッドがどんな`this`・どんな引数・どんな戻り値であっても対応できる」ようにするために必要になります。

## クラスのメソッドに適用する

適用する側は、メソッド定義の直前に`@関数名`と書くだけです。

```typescript
class Greeter {
  greet(name: string): string {
    return `こんにちは、${name}さん`;
  }
}
```

に対して`@logCall`を付けると、

```typescript
// src/index.ts
class Greeter {
  @logCall
  greet(name: string): string {
    return `こんにちは、${name}さん`;
  }
}

new Greeter().greet("瑛奈");
// [call] greet("瑛奈")
// こんにちは、瑛奈さん  ← greetの戻り値をconsole.logした場合
```

`greet`メソッドの中身(`return \`こんにちは、${name}さん\`;`)は一切変更していません。デコレータを付けるかどうかだけで、ログの有無を切り替えられます。11章で扱った`try`/`catch`によるエラーハンドリングも、同じ発想で「エラーが起きたらログに残す」デコレータとして切り出せます。

## デコレータの制約(現時点で分かっていること)

TypeScript標準のデコレータは比較的新しい機能で、周辺のビルドツールの対応状況にばらつきがあります。実際、[19章](19-testing-with-vitest.md)で扱うテストランナーvitestで、このプロジェクトを検証している最中に次のことを確認しました。

- `pnpm exec tsc --noEmit`(型チェック)では問題なくコンパイルが通る
- `pnpm dev`(tsx経由の実行)でも問題なく動作し、ログも正しく出力される
- 一方、`pnpm test`(vitestのテスト実行)で、デコレータを適用したクラスを直接importすると、変換エラー(`SyntaxError: Invalid or unexpected token`)が発生する

これは、vitestが内部で使っているコード変換ツール(oxc)が、標準デコレータの変換にまだ完全に対応しきれていないために起きている問題だと考えられます(未検証: vitestやoxcの今後のバージョンアップで解消される可能性があります)。この事情を踏まえ、`command-registry`では`CommandRegistry`クラス自体にはデコレータを適用せず、テストの対象にならない`index.ts`内の`Greeter`クラスで動作を確認する構成にしています。実際の開発でも、「このツールの組み合わせで、この機能は本当に動くか」を最後は手元で確かめる姿勢は、TypeScriptに限らずモダンなフロントエンド/バックエンド開発全般で必要になります。

## 確認問題

`logCall`デコレータを、`greet`メソッドではなく「実行にかかった時間をミリ秒単位でログに出す」`measureTime`デコレータに変えるとしたら、`replacementMethod`の中身をどう書き換えればよいでしょうか。方針だけ考えてみてください。

<details>
<summary>答えを見る</summary>

`target.call(this, ...args)`の前後で時刻を記録し、差分を計算します。

```typescript
export function measureTime<This, Args extends unknown[], Return>(
  target: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
) {
  const methodName = String(context.name);

  function replacementMethod(this: This, ...args: Args): Return {
    const start = performance.now();
    const result = target.call(this, ...args);
    const elapsed = performance.now() - start;
    console.log(`[time] ${methodName}: ${elapsed.toFixed(2)}ms`);
    return result;
  }

  return replacementMethod;
}
```

`target`が非同期関数(`Promise`を返す関数)の場合、`result`がまだ`Promise`のままの時点で時間を計測してしまう点には注意が必要です。09章の内容を踏まえると、正確に計測するには`replacementMethod`自体も`async`にして`await`する必要があります。

</details>

## 次の章

ここまで書いてきたコードが実際に正しく動いているかを、目で確認するだけでなく自動化されたテストとして残す方法を学びます。→ [19章 vitestでテストを書く](19-testing-with-vitest.md)
