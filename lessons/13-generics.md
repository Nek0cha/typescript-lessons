# ジェネリクスは「型を引数として受け取る」仕組み

ここから中級編です。00〜12章で学んだ内容が土台になっているので、まだの場合は先に[目次](../README.md)から通してください。中級編では、実際に動くプロジェクト「[command-registry](../project/command-registry/)」を作りながら、TypeScriptの型システムをもう一段深く扱います。この章では、そのプロジェクトの中心にある考え方、ジェネリクス（generics）から始めます。

## 同じロジックを、型だけ変えて使い回したい

次の関数を考えます。配列の最初の要素を返すだけの関数です。

```typescript
function firstString(items: string[]): string {
  return items[0];
}

function firstNumber(items: number[]): number {
  return items[0];
}
```

`firstString`と`firstNumber`は、型が違うだけでロジックは完全に同じです。扱う型の数だけこの関数を複製するのは非現実的です。ジェネリクスを使うと、型そのものを引数として受け取る関数を1つ書くだけで済みます。

```typescript
function first<T>(items: T[]): T {
  return items[0];
}

first(["a", "b", "c"]); // T は string と推論される。戻り値は string
first([1, 2, 3]);       // T は number と推論される。戻り値は number
```

`<T>`が型引数（type parameter）です。`T`という名前自体に意味はなく、慣習的に1文字目の型引数は`T`（Typeの頭文字）と名付けられることが多いだけで、`Item`のような分かりやすい名前を使っても構いません。`first(["a", "b", "c"])`のように呼び出すと、渡した配列の中身から`T`が`string`だと自動的に推論され、戻り値の型も`string`になります。04章で関数の引数の型を`number`のように固定で書いてきましたが、ジェネリクスは「呼び出されるまで型が決まらない」関数を書くための仕組みです。

## クラスのジェネリクス

型引数はクラスにも付けられます。「中身の型を問わない入れ物」を作るときの定番パターンです。

```typescript
class Box<T> {
  private value: T;

  constructor(value: T) {
    this.value = value;
  }

  getValue(): T {
    return this.value;
  }
}

const stringBox = new Box("こんにちは");
stringBox.getValue(); // string

const numberBox = new Box(42);
numberBox.getValue(); // number
```

`Box<T>`は、`string`を入れれば`string`を、`number`を入れれば`number`を返す箱になります。もし`private value: any`のように書いてしまうと、`stringBox.getValue()`の戻り値が`any`になり、03章で説明した「型チェックが実質効かなくなる」状態に逆戻りしてしまいます。ジェネリクスは、`any`を使わずに「中身の型に応じて動作を変える」コードを書くための道具だと理解しておくと位置づけがつかみやすくなります。

## extendsで型引数を制約する

型引数`T`はデフォルトでは「どんな型でも受け取れる」状態です。これは`any`に近い自由度に見えますが、`any`と違って「呼び出しごとに1つの具体的な型に固定される」という制約があるため、危険性はありません。ただし、`T`に対して特定のプロパティやメソッドがある前提でコードを書きたい場合は、`extends`で制約を加えられます。

```typescript
function printLength<T extends { length: number }>(value: T): void {
  console.log(value.length);
}

printLength("こんにちは"); // OK: 文字列はlengthを持つ
printLength([1, 2, 3]);    // OK: 配列もlengthを持つ
printLength(42);           // エラー: numberはlengthを持たない
```

`T extends { length: number }`は、「`length: number`というプロパティを持つ型であれば何でもよい」という制約です。06章で扱ったユニオン型の絞り込みと似た発想で、「使う前に、その型が満たすべき最低限の形」を先に宣言しておくイメージです。

## command-registryでの実例

このプロジェクトの中心である`CommandRegistry`クラスの`register`メソッドは、ジェネリクスと`extends`を組み合わせて書かれています。

```typescript
// src/registry.ts
register<TSchema extends ArgSchema>(command: CommandDefinition<TSchema>): void {
  this.commands.set(command.name, command);
}
```

`TSchema extends ArgSchema`は、「`TSchema`は`ArgSchema`という形（07章で見た`type`で定義された型）を満たす、より具体的な型でなければならない」という制約です。`ArgSchema`自体は[14章](14-utility-types.md)で扱うユーティリティ型`Record`を使って定義されています。

`register`を実際に呼び出すとき、渡した`command.args`の中身（例えば`{ a: "number", b: "number" }`）から`TSchema`が自動的に推論されます。この推論された`TSchema`が、`command.handler`の引数の型にまでつながっていく仕組みが[15章](15-mapped-types-and-keyof.md)のテーマです。「型引数はどこか1か所で決まれば、そこから芋づる式に他の場所の型も決まっていく」という感覚を、この後の章で少しずつ実感していきます。

## 確認問題

次の関数は、渡された2つの値のうち大きい方を返すつもりですが、TypeScriptがエラーを出します。原因を考えてみてください。

```typescript
function larger<T>(a: T, b: T): T {
  return a > b ? a : b;
}
```

<details>
<summary>答えを見る</summary>

`T`に制約が付いていないため、`a > b`という比較演算ができる保証がありません（オブジェクト同士など、`>`で比較しても意味を持たない型が渡される可能性があります）。`Operator '>' cannot be applied to types 'T' and 'T'.`というエラーになります。次のように、比較可能な型に制約すると解決します。

```typescript
function larger<T extends number | string>(a: T, b: T): T {
  return a > b ? a : b;
}
```

</details>

## 次の章

`ArgSchema`の定義に使われている`Record`のような、TypeScriptに標準で用意された便利な型（ユーティリティ型）を見ていきます。→ [14章 ユーティリティ型](14-utility-types.md)
