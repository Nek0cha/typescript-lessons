# テストは「動作確認を、手作業からコードに移す」もの

02章から18章まで、コードが正しく動くかどうかは`console.log`の出力を目で見て確認したり、`pnpm dev`で実際に動かしてみたりする形で確かめてきました。この方法は手軽な反面、コードを変更するたびに同じ確認を手作業でやり直す必要があります。テストコードを書いておくと、この確認作業を自動化でき、「前は動いていたのに、変更で壊れていないか」を一瞬で検証できるようになります。

## vitestのインストールと基本形

`command-registry`では、テストランナーとして[vitest](https://vitest.dev/)を使っています。

```bash
pnpm add -D vitest
```

テストファイルは`describe`・`it`・`expect`という3つの関数を組み合わせて書きます。

```typescript
import { describe, it, expect } from "vitest";

describe("足し算", () => {
  it("2つの数を正しく足す", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- `describe("足し算", () => { ... })` … 関連するテストをグループにまとめる
- `it("2つの数を正しく足す", () => { ... })` … 1つの具体的なテストケース。`test`という別名でも書けます
- `expect(実際の値).toBe(期待する値)` … 実際の値と期待する値が一致するかを検証する

`package.json`の`scripts`に`"test": "vitest run"`を登録しておけば、`pnpm test`で全テストを一括実行できます。

## command-registryのテストを読む

`tests/registry.test.ts`では、`CommandRegistry`の主要な振る舞いを5つのテストケースに分けて検証しています。

```typescript
// tests/registry.test.ts
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

  // ...
});
```

09章で扱った`async`/`await`が、テストコードの中でもそのまま使われている点に注目してください。`registry.execute`は`Promise<string>`を返す非同期関数なので、テストの中でも`await`で結果を待ってから`expect`に渡しています。`it`のコールバック自体に`async`が付いているのも、そのためです。

## エラーが起きることをテストする

11章で、想定外の入力に対しては`throw`でエラーを投げる設計にしました。「正しく動くこと」だけでなく、「正しくエラーになること」もテストの対象にできます。

```typescript
it("throws CommandNotFoundError for an unregistered command", async () => {
  const registry = new CommandRegistry();
  await expect(registry.execute("nope", {})).rejects.toThrow(CommandNotFoundError);
});
```

`registry.execute("nope", {})`は、登録されていないコマンド名を渡しているので`CommandNotFoundError`を`throw`するはずです。非同期関数が`throw`すると、返される`Promise`は「失敗した(reject された)」状態になります。`expect(...).rejects.toThrow(エラークラス)`は、「この`Promise`は失敗し、しかも指定したクラスのエラーで失敗するはずだ」と検証する書き方です。同期的な関数がエラーを投げるかどうかを検証したいだけなら、`rejects`を付けずに`expect(() => 処理()).toThrow()`という書き方も使います(呼び出し自体を関数でラップする点に注意してください)。

## テストがあることの効果を体感する

試しに、`src/parse-args.ts`の`Number.isNaN(value)`という判定を、わざと`false`に固定してみてください(`if (false) {`のように変えます)。この状態で`pnpm exec tsc --noEmit`を実行しても、型としては何の問題もないため、エラーは出ません。型チェックは「値の種類」を守ってくれますが、「ロジックが正しいか」までは保証してくれないことを07章の確認問題でも見たとおりです。

しかし`pnpm test`を実行すると、「数値でない引数を渡したら`ArgParseError`が投げられるはずだ」と書かれたテストケースが失敗します。

```
FAIL  tests/registry.test.ts > CommandRegistry > throws ArgParseError when a number arg is not numeric
```

型チェックとテストは、担当する領域が違います。型チェックは「渡ってくる値の形」を静的に保証し、テストは「実際に動かしたときの振る舞い」を検証します。どちらか一方だけでは防げないバグがあるからこそ、両方を組み合わせる意味があります。動作を確認したら、`if (false) {`は元の`if (Number.isNaN(value)) {`に戻しておいてください。

## テストを書くタイミング

このプロジェクトではコードを先に完成させてからテストを書きましたが、実務では「先にテストを書いてから、それを満たす実装を書く」(テスト駆動開発、TDD)という進め方もよく使われます。どちらの順番で書いても、最終的に「実装とテストの両方がそろっている」状態を目指す点は変わりません。まずは、書いたコードに対して「これが正しく動いていると言い切れる根拠は何か」を自問し、その根拠をテストコードとして書き残す習慣から始めるとよいでしょう。

## 確認問題

`CommandRegistry`に、`list()`メソッド(登録済みのコマンド一覧を返す)のテストがまだありません。「2つのコマンドを登録したら、`list()`が2件返す」ことを検証するテストケースを書いてみてください。

<details>
<summary>答えを見る</summary>

```typescript
it("lists all registered commands", () => {
  const registry = new CommandRegistry();
  registry.register({ name: "ping", description: "", args: {}, handler: () => "pong" });
  registry.register({ name: "add", description: "", args: { a: "number", b: "number" }, handler: ({ a, b }) => String(a + b) });

  expect(registry.list()).toHaveLength(2);
});
```

`toHaveLength(2)`は、配列(や文字列)の長さを検証するマッチャーです。`list()`は非同期処理を含まないため、`await`は不要です。

</details>

## 次の章

13章から19章まで、command-registryを構成する部品を1つずつ見てきました。最後に、これらがどう組み合わさって1つのプロジェクトになっているかを、全体を通して振り返ります。→ [20章 プロジェクト全体を振り返る](20-project-walkthrough.md)
