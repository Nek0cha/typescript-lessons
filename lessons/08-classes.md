# クラスは「データ（プロパティ）」と「処理（メソッド）」をひとまとめにする箱

これまでの章では、データの形を`type`で表し、それを処理する関数を別に定義してきました。

```typescript
type User = { name: string; age: number };

function greet(user: User): string {
  return `こんにちは、${user.name}さん`;
}
```

クラス（class）を使うと、データとそれを処理する関数（メソッドと呼びます）を1つの箱にまとめて定義できます。

```typescript
class User {
  name: string;
  age: number;

  constructor(name: string, age: number) {
    this.name = name;
    this.age = age;
  }

  greet(): string {
    return `こんにちは、${this.name}さん`;
  }
}

const user = new User("瑛奈", 20);
console.log(user.greet()); // "こんにちは、瑛奈さん"
```

`constructor`はコンストラクタと呼ばれる特殊なメソッドで、`new User("瑛奈", 20)`のように`new`を使ってインスタンス（そのクラスの実体）を作るときに1度だけ呼ばれます。渡された引数を`this.name`、`this.age`のようにプロパティへ代入するのが典型的な役割です。`this`はそのインスタンス自身を指します。

## なぜクラスを使うのか

`type`と関数の組み合わせでも同じことは表現できるため、「なぜわざわざクラスにするのか」と思うかもしれません。クラスが向いているのは、次のような場面です。

- そのデータに関する処理（メソッド）の数が多く、まとめて管理したい
- インスタンスごとに内部状態（あとで説明する`private`なプロパティなど）を持たせ、外から直接いじられないようにしたい
- 似た性質を持つ複数の種類のデータを、共通の土台（継承）から作りたい

Discord Botの開発では、「1つのコマンドの挙動」や「Botが管理するゲームの状態」のように、データと処理が密接に結びついたものを扱う場面が多く、クラスで表現すると見通しがよくなることがあります。ただし、小さな処理であれば関数だけで十分な場面も多く、「何でもクラスにする」のが常に正解というわけではありません。

## アクセス修飾子：public / private / protected

プロパティやメソッドには、外部からのアクセスを制限する修飾子を付けられます。

```typescript
class BankAccount {
  private balance: number;

  constructor(initialBalance: number) {
    this.balance = initialBalance;
  }

  deposit(amount: number): void {
    this.balance += amount;
  }

  getBalance(): number {
    return this.balance;
  }
}

const account = new BankAccount(1000);
account.deposit(500);
console.log(account.getBalance()); // 1500

account.balance; // エラー: Property 'balance' is private and only accessible within class 'BankAccount'.
```

- `public`（何も付けない場合のデフォルト） … どこからでもアクセス可能
- `private` … クラスの内部からのみアクセス可能。外部から直接読み書きできない
- `protected` … クラスの内部と、それを継承したクラスからアクセス可能（次の節で説明）

`balance`を`private`にすることで、「口座残高は`deposit`のような決められた方法でしか変更できない」というルールをコード上で強制できます。もし`balance`が`public`だったら、`account.balance = -100000`のような不正な値を外部から直接代入できてしまいます。

## 継承：共通の土台から派生させる

複数のクラスに共通する性質がある場合、`extends`を使って継承（inheritance）できます。

```typescript
class Animal {
  constructor(protected name: string) {}

  move(): string {
    return `${this.name}が移動した`;
  }
}

class Dog extends Animal {
  bark(): string {
    return `${this.name}が吠えた`;
  }
}

const dog = new Dog("ポチ");
console.log(dog.move()); // "ポチが移動した" (Animalから継承したメソッド)
console.log(dog.bark()); // "ポチが吠えた" (Dog独自のメソッド)
```

`constructor(protected name: string) {}`は、コンストラクタの引数にアクセス修飾子を付けることで「引数を受け取ってプロパティに代入する」処理を省略できる書き方です。`this.name = name;`を明示的に書く手間が省けます。

`Dog`は`Animal`を継承しているため、`Animal`が持つ`move`メソッドをそのまま使えつつ、`Dog`独自の`bark`メソッドも追加されています。`name`が`protected`なので、`Animal`のサブクラスである`Dog`の中からは`this.name`にアクセスできますが、クラスの外から`dog.name`と直接読み書きすることはできません。

## interfaceを実装する

07章で紹介した`interface`は、クラスに「このメソッドとプロパティを必ず持つこと」という約束事として使うこともできます。`implements`を使います。

```typescript
interface Greetable {
  name: string;
  greet(): string;
}

class User implements Greetable {
  constructor(public name: string) {}

  greet(): string {
    return `こんにちは、${this.name}さん`;
  }
}
```

`Greetable`を`implements`したクラスには、`name`プロパティと`greet`メソッドが必ず存在します。仮に`greet`メソッドを書き忘れると、コンパイル時にエラーになります。「このクラスは最低限これだけの機能を持つ」という約束を先に決めておきたいときに使う仕組みです。

## 確認問題

次のクラスには、意図と異なる箇所が1つあります。何が問題か考えてみてください。

```typescript
class Counter {
  private count: number = 0;

  increment(): void {
    this.count++;
  }
}

const counter = new Counter();
counter.increment();
counter.increment();
console.log(counter.count); // 現在のカウントを表示したい
```

<details>
<summary>答えを見る</summary>

`count`が`private`なので、クラスの外から`counter.count`に直接アクセスすることはできません（`Property 'count' is private and only accessible within class 'Counter'.`というエラーになります）。`getBalance`の例のように、現在の値を返す`getCount(): number { return this.count; }`のようなメソッドを用意し、`counter.getCount()`として呼び出す必要があります。

</details>

## 次の章

ここまでのコードは、すべて上から下へ順番に処理が進む前提で書いてきました。次は「時間がかかる処理を待つ」という、これまでとは異なる時間の流れを扱う非同期処理に入ります。→ [09章 非同期処理](09-async-await.md)
