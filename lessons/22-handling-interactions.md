# コマンドを実際に反応させるには、登録と受信の2段階が必要

21章でコマンドの見た目(`data`)を定義しました。この章では、それをDiscordに登録する手順と、実際にユーザーが打ったときの処理(`execute`)を、discord-botの起動の流れに沿って見ていきます。

## 手順1: コマンドをDiscordに登録する(deploy-commands.ts)

スラッシュコマンドは、Botのプログラムを起動するだけでは使えるようになりません。「こういう名前・こういう引数のコマンドがあります」という情報を、事前にDiscordのサーバーへ登録しておく必要があります。この登録作業を行うのが`deploy-commands.ts`です。

```typescript
// src/deploy-commands.ts
import "dotenv/config";
import { REST, Routes } from "discord.js";
import { note } from "./commands/note.js";
import { ping } from "./commands/ping.js";
import { remind } from "./commands/remind.js";

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.DISCORD_GUILD_ID;

if (token === undefined || clientId === undefined) {
  throw new Error("DISCORD_TOKEN と DISCORD_CLIENT_ID を .env に設定してください");
}

const commandsData = [ping, note, remind].map((command) => command.data.toJSON());

const rest = new REST().setToken(token);

async function main(clientId: string, guildId: string | undefined) {
  const route =
    guildId !== undefined
      ? Routes.applicationGuildCommands(clientId, guildId) // 特定サーバーに即時反映（開発向け）
      : Routes.applicationCommands(clientId); // 全サーバーに反映（グローバル。反映まで最大1時間ほどかかる）

  const result = (await rest.put(route, { body: commandsData })) as unknown[];
  console.log(`${result.length}個のスラッシュコマンドを登録しました`);
}

main(clientId, guildId).catch((error) => {
  console.error("コマンドの登録に失敗しました", error);
  process.exitCode = 1;
});
```

`command.data.toJSON()`で、各コマンドの定義をDiscordが理解できるデータ形式に変換し、`rest.put(...)`でDiscordのサーバーへまとめて送信しています。`.env`に`DISCORD_GUILD_ID`(テスト用サーバーのID)が設定されていれば、そのサーバーだけに即座に反映されます。未設定なら全サーバー向け(グローバル)の登録になりますが、この場合は反映まで最大1時間ほどかかることがあるため、開発中は`DISCORD_GUILD_ID`を設定しておくことを強く推奨します。

```bash
pnpm run deploy-commands
```

コマンドの中身(名前・説明・引数)を変えるたびに、この登録をやり直す必要があります。Botの通常の起動(`pnpm dev`)とは別の作業だという点を覚えておいてください。

## clientIdをmain関数の引数にしている理由

`token`と`clientId`は、ファイルの先頭で`undefined`でないことをチェックしています。ところが、これらの変数をそのまま`main()`関数の中で使おうとすると、TypeScriptは次のようなエラーを出します。

```
Argument of type 'string | undefined' is not assignable to parameter of type 'string'.
```

`if (clientId === undefined) { throw ... }`でチェックしたのに、なぜ`main`関数の中では`string | undefined`のまま扱われるのでしょうか。理由は、TypeScriptの型の絞り込み(06章)が、原則として「同じ関数の中でしか」有効にならないためです。`main`という別の関数を後から定義している場合、そこから見た`clientId`は「あとから書き換わっているかもしれない外側の変数」として扱われ、絞り込みの効果が引き継がれません(`const`で宣言していて実際には書き換わらないと分かっていても、TypeScriptは関数境界をまたいだ保証まではしません)。

対処法は、絞り込んだあとの値を関数の引数として明示的に渡すことです。

```typescript
main(clientId, guildId).catch((error) => { /* ... */ });
```

`main(clientId: string, guildId: string | undefined)`という引数の型を見れば、「この関数が呼ばれる時点では、`clientId`は必ず`string`である」という前提を関数の外(呼び出し側)で保証していることになります。この「チェック済みの値を、別の関数へ引数として渡す」というパターンは、非同期処理やコールバックが絡むコードで頻繁に登場するので覚えておいてください。

## 手順2: 打たれたコマンドを受け取る(index.ts)

登録が済んだら、実際にユーザーが`/ping`のようにコマンドを打ったときにBot側で処理を行う部分です。

```typescript
// src/index.ts (抜粋)
const commands = new Collection<string, Command>();
for (const command of [ping, note, remind]) {
  commands.set(command.data.name, command);
}

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) {
    return;
  }

  const command = commands.get(interaction.commandName);
  if (command === undefined) {
    console.error(`未登録のコマンドが呼ばれました: ${interaction.commandName}`);
    return;
  }

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
});
```

`Collection`はdiscord.jsが提供する、JavaScript標準の`Map`を拡張したデータ構造です(基本的な使い方は`Map`と同じだと考えて問題ありません)。`commands.set(command.data.name, command)`で、コマンド名から`Command`オブジェクトを引けるようにしておき、`InteractionCreate`イベント(何らかの操作がDiscord上で行われたときに発生する、スラッシュコマンドに限らないより広いイベント)が来るたびに、対応するコマンドの`execute`を呼び出しています。

`interaction.isChatInputCommand()`は、17章で学んだユーザー定義型ガードの一種です。この判定を通ったあとの`interaction`は、スラッシュコマンド特有のプロパティ(`commandName`や`options`)にアクセスできる型に絞り込まれています。`try`/`catch`で`execute`全体を囲んでいる理由と、`interaction.replied || interaction.deferred`の判定については、[26章](26-error-handling-and-wrap-up.md)で詳しく扱います。

## optionsから引数を取り出す

コマンドの`execute`の中では、`interaction.options`から、21章で定義した引数の値を取り出します。

```typescript
// src/commands/remind.ts (抜粋)
async execute(interaction, db) {
  const minutes = interaction.options.getInteger("minutes", true);
  const message = interaction.options.getString("message", true);
  // ...
}
```

`getInteger`・`getString`ともに、第2引数に`true`を渡すと戻り値の型から`null`が除かれ、`number`・`string`として扱えるようになります(21章の確認問題で見たとおりです)。21章で`.setRequired(true)`を付けた引数については、実行時にもDiscord側が入力を必須にしてくれるため、`true`を渡しても安全に`number`/`string`として扱えます。

## ephemeralな返信

`/note add`や`/remind`の返信には、`ephemeral: true`というオプションが付いています。

```typescript
await interaction.reply({
  content: `メモを追加しました（ID: ${created.id}）`,
  ephemeral: true,
});
```

`ephemeral: true`を付けた返信は、コマンドを打った本人にしか見えません(他の参加者のチャンネルには表示されません)。メモの内容のような個人的な情報は、チャンネル全体に公開する必要がないため、discord-botのほとんどの返信に`ephemeral: true`を付けています。逆に`/remind`が実際に時間になって送るお知らせ([25章](25-remind-command.md))は、チャンネル全体に見せる必要があるため`ephemeral`を付けていません。用途に応じて使い分けてください。

## 次の章

`/note`と`/remind`はどちらも、ユーザーごとのデータをBotの再起動後も保持する必要があります。次はそのためのデータベースの扱い方を学びます。→ [23章 node:sqliteでデータを永続化する](23-persisting-data-with-sqlite.md)
