# discord-bot ― TypeScriptレッスン Discord Bot編の教材プロジェクト

[12章](../../lessons/12-next-steps-discord-bot.md)で動かした最小構成のBotと、[中級編](../command-registry/)で学んだ型の扱いを土台に、実際にスラッシュコマンドとデータベースを持つBotを組み立てるプロジェクトです。[Discord Bot編](../../lessons/)の21〜26章が、このコードを解説する形で書かれています。

## できること

- `/ping` … Botの応答速度を確認する
- `/note add` `/note list` `/note delete` … 自分用のメモをサーバーに保存する（ユーザーごとに独立）
- `/remind` … 指定した分数後に、同じチャンネルでリマインドする

メモとリマインドの内容は、Node.js標準の`node:sqlite`モジュールを使ってファイル（`data/bot.sqlite`）に保存されます。Botを再起動しても内容は消えません。

## セットアップ

### 1. Discord Developer Portalでの準備

[12章](../../lessons/12-next-steps-discord-bot.md)を参考に、Botを作成してトークンを取得してください。加えてこのプロジェクトでは以下も必要です。

- Developer Portalの「Bot」設定画面で「Message Content Intent」は不要です（スラッシュコマンドのみ使うため）
- 「General Information」ページの「Application ID」を控えておく
- 開発中に使うテスト用サーバーのサーバーID（Discord側で開発者モードを有効にし、サーバーを右クリック→「サーバーIDをコピー」）

### 2. 環境変数を設定する

```bash
cp .env.example .env
```

`.env`を開き、`DISCORD_TOKEN`・`DISCORD_CLIENT_ID`・`DISCORD_GUILD_ID`を埋めてください。

### 3. インストールとコマンド登録

```bash
pnpm install
pnpm run deploy-commands
```

`deploy-commands`は、`/ping`などのスラッシュコマンドをDiscord側に登録するための、Botの起動とは別の一度きりの作業です。コマンドの中身（名前・説明・引数）を変更したときは、この登録をやり直す必要があります。

### 4. Botを起動する

```bash
pnpm dev
```

## 開発用コマンド

```bash
pnpm dev              # 開発中の起動（tsx、Botとして実際にDiscordへ接続する）
pnpm run deploy-commands   # スラッシュコマンドをDiscordに登録する
pnpm test              # DB・リマインド判定ロジックのユニットテスト
pnpm exec tsc --noEmit # 型チェックのみ
pnpm build              # 本番向けにコンパイル
pnpm start              # コンパイル済みのコードを実行
```

## ファイル構成

```
src/
├── index.ts             Botの起動、イベントの受け口
├── deploy-commands.ts    スラッシュコマンドをDiscordに登録するスクリプト
├── db.ts                  node:sqliteを使ったデータの保存・取得
├── types.ts                Commandの共通の形
├── scheduler.ts             リマインドの期限チェックと送信
└── commands/
    ├── ping.ts
    ├── note.ts
    └── remind.ts
tests/
├── db.test.ts              DB層のユニットテスト
└── scheduler.test.ts        リマインド判定ロジックのユニットテスト（Discordへの実接続なし）
```

## テストについて

`discord.js`のクライアントは実際にDiscordへ接続しないと本物を用意できないため、`tests/scheduler.test.ts`では「このテストが使うメソッドだけを持つ最小限のダミー」に差し替えてテストしています。TypeScriptが構造的部分型（必要な形さえ満たしていれば、由来を問わず同じ型として扱う仕組み）を採用しているからこそ成立する書き方です。詳しくは[21〜26章](../../lessons/)で解説します。
