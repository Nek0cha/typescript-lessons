# 条件型は「型の世界のif文」、inferはそこから型を抜き出す道具

条件型（conditional type）は、型が特定の条件を満たすかどうかによって、結果の型を分岐させる機能です。command-registryのコードには直接登場しませんが、`Promise`を扱う型（`Awaited<T>`）や関数の型を扱う型（`ReturnType<T>`）など、TypeScriptの標準ライブラリの随所で使われている、避けて通れない機能です。

## 条件型の基本構文

```typescript
type IsString<T> = T extends string ? true : false;

type A = IsString<"hello">; // true
type B = IsString<42>;      // false
```

`T extends string ? true : false`は、「`T`が`string`型に代入可能なら`true`型、そうでなければ`false`型」という意味です。06章のif文の型版だと考えると分かりやすくなります。`extends`は13章で「型引数を制約する」役割でも登場しましたが、条件型の中では「〜であるかどうかを判定する」役割になります。

## infer：条件式の中から、型の一部を抜き出す

条件型の右辺（`extends`のあとの型）の中で`infer 変数名`と書くと、マッチした部分の型を、その場で新しい型変数として取り出せます。

```typescript
type UnwrapArray<T> = T extends (infer Item)[] ? Item : T;

type C = UnwrapArray<string[]>; // string
type D = UnwrapArray<number>;   // number（配列でなければそのまま）
```

`T extends (infer Item)[]`は、「`T`が何かの配列であれば、その中身の型を`Item`という名前で受け取る」という意味です。`Item`は右側の`true`の位置（ここでは`Item`自身）でだけ使える一時的な型変数です。

## 実例：PromiseからTを取り出す

09章で扱った`Promise<string>`のような型から、中身の`string`だけを取り出したい場面を考えます。

```typescript
type MyAwaited<T> = T extends Promise<infer U> ? U : T;

type E = MyAwaited<Promise<string>>; // string
type F = MyAwaited<number>;          // number（Promiseでなければそのまま）
```

`T extends Promise<infer U>`は、「`T`が`Promise<何か>`の形をしていれば、その`何か`を`U`として取り出す」という意味です。これは実は車輪の再発明で、TypeScriptには最初から`Awaited<T>`という同じ働きをする組み込みの型が用意されています。09章で`async`関数の戻り値が常に`Promise<T>`になると説明しましたが、「その`Promise`を最終的に`await`したら何型になるか」を表すのが`Awaited<T>`です。

## 実例：関数の戻り値の型を取り出す

もう1つの標準ユーティリティ型`ReturnType<T>`も、条件型と`infer`で作られています。

```typescript
function add(a: number, b: number): number {
  return a + b;
}

type AddReturn = ReturnType<typeof add>; // number
```

15章で見た`typeof`と組み合わせ、「関数`add`の型」から「その戻り値の型」だけを取り出しています。`ReturnType`のおおまかな中身は次のようなイメージです。

```typescript
type MyReturnType<T> = T extends (...args: unknown[]) => infer R ? R : never;
```

「`T`が何かの関数であれば、その戻り値の型を`R`として取り出す」という条件型です。

## command-registryのCommandHandlerに当てはめる

`command-registry`の`CommandHandler`型は、次のように定義されていました([15章](15-mapped-types-and-keyof.md))。

```typescript
// src/types.ts
export type CommandHandler<TSchema extends ArgSchema> = (
  args: InferArgs<TSchema>
) => string | Promise<string>;
```

`CommandHandler`の戻り値は`string | Promise<string>`、つまり「同期的に文字列を返してもいいし、`Promise`で非同期に返してもいい」という型でした。ここに`ReturnType`と`Awaited`を組み合わせると、「そのハンドラーが最終的にどんな型の値を返すか」を1つの型として取り出せます。

```typescript
type Handler = (x: number) => string | Promise<string>;

type HandlerReturn = ReturnType<Handler>; // string | Promise<string>
type Resolved = Awaited<HandlerReturn>;   // string（Promiseかどうかに関わらず、最終的な型に統一される）
```

`command-registry`自体はこの型を今のところ使っていませんが、もし将来「登録されているすべてのコマンドの戻り値の型を一覧にする」といった機能を作るなら、まさにこの`ReturnType`と`Awaited`の組み合わせが使える場面になります。ユーティリティ型を1つずつ覚えるより、「条件型と`infer`さえ分かれば、大抵のユーティリティ型は自分でも組み立てられる」という理解のほうが、初めて見るユーティリティ型に出会ったときに強みになります。

## 確認問題

次の`MyParameters<T>`は、関数の引数の型を取り出すつもりで書かれています。`G`は何型になるか考えてみてください。

```typescript
type MyParameters<T> = T extends (first: infer P) => unknown ? P : never;

type G = MyParameters<(x: number, y: string) => void>;
```

<details>
<summary>答えを見る</summary>

`G`は`number`ではなく`never`になります。`(first: infer P) => unknown`は「引数を1つだけ受け取る関数」という形です。一方`(x: number, y: string) => void`は引数を2つ要求する関数のため、「1引数の関数が期待されている場所に渡してよいか」という構造的な判定に失敗し（2引数必須の関数は、1引数しか渡されない呼び出し方に対応できません）、`T extends (first: infer P) => unknown`の条件そのものが不成立になります。条件が不成立なら結果は`never`です。

「関数の引数全体を取り出す」ときは、引数の個数を1つに決め打ちせず、残余引数`...args`を使います。TypeScript標準の`Parameters<T>`型は、実際には次のような形で定義されています。

```typescript
type MyParameters<T> = T extends (...args: infer P) => unknown ? P : never;

type H = MyParameters<(x: number, y: string) => void>; // [number, string]
```

`...args`なら「引数の個数を問わず、すべてをタプルとして受け取る」形になるため、2引数の関数にも構造的にマッチします。

</details>

## 次の章

条件型を使うと、実行時に値の中身を確認する処理（06章・11章で見た`typeof`や`instanceof`による絞り込み）を、自分で定義した関数として部品化できます。→ [17章 カスタム型ガードと網羅性チェック](17-custom-type-guards.md)
