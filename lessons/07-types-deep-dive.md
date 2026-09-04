# typeとinterfaceはほぼ同じ、迷ったらtypeでよい

これまでの章で`type User = { name: string; age: number }`のような書き方を使ってきました。TypeScriptにはもう1つ、`interface`という似た機能があります。

```typescript
// typeでの定義
type User = {
  name: string;
  age: number;
};

// interfaceでの定義
interface User2 {
  name: string;
  age: number;
}
```

見た目以外の違いは主に2点です。`interface`は同じ名前で複数回宣言すると自動的にマージされる（あとで機能を拡張しやすい）一方、`type`はユニオン型（後述）や、オブジェクト以外の型（`string`や`number`の組み合わせなど）も表現できるという柔軟さがあります。

このシリーズでは基本的に`type`を使います。用途による使い分けが必要になるのはライブラリ設計など高度な場面が多く、Discord Botの開発規模ではほとんど意識しなくても困りません。「オブジェクトの形を定義したいときは`interface`を使う」という慣習を採用しているプロジェクトも多いため、他の人のコードを読むときのために存在だけ覚えておいてください。

## ユニオン型：AかBかのどちらか

06章で軽く登場した`string | number`のような書き方をユニオン型（union type）と呼びます。「複数の型のうち、どれか1つ」を表します。

```typescript
type ID = string | number;

const id1: ID = "user-001"; // OK
const id2: ID = 42;         // OK
const id3: ID = true;       // エラー: booleanは許可されていない
```

決まった文字列の組み合わせにも使えます。06章の`Rank`型がその例です。

```typescript
type Status = "pending" | "approved" | "rejected";

let status: Status = "pending";
status = "approved"; // OK
status = "done";     // エラー: '"done"' is not assignable to type 'Status'.
```

`string`型そのものを使うと、どんな文字列でも入ってしまいます。取り得る値があらかじめ決まっているなら、文字列のユニオン型で表現しておくことで、タイプミス（`"aproved"`のような打ち間違い）をコンパイル時に検出できるようになります。

## インターセクション型：AとBを両方満たす

ユニオン型が「どちらか」であるのに対し、インターセクション型（intersection type）は「両方の性質を併せ持つ」型を作ります。`&`を使います。

```typescript
type Named = { name: string };
type Aged = { age: number };

type Person = Named & Aged;

const p: Person = { name: "瑛奈", age: 20 }; // nameとage、両方が必要
```

使用頻度はユニオン型ほど高くありませんが、「共通のプロパティを持つ型」と「個別のプロパティを持つ型」を分けて定義し、あとから組み合わせたい場面で使います。

## リテラル型

`"pending"`のような特定の文字列そのものも、TypeScriptでは1つの型として扱えます。これをリテラル型と呼びます。ユニオン型の説明で使った`Status`型は、実は3つのリテラル型（`"pending"`、`"approved"`、`"rejected"`）を`|`でつないだものです。

```typescript
let direction: "left" | "right" = "left";
```

文字列だけでなく数値やbooleanにもリテラル型はあります（`type Dice = 1 | 2 | 3 | 4 | 5 | 6`のように）。「取り得る値の候補が有限個に決まっている」場面で、`string`や`number`より厳密な制約をかけたいときに使います。

## Discord Botで使う型のイメージ

ここまでの機能を組み合わせると、実際にDiscord Botで扱うようなデータの型に近いものが書けます。次のコードはイメージをつかむための例です（実際のdiscord.jsライブラリの型とは異なります。詳細は[12章](12-next-steps-discord-bot.md)で扱います）。

```typescript
type MessageType = "text" | "image" | "embed";

type DiscordMessage = {
  id: string;
  authorName: string;
  content: string;
  type: MessageType;
  editedAt?: string; // 編集されていなければundefined
};

function summarize(message: DiscordMessage): string {
  if (message.type === "image") {
    return `${message.authorName}さんが画像を送信しました`;
  }
  return `${message.authorName}: ${message.content}`;
}
```

`type`とユニオン型・オプションプロパティを組み合わせるだけで、「あり得るメッセージの形」をかなり具体的に表現できることが分かると思います。

## 確認問題

次の関数は、`Status`型のすべての値を扱っているつもりですが、TypeScriptの観点では1つのケースが抜けています。どのケースか考えてみてください。

```typescript
type Status = "pending" | "approved" | "rejected";

function label(status: Status): string {
  if (status === "pending") {
    return "審査中";
  }
  if (status === "approved") {
    return "承認済み";
  }
  // ここに到達したとき、statusの型は"rejected"のはずだが……
  return "承認済み"; // rejectedのときも"承認済み"と返してしまっている（バグ）
}
```

<details>
<summary>答えを見る</summary>

コード自体はコンパイルエラーにはなりません（戻り値は常に`string`型なので型としては正しい）。ただし、`"rejected"`のときに本来返すべき「却下」に相当する文字列ではなく`"承認済み"`を返してしまっており、ロジックとしてのバグです。型があっても、こうした条件分岐の抜けまでは自動的には検出できないことがある、という例として押さえておいてください。`switch`文と`default`ケースを使う、あるいは各分岐を`else if`で網羅的に書くことで気づきやすくなります。

</details>

## 次の章

型でデータの形を表現できるようになったところで、次はデータと処理をひとまとめにする「クラス」を学びます。→ [08章 クラス](08-classes.md)
