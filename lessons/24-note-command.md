# /noteは、21〜23章の内容を組み合わせただけでできている

この章では新しい概念は登場しません。21章のサブコマンド定義・22章のoptions取得・23章のDB操作を組み合わせるだけで、`/note`コマンドの`execute`が完成することを確認します。新しい機能を学ぶ章の合間に、「すでに知っていることを組み合わせて動くものを作る」という感覚を持つための章だと捉えてください。

## サブコマンドを判定する

`/note`は`add`・`list`・`delete`という3つのサブコマンドを持っています(21章)。どのサブコマンドが呼ばれたかは`interaction.options.getSubcommand()`で取得できます。

```typescript
// src/commands/note.ts (抜粋)
async execute(interaction, db) {
  const subcommand = interaction.options.getSubcommand();
  const userId = interaction.user.id;

  if (subcommand === "add") {
    // ...
  }

  if (subcommand === "list") {
    // ...
  }

  if (subcommand === "delete") {
    // ...
  }
},
```

`interaction.user.id`は、コマンドを打ったユーザーを一意に識別するIDです。23章で見た`notes`テーブルの`user_id`列には、この値をそのまま保存しています。

## addサブコマンド

```typescript
if (subcommand === "add") {
  const title = interaction.options.getString("title", true);
  const body = interaction.options.getString("body", true);
  const created = db.addNote(userId, title, body);
  await interaction.reply({
    content: `メモを追加しました（ID: ${created.id}）\n**${created.title}**\n${created.body}`,
    ephemeral: true,
  });
  return;
}
```

22章で見た`getString(name, true)`で必須の引数を取り出し、23章で作った`db.addNote(...)`にそのまま渡しています。`db.addNote`は追加した`Note`(23章で定義した型)を返すので、その`id`を返信メッセージに含めることで、ユーザーは「あとで削除するときに使うID」をこの時点で知れます。

## listサブコマンド

```typescript
if (subcommand === "list") {
  const notes = db.listNotes(userId);
  if (notes.length === 0) {
    await interaction.reply({ content: "登録されたメモはありません。", ephemeral: true });
    return;
  }
  const lines = notes.map((n) => `- **[${n.id}] ${n.title}**: ${n.body}`);
  await interaction.reply({ content: lines.join("\n"), ephemeral: true });
  return;
}
```

06章で学んだ`map`を使い、`Note`の配列を表示用の文字列の配列に変換してから、`join("\n")`で改行区切りの1つの文字列にまとめています。メモが1件もない場合に空の一覧を返すのではなく、「登録されたメモはありません。」という専用のメッセージを返している点にも注目してください。「データが0件のときにどう表示するか」は、実際に動くアプリケーションを作るとほぼ必ず向き合うことになる分岐です。

## deleteサブコマンド

```typescript
if (subcommand === "delete") {
  const id = interaction.options.getInteger("id", true);
  const deleted = db.deleteNote(userId, id);
  await interaction.reply({
    content: deleted ? `メモ（ID: ${id}）を削除しました。` : `ID: ${id} のメモが見つかりませんでした。`,
    ephemeral: true,
  });
  return;
}
```

23章で見たとおり、`db.deleteNote(userId, id)`は「自分のメモかどうか」まで含めて判定し、削除できたかどうかを`boolean`で返します。他人のメモのIDを指定した場合や、存在しないIDを指定した場合、どちらも`deleted`が`false`になり、同じ「見つかりませんでした」というメッセージが返ります。「他人のメモを指定した」ことと「存在しないIDを指定した」ことを区別するメッセージを出さないのは、意図的な設計です。「他人のメモのIDかどうか」まで教えてしまうと、総当たりでIDを試すことで他人のメモの存在を推測できてしまう可能性があるため、両者を同じ結果として扱っています。

## 実際に動かして確認する

[discord-bot](../project/discord-bot/)の`README`にある手順で環境変数を設定し、`pnpm run deploy-commands`でコマンドを登録してから`pnpm dev`を実行すると、実際にDiscord上で次のような一連の操作を試せます。

```
/note add title:買い物 body:牛乳を買う
→ メモを追加しました（ID: 1）

/note add title:TODO body:宿題をやる
→ メモを追加しました（ID: 2）

/note list
→ - [2] TODO: 宿題をやる
   - [1] 買い物: 牛乳を買う

/note delete id:1
→ メモ（ID: 1）を削除しました。

/note delete id:1
→ ID: 1 のメモが見つかりませんでした。
```

`tests/db.test.ts`(23章)で確認した「ユーザーをまたいでメモが漏れない」「他人のメモは消せない」という振る舞いは、実際に別のDiscordアカウントでログインしない限り目視では確認しづらい部分です。こうした確認しづらい振る舞いこそテストで担保しておく価値がある、ということを実感できると思います。

## 確認問題

`/note`に、メモの中身を書き換える`edit`サブコマンドを追加したいとします。21〜24章の内容を踏まえて、必要な変更を3つの観点(コマンド定義・DB層・execute内の分岐)で箇条書きにしてみてください。実装まではしなくて構いません。

<details>
<summary>答えを見る</summary>

- **コマンド定義(21章)**: `note.ts`の`data`に`.addSubcommand((sub) => sub.setName("edit")...)`を追加し、`id`(整数、必須)・`title`または`body`(文字列)などの引数を定義する
- **DB層(23章)**: `db.ts`に`updateNote(userId, id, title, body): boolean`のような関数を追加する。SQLは`UPDATE notes SET title = ?, body = ? WHERE id = ? AND user_id = ?`のように、`deleteNote`と同じく`user_id`の条件を忘れないようにする
- **execute内の分岐(24章)**: `if (subcommand === "edit") { ... }`を追加し、`getInteger`・`getString`で引数を取り出してから`db.updateNote(...)`を呼び、結果に応じたメッセージを返信する

`deleteNote`とほぼ同じ形の分岐・同じ形のSQL条件になるはずです。既存のコードを見比べながら実装できることが、ここまでの内容が身についているかの目安になります。

</details>

## 次の章

/noteは「打った瞬間に完結する」コマンドでした。次の/remindは「あとになってから」処理が実行される、少し性質の違うコマンドです。→ [25章 /remindコマンドと定期処理](25-remind-command.md)
