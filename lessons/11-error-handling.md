# エラーは「投げて」「捕まえる」

プログラムの実行中に想定外の事態（ファイルが見つからない、ネットワークに繋がらない、渡された値が不正など）が起きたとき、JavaScript（TypeScript）はエラーを「投げる（throw）」ことでそれを伝えます。何もしなければ、投げられたエラーはプログラム全体を停止させます。

```typescript
function divide(a: number, b: number): number {
  if (b === 0) {
    throw new Error("0で割ることはできません");
  }
  return a / b;
}

divide(10, 0); // ここでプログラムが停止し、エラーメッセージが表示される
```

`throw new Error("メッセージ")`が、エラーを投げる構文です。`Error`はJavaScriptに標準で用意されているエラーを表すクラスで、`new Error("...")`で「このメッセージを持つエラー」のインスタンスを作れます。

## try/catchで捕まえる

投げられたエラーによってプログラム全体が止まってしまうのは、多くの場合望ましくありません。エラーが起きても処理を継続したい場合は、`try`/`catch`で囲んでエラーを「捕まえ（catch）」ます。

```typescript
function divide(a: number, b: number): number {
  if (b === 0) {
    throw new Error("0で割ることはできません");
  }
  return a / b;
}

try {
  const result = divide(10, 0);
  console.log(result); // ここは実行されない（throwされた時点でtryブロックを抜ける）
} catch (error) {
  console.error("エラーが発生しました:", error);
}

console.log("プログラムは継続する");
```

`try`ブロックの中でエラーが投げられると、その時点で`try`ブロックの残りの処理はスキップされ、即座に`catch`ブロックへ移ります。`catch`ブロックを抜けたあとは、プログラムは通常どおり次の行へ進みます。

Discord Botでは、1つのコマンドの処理中にエラーが起きても、Bot自体が停止してしまっては困ります。コマンドごとの処理を`try`/`catch`で囲んでおくことで、「そのコマンドだけ失敗し、Bot自体は動き続ける」という状態を作れます。

## catchで受け取ったエラーの型は unknown

TypeScriptでは、`catch (error)`で受け取る`error`の型は`unknown`になります。

```typescript
try {
  throw new Error("何かのエラー");
} catch (error) {
  console.log(error.message); // エラー: 'error' is of type 'unknown'.
}
```

`throw`では`Error`以外の値（文字列や数値など）も技術的には投げられてしまうため、TypeScriptは`catch`した時点では「何が投げられたか分からない」という安全側の判断をします。03章・06章で扱った型の絞り込みと同じ考え方で、使う前に中身を確認する必要があります。

```typescript
try {
  throw new Error("何かのエラー");
} catch (error) {
  if (error instanceof Error) {
    console.log(error.message); // OK: ここではerrorがErrorだと確定している
  } else {
    console.log("予期しない形のエラー:", error);
  }
}
```

`instanceof`は、「その値が指定したクラスのインスタンスかどうか」を確認する演算子です。`error instanceof Error`のチェックを経てから`.message`にアクセスするのが、TypeScriptにおける安全なエラー処理の基本形です。

## finally：エラーの有無に関わらず必ず実行する

`try`/`catch`には、`finally`ブロックを追加できます。`finally`はエラーが起きても起きなくても必ず実行されます。

```typescript
function loadData() {
  console.log("読み込み開始");
  try {
    // 何らかの処理
    throw new Error("読み込み失敗");
  } catch (error) {
    console.error("エラー処理:", error);
  } finally {
    console.log("読み込み処理を終了します"); // 成功・失敗どちらでも実行される
  }
}
```

「処理の後片付け（接続を閉じる、ローディング表示を消す、など）を、成功しても失敗しても必ず行いたい」という場面で使います。

## カスタムエラークラス

エラーの種類が複数ある場合、すべて`Error`だけで表現すると、`catch`した側で「具体的にどんな種類の失敗だったか」を`message`の文字列比較でしか判別できなくなります。`Error`を継承した独自のエラークラスを作ると、種類ごとに分けて扱えるようになります。

```typescript
class ValidationError extends Error {
  constructor(message: string) {
    super(message); // 親クラス(Error)のコンストラクタを呼ぶ
    this.name = "ValidationError";
  }
}

class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

function findUser(id: string) {
  if (id === "") {
    throw new ValidationError("idは空にできません");
  }
  if (id !== "001") {
    throw new NotFoundError(`id: ${id} のユーザーが見つかりません`);
  }
  return { id, name: "瑛奈" };
}

try {
  findUser("999");
} catch (error) {
  if (error instanceof ValidationError) {
    console.log("入力内容を確認してください:", error.message);
  } else if (error instanceof NotFoundError) {
    console.log("該当データがありませんでした:", error.message);
  } else {
    console.log("予期しないエラーです:", error);
  }
}
```

`extends Error`で継承した`ValidationError`や`NotFoundError`は、いずれも`instanceof Error`の判定にも合致しつつ、`instanceof ValidationError`のようにより具体的な判定もできます。09章で扱った非同期処理と組み合わせると、「ネットワークエラーなのか、データが存在しないだけなのか」を`catch`側で区別してユーザーに適切なメッセージを返す、といったDiscord Botらしい処理が書けるようになります。

## 確認問題

次のコードの`catch`ブロックには、TypeScriptがエラーを出す箇所があります。原因と直し方を考えてみてください。

```typescript
try {
  JSON.parse("これは不正なJSON");
} catch (error) {
  console.log(`パースに失敗しました: ${error.message}`);
}
```

<details>
<summary>答えを見る</summary>

`error`の型は`unknown`のため、`error.message`に直接アクセスできません（`'error' is of type 'unknown'.`というエラーになります）。`instanceof Error`で絞り込んでからアクセスする必要があります。

```typescript
} catch (error) {
  if (error instanceof Error) {
    console.log(`パースに失敗しました: ${error.message}`);
  }
}
```

</details>

## 次の章

TypeScriptの基本文法はここまでで一通りそろいました。最後に、実際にDiscord Botを作るための最初の一歩を紹介します。→ [12章 次の一歩：Discord Botを作る](12-next-steps-discord-bot.md)
