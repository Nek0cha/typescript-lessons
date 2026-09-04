# ここからDiscord Bot編、discord.js編を通してBotを組み立てます

中級編（13〜20章）で作った[command-registry](../project/command-registry/)は、Discordに依存しない練習用のプロジェクトでした。ここからのDiscord Bot編では、[12章](12-next-steps-discord-bot.md)で動かした最小構成のBotを土台に、実際にスラッシュコマンド・データベースを持つBot「[discord-bot](../project/discord-bot/)」を組み立てていきます。

## メッセージ監視からスラッシュコマンドへ

12章のBotは、`message.content === "!ping"`のようにメッセージの中身を直接チェックする方式でした。この方式は手軽な反面、コマンド名が衝突しやすい・Discordの入力補完が効かない・引数の形式を自分で決めて自分でパースする必要がある、といった弱点があります。

Discordには、`/`から始まる正式なコマンドUI(スラッシュコマンド)があります。あらかじめコマンドの名前・説明・引数の形をDiscord側に登録しておくと、ユーザーが`/`を打った時点で候補が表示され、引数も型ごとに専用の入力欄が出るようになります。discord-bot編では、最初からこちらの方式で作ります。

## SlashCommandBuilderでコマンドの形を定義する

discord.jsには、スラッシュコマンドの定義を組み立てるための`SlashCommandBuilder`が用意されています。もっとも単純な`/ping`コマンドを見てみます。

```typescript
// src/commands/ping.ts
import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../types.js";

export const ping: Command = {
  data: new SlashCommandBuilder().setName("ping").setDescription("Botの応答速度を確認する"),

  async execute(interaction) {
    const sentAt = Date.now();
    await interaction.reply("計測中…");
    const latency = Date.now() - sentAt;
    await interaction.editReply(`pong! (${latency}ms)`);
  },
};
```

`.setName("ping")`と`.setDescription(...)`のように、メソッドをつなげて(メソッドチェーンと呼びます)コマンドの見た目を組み立てます。`interaction.reply(...)`でまず返信し、`interaction.editReply(...)`でその返信内容をあとから書き換える、という2段階の返信によって「計測中…」から「pong! (12ms)」に表示が切り替わる様子を実装しています。

## 自分たちのCommand型を定義する

12章では1つのファイルに全部のコマンドを書いていましたが、コマンドの数が増えることを見越して、`discord-bot`では1コマンド1ファイルに分割しています。各ファイルが共通して持つべき形を、13章で学んだ`type`で定義しておきます。

```typescript
// src/types.ts
import type { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import type { Db } from "./db.js";

export type Command = {
  data: Pick<SlashCommandBuilder, "name" | "toJSON">;
  execute: (interaction: ChatInputCommandInteraction, db: Db) => Promise<void>;
};
```

`data`の型に、14章で学んだユーティリティ型`Pick`を使っている点に注目してください。`SlashCommandBuilder`は、`.addStringOption(...)`のようにオプションを追加するたびに、実は戻り値の型が細かく変化する作りになっています(追加したオプションの種類に応じて、TypeScript側でより詳しい型に絞り込むためです)。`Command`型の`data`をそのまま`SlashCommandBuilder`型と書いてしまうと、オプション付きのコマンドを代入しようとしたときに型が合わずエラーになることがあります。

そこで、`Command`が実際に必要としているもの(コマンド名を読み取れる`name`、JSON化できる`toJSON`)だけを`Pick`で取り出した型にすることで、「オプションをいくつ追加したビルダーでも受け入れられる」ゆるさを持たせています。「必要な形だけを型で要求する」という考え方は、TypeScriptが構造的部分型(structural typing、値の由来ではなく形だけを見て型の一致を判断する仕組み)を採用しているからこそ成立します。

## discord-botの3つのコマンド

`discord-bot`には、`/ping`のほかに2つのコマンドがあります。

- `/note` … 自分用のメモをサーバーに保存する([24章](24-note-command.md)で扱います)
- `/remind` … 指定した分数後にリマインドする([25章](25-remind-command.md)で扱います)

`/note`は`add`・`list`・`delete`という3つのサブコマンド(1つのコマンドの中に複数の使い方をぶら下げる機能)を持っています。

```typescript
// src/commands/note.ts (抜粋)
export const note: Command = {
  data: new SlashCommandBuilder()
    .setName("note")
    .setDescription("自分用のメモを管理する")
    .addSubcommand((sub) =>
      sub
        .setName("add")
        .setDescription("メモを追加する")
        .addStringOption((opt) => opt.setName("title").setDescription("メモのタイトル").setRequired(true))
        .addStringOption((opt) => opt.setName("body").setDescription("メモの内容").setRequired(true))
    )
    .addSubcommand((sub) => sub.setName("list").setDescription("自分のメモ一覧を見る"))
    .addSubcommand((sub) =>
      sub
        .setName("delete")
        .setDescription("メモを削除する")
        .addIntegerOption((opt) => opt.setName("id").setDescription("削除するメモのID").setRequired(true))
    ),
  // ...
};
```

`.addSubcommand((sub) => ...)`の中でさらに`.addStringOption(...)`や`.addIntegerOption(...)`を呼び、各サブコマンドが受け取る引数の名前・型・必須かどうかを定義しています。`.setRequired(true)`を付けなければ、04章で学んだオプション引数と同じように「省略可能な引数」になります。

この時点ではまだ`data`(コマンドの見た目の定義)しか作っていません。実際に`/ping`や`/note`を打ったときの処理(`execute`)については、[22章](22-handling-interactions.md)で扱います。

## 確認問題

次のコマンド定義は、`option.setRequired(true)`を書き忘れています。この場合、`title`引数はTypeScript上どんな型として`interaction.options.getString("title")`から返ってくると考えられますか。

```typescript
.addStringOption((opt) => opt.setName("title").setDescription("メモのタイトル"))
```

<details>
<summary>答えを見る</summary>

`string | null`になります。`setRequired(true)`を付けていないオプションは「渡されないかもしれない」引数として扱われるため、discord.jsは`getString`の戻り値に`null`の可能性を含めます。04章で見たオプション引数の`?: string`(戻り値が`string | undefined`になる場合)と似ていますが、discord.jsのAPIでは未指定時に`undefined`ではなく`null`が返る点が異なります。必須の引数であれば`interaction.options.getString("title", true)`のように第2引数へ`true`を渡すことで、戻り値の型を`string`(nullを含まない)に絞り込めます。[22章](22-handling-interactions.md)で実際の使い方を見ていきます。

</details>

## 次の章

コマンドの見た目を定義したので、次はそれをDiscordに登録し、実際に打たれたときの処理を書いていきます。→ [22章 インタラクションを処理する](22-handling-interactions.md)
