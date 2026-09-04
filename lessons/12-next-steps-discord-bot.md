# Discord Botの実体は「discord.jsを使った、常時起動しているNode.jsプログラム」

ここまで11章かけて学んできたTypeScriptの文法は、Discord Botを作るために必要な道具がひととおり揃っています。この章では、実際にBotを動かすまでの最初の一歩を案内します。discord.jsは更新頻度の高いライブラリのため、細部のAPIは今後変わる可能性があります。ここで示すのはこのシリーズ執筆時点（discord.js v14系）の構成であり、実際に手を動かす際は[discord.js公式ガイド](https://discordjs.guide/)で最新情報を確認することをおすすめします。

## 1. Discord Developer PortalでBotを登録する

コードを書く前に、Discord側でBotの「身分証明書」にあたるものを発行する必要があります。

1. [Discord Developer Portal](https://discord.com/developers/applications)にアクセスし、Discordアカウントでログインする
2. 「New Application」からアプリケーションを新規作成する
3. 左側メニューの「Bot」から、Botユーザーを作成する
4. 「Reset Token」（または「Token」の表示）から、Botトークンを取得する

このトークンが、10章で扱った`.env`に書く値です。トークンはBotを完全に操作できる秘密の文字列なので、画面キャプチャやコードに含めたままGitHubに公開しないよう、常に注意してください。もし誤って公開してしまった場合は、同じ画面から「Reset Token」を実行すれば古いトークンは無効化されます。

Botをサーバーに招待するには、「OAuth2」→「URL Generator」から`bot`スコープと必要な権限（最低限は`Send Messages`と`Read Messages/View Channels`）を選び、生成されたURLを開いて自分のテスト用サーバーに招待してください。

## 2. discord.jsをインストールする

10章の内容に沿って、プロジェクトにdiscord.jsを追加します。

```bash
pnpm add discord.js
pnpm add dotenv
```

## 3. 最小構成のBotを書く

`.env`にトークンを書いたら（10章の`.env`の扱いと同じです）、`src/index.ts`に次のコードを書きます。

```typescript
// src/index.ts
import "dotenv/config";
import { Client, GatewayIntentBits, Events } from "discord.js";

const token = process.env.DISCORD_TOKEN;

if (token === undefined) {
  throw new Error("環境変数 DISCORD_TOKEN が設定されていません");
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once(Events.ClientReady, (readyClient) => {
  console.log(`起動しました: ${readyClient.user.tag}`);
});

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) {
    return; // Bot自身や他のBotのメッセージには反応しない
  }

  if (message.content === "!ping") {
    await message.reply("pong!");
  }
});

client.login(token);
```

コードの構成要素は、これまでの章で学んだ内容の組み合わせです。

- `if (token === undefined) { throw new Error(...) }` … [06章](06-control-flow.md)の型の絞り込みと[11章](11-error-handling.md)のエラー処理。トークンが設定されていない状態でBotを起動しようとした場合、分かりにくいエラーで落ちるより、原因が明確なメッセージで早期に止めたほうが親切です
- `client.on(Events.MessageCreate, async (message) => { ... })` … [09章](09-async-await.md)のasync/await。メッセージの送信は時間のかかる処理なので、`await message.reply(...)`という形になります
- `GatewayIntentBits` … Botがどんな種類のイベントを受け取るかを事前に宣言する仕組みです。Discord側の仕様で、必要な範囲だけを最小限に指定することが求められています

`GatewayIntentBits.MessageContent`は、メッセージの本文を読み取るために必須のインテントです。Developer Portalの「Bot」設定画面で「Message Content Intent」を別途オンにしないと、コード側で指定していてもメッセージの内容を取得できない点に注意してください（この設定はDiscord側の仕様変更が入ることがあるため、動かない場合はまずこの設定を疑ってください）。

## 4. 起動する

```bash
pnpm exec tsx src/index.ts
```

コンソールに「起動しました: ...」と表示され、招待したサーバーで`!ping`と送ると「pong!」と返ってくれば成功です。

## つまずきやすいポイント

- **Botがオフラインのまま**: トークンが正しいか、`.env`のキー名が`DISCORD_TOKEN`と一致しているかを確認してください
- **メッセージに反応しない**: Developer Portalの「Message Content Intent」がオンになっているか確認してください
- **`message.author.bot`のチェックを忘れる**: これを忘れると、Bot自身の発言に反応してBotが無限に発言し続けるループを引き起こすことがあります

## ここから先に進むために

このシリーズで扱ったのはBotの入り口までです。実際に機能を持ったBotに育てていく過程では、次のようなテーマに出会うことになります。

- **スラッシュコマンド**: `!ping`のようなメッセージ監視ではなく、Discordの`/`から始まる正式なコマンドUIを使う方法。discord.jsの`SlashCommandBuilder`と、Discord REST APIへのコマンド登録が必要になります
- **状態の永続化**: Botを再起動すると、それまでの会話の文脈やユーザーごとの設定は消えてしまいます。データベース（SQLiteやPostgreSQLなど）と組み合わせて保存する必要が出てきます
- **デプロイ**: 自分のパソコンでBotを動かしている間しかBotは反応しません。24時間動かし続けるには、Railway・Renderのようなホスティングサービスや、自宅・クラウドのサーバーにデプロイする知識が必要になります

これらはこのシリーズの範囲を超えるため個別には扱いませんが、いずれも[discord.js公式ガイド](https://discordjs.guide/)にチュートリアルがあります。ここまでの11章でTypeScriptの基礎は身についているはずなので、公式ドキュメントのコード例を読んでも迷わず読み進められるはずです。

## おわりに

00章の「型のチェックをしてくれるJavaScript」から始まり、変数・関数・配列・オブジェクト・型の合成・クラス・非同期処理・エラー処理と積み上げてきました。ここまでの内容は、TypeScriptで書かれた他のどんなプロジェクトを読むときにも通用する基礎です。Discord Botはその応用例の1つに過ぎないので、この先べつのジャンル（Webアプリ、CLIツールなど）に興味が向いても、この12章分の知識はそのまま活きます。

まずは自分のテスト用サーバーで、`!ping`以外のコマンドを1つ増やすところから始めてみてください。
