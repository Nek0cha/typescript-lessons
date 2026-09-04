# 「時間がかかる処理」は結果を待たずに次へ進んでしまう

これまで書いてきたコードは、すべて上から下へ、1行ずつ順番に実行されてきました。ところが「外部のサーバーにデータを問い合わせる」「ファイルを読み込む」といった処理には、実行に時間がかかるものがあります。Discord Botで言えば、Discordのサーバーにメッセージを送信する処理がまさにこれにあたります。

こうした処理を、普通の関数と同じ感覚で書くと問題が起きます。次のコードはイメージをつかむための擬似的な例です。

```typescript
function fetchUserName(userId: string): string {
  // サーバーへの問い合わせを想定（実際には時間がかかる）
  let result = "";
  someNetworkRequest(userId, (response) => {
    result = response.name; // この行が呼ばれるのは、問い合わせが完了したあと
  });
  return result; // 問い合わせが終わる前にここに到達してしまう
}

console.log(fetchUserName("001")); // 空文字が表示される（間に合っていない）
```

`someNetworkRequest`が完了するには時間がかかりますが、JavaScript（TypeScript）のコードはその完了を待たずに次の行へ進んでしまいます。これは「上から下へ順番に実行する」という前提が崩れているわけではなく、時間のかかる処理を「あとで終わったら教えてね」という形で裏側にお願いし、その返事を待たずに`return result`まで進んでしまっている、というのが実態です。

## Promise：「あとで結果が返ってくる」ことを表す型

こうした「今は結果がないが、あとで結果が返ってくる（かもしれない）」処理を表すのが`Promise`です。TypeScriptでは`Promise<T>`という形で、「最終的に`T`型の値を返すことを約束したもの」として型に表れます。

```typescript
function fetchUserName(userId: string): Promise<string> {
  return new Promise((resolve) => {
    someNetworkRequest(userId, (response) => {
      resolve(response.name); // 完了したら、この値でPromiseを解決する
    });
  });
}
```

`Promise<string>`という戻り値の型を見れば、「この関数は文字列そのものではなく、いずれ文字列を返す約束を返している」と分かります。ゼロからPromiseを作る機会は少なく、多くの場合は`fetch`のような既存の関数が最初から`Promise`を返してくれます。今の時点では「時間のかかる処理は`Promise<T>`という形で結果を表す」ということだけ理解しておけば十分です。

## async/await：Promiseを同期処理のように書く

`Promise`を直接扱う書き方（`.then()`を連ねる書き方）は、複数の非同期処理を連続させると読みにくくなりがちです。TypeScript（JavaScript）には`async`/`await`という書き方があり、非同期処理をまるで同期処理のように上から下へ読める形で書けます。

```typescript
async function fetchUserName(userId: string): Promise<string> {
  const response = await someNetworkRequest(userId);
  return response.name;
}

async function main() {
  const name = await fetchUserName("001");
  console.log(`ユーザー名: ${name}`);
}

main();
```

ルールは2つだけです。

- `Promise`を返す処理を待ちたい行の前に`await`を付ける
- `await`を使う関数には`async`を付ける（`async`が付いた関数は、常に`Promise`を返す関数になります）

`await fetchUserName("001")`と書くと、その行の処理は`fetchUserName`が完了するまで待ってから次の行へ進みます。見た目はこれまでの同期的なコードとほぼ変わらないまま、実際には非同期の処理を扱えるのが`async`/`await`の利点です。

## 実例：fetchでAPIから情報を取る

Node.jsには標準で`fetch`という関数が用意されており、外部のAPI（Web上のサービスが提供するデータ取得口）からデータを取得できます。

```typescript
type Post = {
  id: number;
  title: string;
};

async function fetchPost(id: number): Promise<Post> {
  const response = await fetch(`https://jsonplaceholder.typicode.com/posts/${id}`);
  const data = await response.json();
  return data as Post;
}

async function main() {
  const post = await fetchPost(1);
  console.log(post.title);
}

main();
```

`response.json()`も`Promise`を返す処理なので、`await`が必要です。`data as Post`は「型アサーション」と呼ばれる書き方で、「この値は`Post`型として扱ってよい」とTypeScriptに明示的に伝えています。`fetch`が返すデータの中身はTypeScriptからは正確に分からないため（実行時にならないと分からないデータの形を、コンパイル時の型として保証してくれるわけではありません）、こちらで型を指定する必要があります。データの形が実際に一致しているかどうかまではチェックしてくれないため、外部から来るデータを`as`で扱うときは、想定と違う形が返ってきていないか実際に確認するようにしてください。

## 非同期処理でのエラー処理

`await`している処理が失敗する可能性がある場合（ネットワークが繋がらない、サーバーがエラーを返す、など）、`try`/`catch`で囲みます。詳しいエラー処理の書き方は[11章](11-error-handling.md)で扱いますが、非同期処理と組み合わせる基本形だけここで見ておきます。

```typescript
async function fetchPost(id: number): Promise<Post | null> {
  try {
    const response = await fetch(`https://jsonplaceholder.typicode.com/posts/${id}`);
    const data = await response.json();
    return data as Post;
  } catch (error) {
    console.error("投稿の取得に失敗しました", error);
    return null;
  }
}
```

Discord Botは、Discordのサーバーやその他のAPIと常に通信しながら動くプログラムです。「メッセージを送る」「ユーザー情報を取得する」といった処理のほとんどが`Promise`を返す非同期処理になるため、この章の内容はBot開発の土台になります。

## 確認問題

次のコードは、`fetchUserName`の結果を待たずに`console.log`が実行されてしまいます。原因と直し方を考えてみてください。

```typescript
async function fetchUserName(userId: string): Promise<string> {
  const response = await someNetworkRequest(userId);
  return response.name;
}

function main() {
  const name = fetchUserName("001");
  console.log(`ユーザー名: ${name}`); // "ユーザー名: [object Promise]" のように表示される
}
```

<details>
<summary>答えを見る</summary>

`fetchUserName("001")`の結果に`await`を付けていないため、`name`には`string`ではなく`Promise<string>`（未完了の約束そのもの）が代入されています。また、`main`関数自体に`async`が付いていないため、そもそも`await`を使うことができません。次のように直します。

```typescript
async function main() {
  const name = await fetchUserName("001");
  console.log(`ユーザー名: ${name}`);
}
```

</details>

## 次の章

コードが複数のファイルに分かれてきたところで、次はファイルをまたいでコードを共有する仕組みと、外部のパッケージを追加する方法を学びます。→ [10章 モジュールとパッケージ管理](10-modules-and-packages.md)
