# 1つのコマンドのエラーで、Bot全体を落とさない

12章で「Botでは、1つのコマンドの処理中にエラーが起きても、Bot自体は動き続けてほしい」と説明しました。discord-botでは、21〜25章で作ったコマンド群を、どうエラーから守っているかをこの章でまとめます。

## interaction.replied / interaction.deferredを見る理由

22章で見た`index.ts`のエラー処理を、もう一度見てみます。

```typescript
// src/index.ts (抜粋)
try {
  await command.execute(interaction, db);
} catch (error) {
  console.error(`コマンド実行中にエラーが発生しました: /${interaction.commandName}`, error);
  const errorMessage = { content: "コマンドの実行中にエラーが発生しました。", ephemeral: true };
  if (interaction.replied || interaction.deferred) {
    await interaction.followUp(errorMessage);
  } else {
    await interaction.reply(errorMessage);
  }
}
```

なぜ`interaction.reply(...)`を直接呼ばず、`replied`・`deferred`という状態を確認しているのでしょうか。理由は、Discordの1つの操作(interaction)に対して、`reply`で最初の返信ができるのは1回だけという制約があるためです。`/note add`のように`execute`の中で既に`interaction.reply(...)`を呼んだあとに、何らかの理由でエラーが発生した場合(例えばログ出力自体が失敗するなど)、`catch`節でもう一度`reply`を呼ぶと「既に返信済みです」というエラーがさらに発生してしまいます。

- `interaction.replied` … 既に`reply`で返信済みか
- `interaction.deferred` … `reply`の代わりに「今処理中です」という一時応答(`deferReply`)を返したあとか

どちらかが`true`なら、追加のメッセージは`followUp`(返信の追加投稿)を使い、まだどちらでもなければ`reply`を使う、という分岐です。11章で学んだ「エラーが起きても、想定外の状態異常を新たに生まないようにする」という考え方の実例だと捉えてください。

## プロセス全体で起きるエラーにも備える

`index.ts`の`try`/`catch`は、あくまで「コマンドの`execute`の中で起きたエラー」しか捕まえません。discord.jsのイベント処理そのものの外側で、`Promise`の`catch`忘れ(unhandled rejection)や、予期しない例外(uncaught exception)が起きる可能性は常にあります。24時間動き続けることを想定するBotでは、これらを捕まえてログに残す処理を、`index.ts`の起動処理に追加しておくと安全です。

```typescript
process.on("unhandledRejection", (reason) => {
  console.error("捕捉されなかったPromiseの拒否があります", reason);
});

process.on("uncaughtException", (error) => {
  console.error("捕捉されなかった例外が発生しました", error);
});
```

これらは`try`/`catch`の代わりにはなりません(あくまで「気づかずに落ちる」ことを防ぐ最後の砦です)。09章・11章・22章で見てきたように、非同期処理には必ず`await`と`try`/`catch`を添えることが本来の対策です。`discord-bot`のプロジェクトには、このプロセス全体のエラーハンドリングまでは含めていません。実際に長時間動かすBotを作る際に、自分で追加してみることを勧めます(未検証: この2行を追加するだけで全ての落ちる可能性を防げるわけではなく、あくまで気づけるようにするための保険です)。

## discord-bot全体の振り返り

21章から26章まで、discord-botを構成する部品を見てきました。20章で command-registry を振り返ったのと同じように、ここでも一覧にしておきます。

| 章 | 学んだこと | 対応する部品 |
|---|---|---|
| [21章](21-slash-commands.md) | SlashCommandBuilder、Pickによる型の緩和 | `types.ts`のCommand型、各コマンドの`data` |
| [22章](22-handling-interactions.md) | コマンド登録、interactionCreate、閉じ込められた絞り込み | `deploy-commands.ts`、`index.ts` |
| [23章](23-persisting-data-with-sqlite.md) | node:sqlite、prepared statement | `db.ts` |
| [24章](24-note-command.md) | ここまでの組み合わせ | `commands/note.ts` |
| [25章](25-remind-command.md) | setInterval、isSendable、finally、構造的部分型でのテスト | `commands/remind.ts`、`scheduler.ts` |
| [26章](26-error-handling-and-wrap-up.md) | replied/deferred、プロセス全体のエラー処理 | `index.ts` |

00章の「型のチェックをしてくれるJavaScript」から始まったこのシリーズは、ここまでで一区切りです。00〜12章でTypeScriptの基礎、13〜20章で型システムの中級的な使い方、21〜26章でDiscordという実在のサービスと連携する実装を扱いました。

## このシリーズで扱わなかったこと

discord-botはあくまで教材用に規模を絞ったBotです。実際に公開して使ってもらうBotに育てるには、次のような課題が残っています。

- **デプロイ**: このBotは今のところ、自分のパソコンを起動している間しか動きません。Railway・Renderのようなホスティングサービスや、VPS上でのプロセス管理(`pm2`など)を使い、24時間動かし続ける方法を別途学ぶ必要があります。SQLiteのファイルを永続的なストレージに置く設定も必要になります
- **権限管理**: 「管理者だけが使えるコマンド」のような制御は、discord.js側の`setDefaultMemberPermissions`などを使って別途実装する必要があります
- **レート制限**: 短時間に大量のコマンドを打たれた場合の対策(クールダウン)は、今のdiscord-botには含まれていません

これらは今回のシリーズでは扱いませんが、21〜26章で身につけた「コマンドの型を定義し、DBに永続化し、エラーを想定して処理する」という設計の骨格は、そのまま拡張していけるはずです。まずは`discord-bot`に、自分が欲しい機能を1つ追加してみることから始めてみてください。
