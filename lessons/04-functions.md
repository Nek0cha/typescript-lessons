# 関数は「引数の型」と「戻り値の型」を書く

関数の書き方はJavaScriptと同じですが、TypeScriptでは引数と戻り値それぞれに型を付けられます。00章で見た`addTax`関数を例に、構造を分解してみます。

```typescript
function addTax(price: number): number {
  return price * 1.1;
}
```

- `price: number` … 引数`price`はnumber型でなければならない
- `): number` … この関数はnumber型の値を返す

戻り値の型注釈は省略しても、TypeScriptが`return`文から自動で推論してくれます。ただし、関数の場合は明示しておくことを推奨します。理由は、意図しない型を返してしまったときにエラーとして検出できるからです。

```typescript
// 戻り値の型を書いていない場合
function addTax(price: number) {
  return price + "円"; // 本当はnumberを返したかったのに、うっかり文字列を返している
}
// エラーにならない。呼び出し側は戻り値がstringだと思って使うことになる

// 戻り値の型を書いている場合
function addTax(price: number): number {
  return price + "円"; // エラー: Type 'string' is not assignable to type 'number'.
}
// その場で間違いに気づける
```

## アロー関数

関数には`function`キーワードを使う書き方のほかに、アロー関数（arrow function）という書き方があります。

```typescript
// function宣言
function add(a: number, b: number): number {
  return a + b;
}

// アロー関数
const add2 = (a: number, b: number): number => {
  return a + b;
};

// 中身が1行のreturnだけなら、さらに省略できる
const add3 = (a: number, b: number): number => a + b;
```

`add`と`add2`はほぼ同じ動作をしますが、細かい違い（`this`の扱いなど）があります。このシリーズで扱う範囲では、次のように使い分けておけば十分です。

- 単独の関数として定義するとき → `function`宣言
- 他の関数の引数として一時的に渡すとき（[06章](06-control-flow.md)の配列メソッドなど） → アロー関数

```typescript
const numbers = [1, 2, 3];
const doubled = numbers.map((n: number): number => n * 2);
```

## オプション引数とデフォルト値

引数は基本的にすべて渡す必要がありますが、「渡さなくてもいい引数」も作れます。パラメータ名の後ろに`?`を付けます。

```typescript
function greet(name: string, honorific?: string): string {
  if (honorific === undefined) {
    return `こんにちは、${name}さん`;
  }
  return `こんにちは、${name}${honorific}`;
}

greet("Neko");          // "こんにちは、Nekoさん"
greet("Neko", "先輩");   // "こんにちは、Neko先輩"
```

`honorific?: string`と書くと、`honorific`の型は実質`string | undefined`（stringかundefinedのどちらか）になります。渡さなかった場合は自動的に`undefined`が入ります。

似た目的でよく使われるのがデフォルト値です。「渡されなかったときの初期値」をあらかじめ決めておけます。

```typescript
function greet(name: string, honorific: string = "さん"): string {
  return `こんにちは、${name}${honorific}`;
}

greet("Neko");          // "こんにちは、Nekoさん"
greet("Neko", "先輩");   // "こんにちは、Neko先輩"
```

`honorific?: string`との違いはここにあります。`?`は渡さなかったら`undefined`のままにする一方、`= "さん"`は渡さなかったときに`"さん"`という具体的な値で埋めます。関数の中で`undefined`かどうかの分岐を書きたくない場合は、デフォルト値のほうがコードがすっきりします。

## 複数の値をまとめて渡す：オブジェクト引数

引数が2〜3個までなら順番に並べても読みやすいですが、5個、6個と増えてくると「何番目が何の意味だったか」を呼び出すたびに確認することになります。そういう場合はオブジェクトにまとめて1つの引数として渡す書き方がよく使われます（オブジェクトの型の詳しい書き方は[05章](05-arrays-and-objects.md)で扱います）。

```typescript
// 引数が多く、呼び出し側で順番を覚えにくい
function createUser(name: string, age: number, isAdmin: boolean, email: string) {
  // ...
}
createUser("Neko", 20, false, "neko@example.com"); // どれが何の値か分かりにくい

// オブジェクトにまとめると、呼び出し側でも意味が分かる
function createUser2(user: { name: string; age: number; isAdmin: boolean; email: string }) {
  // ...
}
createUser2({ name: "Neko", age: 20, isAdmin: false, email: "neko@example.com" });
```

Discord Botの開発では、Discordから受け取るデータ（メッセージの内容、送信者の情報など）がすべてオブジェクトの形で渡ってくるため、この書き方に早めに慣れておくと後の章がスムーズになります。

## 確認問題

次の関数は、渡された数値の配列の合計を返す関数のつもりで書かれていますが、TypeScriptがエラーを出します。原因を考えてみてください。

```typescript
function sum(numbers: number[]): number {
  let total = "0";
  for (const n of numbers) {
    total += n;
  }
  return total;
}
```

<details>
<summary>答えを見る</summary>

`total`が`"0"`という文字列で初期化されているため、`total`の型は`string`と推論されます。`return total;`の時点で戻り値の型`number`と食い違い、`Type 'string' is not assignable to type 'number'.`というエラーになります。`let total = 0;`のように数値で初期化すれば解決します。

</details>

## 次の章

関数の引数としてもよく登場した「配列」と「オブジェクト」の型を、次はきちんと見ていきます。→ [05章 配列とオブジェクト](05-arrays-and-objects.md)
