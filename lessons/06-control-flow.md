# if/forの書き方自体はJavaScriptと同じ、TypeScript独自なのは「型の絞り込み」

条件分岐（if/switch）や繰り返し（for/while）の構文そのものは、TypeScriptでもJavaScriptと変わりません。この章では構文をざっと確認したあと、TypeScriptならではの機能である「型の絞り込み（narrowing）」に重点を置いて説明します。

## if / else / switch

```typescript
const score: number = 75;

if (score >= 80) {
  console.log("合格");
} else if (score >= 60) {
  console.log("追試");
} else {
  console.log("不合格");
}
```

分岐のパターンが多い場合は`switch`を使うと見通しがよくなります。

```typescript
type Rank = "S" | "A" | "B" | "C";
const rank: Rank = "A";

switch (rank) {
  case "S":
    console.log("最高評価");
    break;
  case "A":
    console.log("優秀");
    break;
  case "B":
  case "C":
    console.log("標準");
    break;
}
```

`type Rank = "S" | "A" | "B" | "C"`はユニオン型（union type）と呼ばれる書き方で、「決められた文字列のどれか」しか代入できない型です。詳しくは[07章](07-types-deep-dive.md)で扱いますが、`switch`と組み合わせると「あり得るケースをすべて網羅しているか」をTypeScriptがチェックしてくれるようになり、相性が良い機能です。

## for / while

```typescript
const names: string[] = ["瑛奈", "たかし", "みさき"];

// 昔ながらのfor文。インデックス(添字)を自分で管理する
for (let i = 0; i < names.length; i++) {
  console.log(names[i]);
}

// for...of: 配列の中身を1件ずつ取り出す。インデックス管理が不要になる
for (const name of names) {
  console.log(name);
}

// while: 条件を満たす間ループし続ける
let count = 0;
while (count < 3) {
  console.log(count);
  count++;
}
```

配列の中身を単純に1件ずつ処理するだけなら、`for...of`のほうがインデックスの数え間違い（off-by-oneエラー）が起きにくく、読みやすいコードになります。このシリーズでは基本的に`for...of`を使います。

## 配列メソッド：map / filter / find

繰り返し処理は`for`文でも書けますが、TypeScript（JavaScript）には配列に対する専用のメソッドが用意されており、目的別に使うと意図が伝わりやすくなります。

```typescript
const numbers: number[] = [1, 2, 3, 4, 5];

// map: 各要素を変換した新しい配列を作る
const doubled = numbers.map((n) => n * 2);
// [2, 4, 6, 8, 10]

// filter: 条件に合う要素だけを残した新しい配列を作る
const evens = numbers.filter((n) => n % 2 === 0);
// [2, 4]

// find: 条件に最初に合致した要素を1つ返す（見つからなければundefined）
const firstOver3 = numbers.find((n) => n > 3);
// 4
```

`for`文で同じことを書くと、「新しい配列を用意する→ループする→条件を判定する→追加する」という手順を毎回自分で組み立てる必要があります。`map`や`filter`はその手順に名前が付いたショートカットだと捉えると理解しやすいです。

```typescript
// filterと同じ処理をfor文で書いた場合
const evens2: number[] = [];
for (const n of numbers) {
  if (n % 2 === 0) {
    evens2.push(n);
  }
}
```

Discord Botの開発では「受信したメッセージの中からコマンドっぽいものだけを`filter`する」「ユーザー一覧を`map`して表示用の文字列に変換する」といった場面で頻繁に使うことになるため、早めに慣れておくと後が楽になります。

## 型の絞り込み（narrowing）

03章で`unknown`型を扱った際、`typeof value === "string"`という条件のあとでは`value`が`string`として扱われる、という挙動を紹介しました。これが型の絞り込みです。「複数の可能性がある型を、条件分岐によって1つに絞り込む」という意味で、TypeScript特有の重要な考え方です。

```typescript
function printLength(value: string | number) {
  if (typeof value === "string") {
    // ここではvalueはstringだとTypeScriptが理解している
    console.log(value.length);
  } else {
    // ここではvalueはnumberだとTypeScriptが理解している
    console.log(value.toString().length);
  }
}
```

`value: string | number`は「stringかnumberのどちらか」を意味するユニオン型です（[07章](07-types-deep-dive.md)で詳しく扱います）。`string`にしかない`.length`プロパティは、`if (typeof value === "string")`の中でしか使えません。`typeof`による分岐をTypeScriptが解析し、各分岐の中でどちらの型に絞られているかを自動的に判断してくれています。

`null`や`undefined`の可能性がある値を扱うときも同じ考え方を使います。

```typescript
function greet(name: string | undefined) {
  if (name === undefined) {
    console.log("こんにちは、名無しさん");
    return;
  }
  // ここから先ではnameはstringだと確定している
  console.log(`こんにちは、${name}さん`);
}
```

「値を使う前に、あり得る可能性を1つずつ条件分岐でつぶしていく」という書き方に慣れておくと、実行時に`undefined`のプロパティを読んで落ちる、というよくあるバグを設計段階で防げるようになります。

## 確認問題

次の関数は、`typeof`による絞り込みを使わずに書かれているため、TypeScriptがエラーを出します。原因と直し方を考えてみてください。

```typescript
function double(value: string | number) {
  return value * 2;
}
```

<details>
<summary>答えを見る</summary>

`value`が`string`の可能性もあるため、`*`演算子をそのまま使えません（`Operator '*' cannot be applied to types 'string | number'.`）。次のように`typeof`で絞り込んでから処理を分ける必要があります。

```typescript
function double(value: string | number): number {
  if (typeof value === "number") {
    return value * 2;
  }
  return Number(value) * 2;
}
```

</details>

## 次の章

ここまで`string | number`のようなユニオン型を軽く使ってきましたが、次はこうした型の組み合わせ方をまとめて学びます。→ [07章 型をもっと使いこなす](07-types-deep-dive.md)
