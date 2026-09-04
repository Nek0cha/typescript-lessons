# 配列の型は「中身の型 + []」、オブジェクトの型は形をそのまま書く

## 配列

配列の型は、中身の型のうしろに`[]`を付けて表します。

```typescript
const numbers: number[] = [1, 2, 3];
const names: string[] = ["瑛奈", "たかし"];

numbers.push(4);     // OK
numbers.push("5");   // エラー: Argument of type 'string' is not assignable to parameter of type 'number'.
```

`number[]`は「number型の値だけが入る配列」という意味です。`push`（配列の末尾に値を追加するメソッド）で違う型の値を入れようとすると、その場でエラーになります。

型注釈は、03章の変数と同様に多くの場合省略できます。

```typescript
const numbers = [1, 2, 3]; // number[] だとTypeScriptが自動で推論する
```

`Array<number>`という書き方も同じ意味で使えます（`number[]`のジェネリクス版の表記です）。このシリーズでは基本的に`number[]`の書き方に統一します。

### タプル：長さと順番が決まった配列

配列の中でも、「要素数が決まっていて、それぞれの位置の型も決まっている」ものをタプル（tuple）と呼びます。

```typescript
// 通常の配列: 何個入っていてもよく、型は統一されている
const scores: number[] = [80, 90, 100];

// タプル: 必ず2要素で、1つ目はstring、2つ目はnumberと決まっている
const entry: [string, number] = ["瑛奈", 90];

entry[0]; // string型として扱われる
entry[1]; // number型として扱われる
```

「名前と点数のペア」のように、決まった構造を持つ小さなデータを表すときにタプルを使います。ただし、要素が増えてくると何番目が何を意味するか読み取りづらくなるため、3つ以上の要素を持つ組み合わせにはオブジェクトを使うほうが一般的には読みやすくなります。

## オブジェクトの型

オブジェクトの型は、プロパティ名とその型を`{ }`の中に列挙して表します。

```typescript
const user: { name: string; age: number } = {
  name: "瑛奈",
  age: 20,
};

user.name; // string
user.age;  // number

user.email; // エラー: Property 'email' does not exist on type '{ name: string; age: number; }'.
```

定義していないプロパティにアクセスしようとすると、その場でエラーになります。「このオブジェクトにどんなプロパティがあるか」をエディタが把握しているため、`user.`まで打つと補完候補として`name`と`age`が表示されます。

### 同じ形を何度も書くならtypeで名前を付ける

`{ name: string; age: number }`という形を関数の引数などで何度も書くのは冗長です。`type`を使うと、オブジェクトの形に名前を付けて再利用できます。

```typescript
type User = {
  name: string;
  age: number;
};

const user: User = { name: "瑛奈", age: 20 };

function greetUser(u: User): string {
  return `こんにちは、${u.name}さん`;
}
```

`type`の詳しい使い方（`interface`との違いを含む）は[07章](07-types-deep-dive.md)で扱います。ここでは「同じ形のオブジェクトを何度も書くなら`type`で名前を付ける」という基本だけ押さえておいてください。

### オプションプロパティ

関数のオプション引数と同じように、オブジェクトのプロパティにも「あってもなくてもいい」という指定ができます。

```typescript
type User = {
  name: string;
  age: number;
  nickname?: string; // なくてもよいプロパティ
};

const user1: User = { name: "瑛奈", age: 20 };
const user2: User = { name: "瑛奈", age: 20, nickname: "えいなん" };
```

## 分割代入：オブジェクトや配列から値を取り出す

オブジェクトからプロパティを1つずつ取り出すとき、`user.name`のように書く代わりに、分割代入（destructuring）という書き方を使うとコードが短くなります。

```typescript
const user: User = { name: "瑛奈", age: 20 };

// 従来の書き方
const name1 = user.name;
const age1 = user.age;

// 分割代入
const { name, age } = user;
console.log(name); // "瑛奈"
console.log(age);  // 20
```

関数の引数でも同じ書き方ができます。04章で見た「オブジェクトにまとめて渡す」パターンと組み合わせると、関数の中でも`user.name`ではなく`name`とそのまま書けるようになります。

```typescript
function greetUser({ name, age }: User): string {
  return `こんにちは、${name}さん（${age}歳）`;
}
```

配列でも同様に分割代入ができ、位置で値を取り出します。

```typescript
const entry: [string, number] = ["瑛奈", 90];
const [entryName, entryScore] = entry;
```

## readonly：あとから変更させない

プロパティの前に`readonly`を付けると、そのプロパティは初期化後に再代入できなくなります。

```typescript
type User = {
  readonly id: number;
  name: string;
};

const user: User = { id: 1, name: "瑛奈" };
user.name = "えいな"; // OK
user.id = 2;          // エラー: Cannot assign to 'id' because it is a read-only property.
```

データベースのIDのように「一度決まったら変わらないはずの値」に`readonly`を付けておくと、うっかり書き換えてしまうミスをコンパイル時に防げます。

## 確認問題

次のコードの2行目には、TypeScriptがエラーを出す箇所があります。何が問題か考えてみてください。

```typescript
type Product = { id: number; price: number };
const products: Product[] = [{ id: 1, price: 1000 }, { id: 2, price: "2000" }];
```

<details>
<summary>答えを見る</summary>

2つ目の要素の`price`が`"2000"`という文字列になっています。`Product`型の`price`は`number`と定義されているため、`Type 'string' is not assignable to type 'number'.`というエラーになります。`price: 2000`のように数値で書く必要があります。

</details>

## 次の章

配列の中身を1件ずつ処理したり、条件によって処理を分けたりする書き方を次に見ていきます。→ [06章 条件分岐と繰り返し](06-control-flow.md)
