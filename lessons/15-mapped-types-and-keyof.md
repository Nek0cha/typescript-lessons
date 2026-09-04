# マップ型は「型のfor...of」、keyofは「オブジェクトのキー名だけを取り出す型」

14章の`Partial`や`Pick`は、TypeScriptにあらかじめ用意されたユーティリティ型でした。この章では、その中身がどう作られているかを理解するための2つの機能、マップ型（mapped type）と`keyof`を見ていきます。ゴールは、`command-registry`の中核である`InferArgs<TSchema>`を読み解けるようになることです。

## keyof：オブジェクト型からキー名だけのユニオン型を作る

```typescript
type CommandMeta = {
  name: string;
  description: string;
  category: string;
};

type CommandMetaKey = keyof CommandMeta;
// "name" | "description" | "category" というユニオン型になる
```

`keyof CommandMeta`は、`CommandMeta`が持つプロパティ名だけを取り出し、07章で扱ったリテラル型のユニオンにします。プロパティを直接文字列で書くのではなく`keyof`を使う利点は、`CommandMeta`の定義が変わったときに自動で追従することです。

```typescript
function getMeta<K extends keyof CommandMeta>(meta: CommandMeta, key: K): CommandMeta[K] {
  return meta[key];
}

const meta: CommandMeta = { name: "add", description: "足し算", category: "計算" };
getMeta(meta, "name");        // string
getMeta(meta, "nonexistent"); // エラー: keyof CommandMetaに含まれないキーは渡せない
```

`CommandMeta[K]`のような書き方をインデックスアクセス型（indexed access type）と呼びます。「`CommandMeta`というオブジェクト型から、キー`K`に対応する値の型を取り出す」という意味で、実際のオブジェクトから値を取り出す`meta[key]`という書き方と対になっています。

## マップ型：オブジェクトの各プロパティに同じ変換を適用する

マップ型は、「あるオブジェクト型の全プロパティに対して、同じルールで新しい型を作る」ための構文です。`{ [K in キーの集合]: 変換後の型 }`という形をしています。

```typescript
type Optional<T> = {
  [K in keyof T]?: T[K];
};

type OptionalMeta = Optional<CommandMeta>;
// { name?: string; description?: string; category?: string }
```

これは、14章で使った`Partial<T>`と全く同じ動作です。実際、TypeScriptの標準ライブラリで定義されている`Partial<T>`の中身は、ほぼこの`Optional<T>`と同じマップ型です。`[K in keyof T]`の部分が「`T`の各キー`K`について繰り返す」という意味で、06章で見た`for...of`が配列の各要素を1つずつ処理するのと似た感覚で捉えると理解しやすくなります。

## command-registryのInferArgsを読み解く

`command-registry`の型定義の中心にあるのが、このマップ型です。

```typescript
// src/types.ts
type ArgTypeMap = {
  string: string;
  number: number;
  boolean: boolean;
};

export type ArgSchema = Record<string, ArgType>;

export type InferArgs<TSchema extends ArgSchema> = {
  [K in keyof TSchema]: ArgTypeMap[TSchema[K]];
};
```

`TSchema`は、例えば`{ a: "number", b: "number" }`のような、コマンドの引数スキーマです。`InferArgs<TSchema>`が何をしているか、順番に分解します。

1. `keyof TSchema` … `TSchema`のキー名を取り出す。`{ a: "number", b: "number" }`なら`"a" | "b"`
2. `[K in keyof TSchema]` … そのキー1つずつ（`K`）について、以下の変換を繰り返す
3. `TSchema[K]` … キー`K`に対応する値（例えば`K`が`"a"`なら`"number"`というリテラル型）を取り出す
4. `ArgTypeMap[TSchema[K]]` … その値（`"number"`）を`ArgTypeMap`に通して、実際のTypeScriptの型（`number`）に変換する

結果として、`InferArgs<{ a: "number"; b: "number" }>`は`{ a: number; b: number }`という型になります。「`"number"`という文字列のタグ」から「実際の`number`型」への変換を、`ArgTypeMap`という小さな対応表を経由して行っているのがポイントです。この仕組みのおかげで、`registry.register`に渡す`args`スキーマを書くだけで、`handler`の引数の型が自動的に決まります。

```typescript
// src/index.ts
const addCommand: CommandDefinition<{ a: "number"; b: "number" }> = {
  name: "add",
  description: "2つの数を足す",
  args: { a: "number", b: "number" },
  handler: ({ a, b }) => `${a} + ${b} = ${a + b}`, // aとbはどちらもnumberとして扱われる
};
```

`args`に`{ a: "number", b: "number" }`と書いた瞬間、`handler`の中の`a`と`b`は自動的に`number`型になります。試しに`args`を`{ a: "number", b: "string" }`に変えてみると、`handler`の中の`a + b`が数値の足し算として成立しなくなり、その場でエディタが警告を出すはずです。文字列のタグを書き換えるだけで、そこから連動する型がすべて更新される、というのがマップ型を実プロジェクトで使う醍醐味です。

## typeof：値から型を逆算する

`keyof`が型からキー名を取り出す機能だったのに対し、`typeof`は既存の値から型を作る機能です(演算子としての`typeof`とは別物で、型の位置で使われる`typeof`です)。

```typescript
const defaultMeta = {
  name: "unknown",
  description: "",
  category: "misc",
};

type DefaultMeta = typeof defaultMeta;
// { name: string; description: string; category: string }
```

「型を先に定義して、それに沿った値を書く」のではなく「すでにある値から、型を後付けで取り出す」という逆方向の使い方です。設定オブジェクトなど、値そのものが先に存在し、その形をそのまま型として再利用したい場面で使います。

## 確認問題

次のマップ型`Stringify<T>`は、オブジェクトの全プロパティの値を`string`型に変換するつもりで書かれていますが、1か所間違っています。どこか考えてみてください。

```typescript
type Stringify<T> = {
  [K in T]: string;
};
```

<details>
<summary>答えを見る</summary>

マップ型の`[K in ...]`の右側には、「反復する対象となるキーの集合」を渡す必要がありますが、ここでは`T`(オブジェクト型そのもの)を渡してしまっています。正しくは`keyof T`(`T`のキー名の集合)を渡す必要があります。

```typescript
type Stringify<T> = {
  [K in keyof T]: string;
};
```

</details>

## 次の章

マップ型と並んで型を動的に組み立てる手段に、条件型と`infer`があります。command-registryでは使っていませんが、TypeScriptの型定義を読むうえで避けて通れない機能なので、標準ライブラリの`Awaited<T>`を題材に見ていきます。→ [16章 条件型とinfer](16-conditional-types-and-infer.md)
