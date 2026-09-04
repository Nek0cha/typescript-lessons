# ユーティリティ型は「既存の型を加工して新しい型を作る」道具

TypeScriptには、すでにある型を元に、少し形を変えた新しい型を作るための組み込みの型がいくつも用意されています。これらをユーティリティ型（utility type）と呼びます。ゼロから型を書き直すより、既存の型を加工したほうが、元の型が変わったときに追従しやすくなります。

## Record：「キーと値の対応表」の型

`command-registry`プロジェクトで最初に登場するユーティリティ型が`Record`です。

```typescript
// src/types.ts
export type ArgSchema = Record<string, ArgType>;
```

`Record<K, V>`は、「キーの型が`K`、値の型が`V`であるオブジェクト」を表します。`Record<string, ArgType>`は、「キーは何でもよい文字列、値は`ArgType`（07章で見た`"string" | "number" | "boolean"`というユニオン型）」というオブジェクトの型です。

```typescript
type ArgSchema = Record<string, "string" | "number" | "boolean">;

const schema: ArgSchema = {
  amount: "number",
  memo: "string",
};

const invalidSchema: ArgSchema = {
  amount: "date", // エラー: "date"はArgTypeに含まれていない
};
```

05章で書いてきた`{ name: string; age: number }`のような固定のプロパティを持つオブジェクト型と違い、`Record`は「キーの名前は決まっていないが、値の型は決まっている」という状況に向いています。`command-registry`では、コマンドごとに引数の名前が違う（`add`コマンドなら`a`と`b`、`ping`コマンドなら引数なし）ため、キーを固定できず`Record`が使われています。

## Partial：全部のプロパティを省略可能にする

`Partial<T>`は、型`T`のすべてのプロパティに`?`を付けたような型を作ります。

```typescript
type CommandMeta = {
  name: string;
  description: string;
  category: string;
};

// 全プロパティが必須
const full: CommandMeta = { name: "add", description: "足し算", category: "計算" };

// Partialなら一部だけでもよい
type CommandMetaPatch = Partial<CommandMeta>;
const patch: CommandMetaPatch = { description: "2つの数を足す" }; // OK
```

「既存のデータの一部だけを更新する」ような関数の引数によく使われます。

```typescript
function updateMeta(current: CommandMeta, patch: Partial<CommandMeta>): CommandMeta {
  return { ...current, ...patch };
}
```

`{ ...current, ...patch }`はスプレッド構文で、`current`のプロパティを展開したあとに`patch`のプロパティで上書きする、という意味です。`patch`側に渡されたプロパティだけが更新されます。

## Pick / Omit：一部のプロパティだけを取り出す・除く

`Pick<T, キー>`は指定したプロパティだけを持つ型を、`Omit<T, キー>`は指定したプロパティを除いた型を作ります。

```typescript
type CommandSummary = Pick<CommandMeta, "name" | "category">;
// { name: string; category: string }

type CommandWithoutCategory = Omit<CommandMeta, "category">;
// { name: string; description: string }
```

「一覧表示のときは名前とカテゴリだけでいい」「保存するときはカテゴリを除いたものを送る」のように、同じ元の型から目的別の型を作りたいときに使います。`type`で毎回書き直すより、元の型との対応関係が明示され、`CommandMeta`側に新しいプロパティが増えても`Pick`/`Omit`の結果には自動で反映されます。

## Readonly：05章のreadonlyをオブジェクト全体にまとめて付ける

05章では、プロパティ単体に`readonly`を付ける書き方を紹介しました。`Readonly<T>`は、型`T`の全プロパティに一括で`readonly`を付けます。

```typescript
type FrozenMeta = Readonly<CommandMeta>;

const meta: FrozenMeta = { name: "add", description: "足し算", category: "計算" };
meta.name = "sub"; // エラー: Cannot assign to 'name' because it is a read-only property.
```

## Required：オプションプロパティをすべて必須にする

`Partial`の逆で、`Required<T>`はすべてのプロパティから`?`を取り除きます。

```typescript
type LooseMeta = {
  name: string;
  category?: string;
};

type StrictMeta = Required<LooseMeta>;
// { name: string; category: string }  categoryが必須になる
```

## 自分でユーティリティ型を作ることもできる

これらのユーティリティ型は特別な構文ではなく、[15章](15-mapped-types-and-keyof.md)で扱うマップ型という機能を使ってTypeScript自体の標準ライブラリの中で定義されているものです。つまり、同じ考え方を使えば自分でも似たようなユーティリティ型を作れます。実際、`command-registry`の`InferArgs<TSchema>`（[15章](15-mapped-types-and-keyof.md)で扱います）も、`ArgSchema`から`InferArgs`を導出する、自作のユーティリティ型の一種です。

## 確認問題

次のコードで、`update`関数の引数`patch`の型として適切なのは`Partial<Product>`と`Pick<Product, "price">`のどちらでしょうか。理由も考えてみてください。

```typescript
type Product = { id: number; name: string; price: number };

// 「価格だけを更新する」関数を作りたい
function update(product: Product, patch: /* ここに型を入れる */): Product {
  return { ...product, ...patch };
}

update({ id: 1, name: "ペン", price: 100 }, { price: 150 });
```

<details>
<summary>答えを見る</summary>

どちらでもコンパイルは通りますが、意図をより正確に表しているのは`Pick<Product, "price">`です。`Partial<Product>`は「`id`や`name`も含めて、どのプロパティを渡してもよい」型になってしまい、「価格だけを更新する」という関数の意図が型から読み取れません。`Pick<Product, "price">`なら、`price`以外のプロパティを渡すと（`{ price: 150, name: "ペン2" }`のように）エラーになり、関数の意図どおりの使い方を型で強制できます。

</details>

## 次の章

`ArgSchema`から`InferArgs`を導く仕組みには、まだ説明していない機能（マップ型・keyof）が使われています。次はその中身を見ていきます。→ [15章 マップ型とkeyof](15-mapped-types-and-keyof.md)
