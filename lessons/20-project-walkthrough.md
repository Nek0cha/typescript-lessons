# command-registryは、7つの部品が積み重なってできている

13章から19章まで、[command-registry](../project/command-registry/)プロジェクトを構成する部品を1つずつ見てきました。この章では、それぞれの部品がどう組み合わさって「コマンド名と文字列の引数を渡すと、型に沿って処理してくれる仕組み」になっているのかを、全体を通して振り返ります。

## データが流れる順序で見る

`pnpm dev`で`src/index.ts`を実行したとき、`registry.execute("add", { a: "3", b: "4" })`という1行が呼ばれてから結果が返るまでに、実際には次の順番で処理が進んでいます。

```
1. index.ts        registry.execute("add", { a: "3", b: "4" }) を呼ぶ
2. registry.ts      名前"add"に対応するCommandDefinitionをMapから探す（なければCommandNotFoundError）
3. parse-args.ts    { a: "3", b: "4" } を、スキーマ { a: "number", b: "number" } に沿って
                     { a: 3, b: 4 } へ変換する（変換できなければArgParseError）
4. types.ts         2と3の型のつながりを保証している（InferArgsが型のレベルで橋渡し）
5. registry.ts      変換済みの引数でcommand.handlerを呼び、結果の文字列を返す
```

`errors.ts`はこの流れのどこでも使われる可能性のある共通のエラークラス、`decorators.ts`は([18章](18-decorators.md)で説明した事情により)この流れそのものには組み込まれていない付加機能、という位置づけです。

## 各章がどの部品に対応していたか

| 章 | 学んだ機能 | 対応する部品 |
|---|---|---|
| [13章](13-generics.md) | ジェネリクス | `register<TSchema>`が、コマンドごとに違う引数の型を1つのメソッドで扱う |
| [14章](14-utility-types.md) | ユーティリティ型 | `ArgSchema = Record<string, ArgType>`が、引数スキーマの型の土台になる |
| [15章](15-mapped-types-and-keyof.md) | マップ型・keyof | `InferArgs<TSchema>`が、文字列タグのスキーマを実際の型へ変換する |
| [16章](16-conditional-types-and-infer.md) | 条件型・infer | プロジェクトでは未使用だが、`Awaited`や`ReturnType`など標準ユーティリティ型の仕組みを理解する土台になる |
| [17章](17-custom-type-guards.md) | 型ガード・網羅性チェック | `parseArgs`内の`switch`が、`ArgType`の追加漏れをコンパイル時に検出する |
| [18章](18-decorators.md) | デコレータ | `logCall`が、メソッド呼び出しのログを本体のロジックから分離する |
| [19章](19-testing-with-vitest.md) | テスト | `tests/registry.test.ts`が、これらすべての振る舞いを自動検証する |

## この設計が「型安全」と言える理由

`CommandRegistry`の内部では、`Map<string, CommandDefinition<any>>`という形で、実は`any`を使っています(13章のコラムで触れたとおりです)。それでも、このプロジェクト全体を「型安全」と呼べるのは、`any`が外部から見えない場所に閉じ込められているからです。

```typescript
registry.register({
  name: "add",
  args: { a: "number", b: "number" },
  handler: ({ a, b }) => a + b, // aとbがnumberであることは保証されている
  description: "",
});
```

`register`を呼ぶ側は、`any`の存在をまったく意識せずに、`args`に書いたスキーマどおりの型で`handler`を書けます。もし`handler`の中で`a`を文字列として扱おうとすれば、その場でエディタが警告を出します。「実装の内部で`any`を使うこと」と「利用者に`any`を露出させること」は別問題であり、後者さえ避けられていれば、型安全性は保たれます。これは00章で説明した「型があると開発が楽になる」という前提を、実際に1つのクラス単位で実現した例です。

## 中級編で扱わなかったこと

このプロジェクトはあくまで練習用に単純化してあります。実際にDiscord Botのコマンド処理として使うには、次のような拡張が必要になります。

- 引数の型を`string`/`number`/`boolean`だけでなく、Discordのユーザーやチャンネルといった型にも対応させる
- 1つのコマンドに対して、複数の書き方(エイリアス)を許容する
- コマンドの実行権限(管理者だけが使える、など)をチェックする仕組みを追加する

これらはこの教材の範囲を超えるため扱いませんが、`command-registry`の設計(スキーマから型を導出する、内部はシンプルに保ちつつ外部への型安全性は崩さない)という考え方自体は、そのまま応用できるはずです。

## 中級編のおわりに

00章から20章まで、TypeScriptの基礎から中級的な型の扱いまでを通してきました。ここまでの内容と、[12章](12-next-steps-discord-bot.md)で動かした最小構成のDiscord Botを組み合わせれば、`command-registry`をBotのコマンド処理部分にそのまま組み込めます。次にBotの実装そのものを深めていく段階に進むかどうかは、[README](../README.md)のロードマップを見ながら決めてください。

まずは、`command-registry`に3つ目のコマンドを1つ追加するところから試してみることをおすすめします。`src/index.ts`に新しい`CommandDefinition`を1つ書き足し、`pnpm test`が通ることを確認する、という一連の流れが、13〜19章で学んだことの総復習になります。
