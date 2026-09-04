# /remindは「打った瞬間」と「あとで送る瞬間」の2つのタイミングを持つ

24章の`/note`は、コマンドを打った瞬間にすべての処理が完結していました。`/remind`は違います。「10分後に知らせてほしい」という予約を受け付ける処理と、実際に10分後にお知らせを送る処理は、まったく別のタイミングで動きます。この章では、その2つのタイミングをどう実現しているかを見ていきます。

## タイミング1: 予約を受け付ける(remind.ts)

```typescript
// src/commands/remind.ts
export const remind: Command = {
  data: new SlashCommandBuilder()
    .setName("remind")
    .setDescription("指定した分数後に、このチャンネルでリマインドする")
    .addIntegerOption((opt) =>
      opt.setName("minutes").setDescription("何分後にリマインドするか").setRequired(true).setMinValue(1)
    )
    .addStringOption((opt) =>
      opt.setName("message").setDescription("リマインド内容").setRequired(true)
    ),

  async execute(interaction, db) {
    const minutes = interaction.options.getInteger("minutes", true);
    const message = interaction.options.getString("message", true);

    const remindAt = new Date(Date.now() + minutes * 60 * 1000);
    db.addReminder(interaction.user.id, interaction.channelId, message, remindAt);

    await interaction.reply({
      content: `${minutes}分後にお知らせします：「${message}」`,
      ephemeral: true,
    });
  },
};
```

`.setMinValue(1)`は21章では紹介しなかった書き方で、「1未満の数値は入力させない」という制約をDiscord側のUIレベルで課しています(0分後や負の分数を防ぐためです)。`Date.now() + minutes * 60 * 1000`で「今から`minutes`分後」の時刻を計算し、`db.addReminder(...)`で23章のデータベースに保存しています。この時点では、まだ誰にも何も通知していません。単に「いつ・誰に・どのチャンネルで・何を知らせるか」を記録しただけです。

## タイミング2: 期限が来たら送る(scheduler.ts)

「予約されたリマインドの中に、今この瞬間に送るべきものがないか」を定期的に確認する処理が必要です。この役割を`scheduler.ts`が担っています。

```typescript
// src/scheduler.ts
export async function checkReminders(client: Client, db: Db, now: Date = new Date()): Promise<number> {
  const due = db.getDueReminders(now);

  for (const reminder of due) {
    try {
      const channel = await client.channels.fetch(reminder.channelId);
      if (channel !== null && channel.isSendable()) {
        await channel.send(`<@${reminder.userId}> ⏰ リマインド: ${reminder.message}`);
      }
    } catch (error) {
      console.error(`リマインド送信に失敗しました（id: ${reminder.id}）`, error);
    } finally {
      db.markReminderNotified(reminder.id);
    }
  }

  return due.length;
}

export function startReminderScheduler(client: Client, db: Db, intervalMs = 30_000): NodeJS.Timeout {
  return setInterval(() => {
    checkReminders(client, db).catch((error) => {
      console.error("リマインドの定期チェックでエラーが発生しました", error);
    });
  }, intervalMs);
}
```

`startReminderScheduler`は、`setInterval`(06章のfor/whileとは別の、指定した間隔で処理を繰り返すJavaScript標準の仕組み)を使って、30秒ごとに`checkReminders`を呼び出します。`checkReminders`は23章の`db.getDueReminders(now)`(現在時刻より前で、まだ通知していないリマインドの一覧)を取得し、1件ずつDiscordへ送信します。

## isSendableという、discord.js標準の型ガード

`client.channels.fetch(...)`は、チャンネルのIDから実際のチャンネルオブジェクトを取得しますが、Discordには「メッセージを送れるチャンネル」と「送れないチャンネル」(カテゴリなど)の両方が存在するため、戻り値の型はそのままでは`.send(...)`を呼べません。discord.jsは、これを判定するための型ガードを標準で用意しています。

```typescript
if (channel !== null && channel.isSendable()) {
  await channel.send(`<@${reminder.userId}> ⏰ リマインド: ${reminder.message}`);
}
```

`channel.isSendable()`は、17章で学んだ`is`述語(ユーザー定義型ガード)そのものです。discord.jsの型定義を見ると、`isSendable(): this is SendableChannels`という形で宣言されており、`if`を通ったあとの`channel`は「`.send()`を持つ型」に絞り込まれます。「自分で`is`述語を書けるようになった」という17章の学びが、「ライブラリが提供する`is`述語を読み解ける」という力にもつながっていることを、ここで実感できると思います。

## finally節で「送信できなくても記録する」

```typescript
try {
  // ... 送信処理 ...
} catch (error) {
  console.error(`リマインド送信に失敗しました（id: ${reminder.id}）`, error);
} finally {
  db.markReminderNotified(reminder.id);
}
```

11章で学んだ`finally`節が、`try`が成功しても`catch`に落ちても必ず`db.markReminderNotified(reminder.id)`を実行しています。これは意図的な設計です。もし送信に失敗したときだけ「未通知のまま」にしてしまうと、次の30秒後のチェックでも同じリマインドが再び送信を試み、その失敗がまた繰り返される可能性があります(チャンネルが削除された、Botがそのサーバーから抜けた、といった恒久的な失敗の場合、これは無限にログを吐き続けるだけの処理になってしまいます)。「一度試して失敗したら、原因の記録だけ残してあきらめる」という判断を、あえて`finally`で表現しています。

## Discordに接続せずにこのロジックをテストする

`checkReminders`は`Client`(discord.jsのBot本体)を引数に取りますが、テストのたびに本物のBotとしてDiscordへ接続するのは非現実的です。21章で見た構造的部分型の考え方を使うと、「このテストが実際に使うメソッドだけを持つダミー」を用意してテストできます。

```typescript
// tests/scheduler.test.ts (抜粋)
function createFakeClient(send: (content: string) => void) {
  const channel = {
    isSendable: () => true,
    send: async (content: string) => {
      send(content);
    },
  };

  return {
    channels: { fetch: async () => channel },
  } as unknown as Client;
}

it("sends a message for a due reminder and marks it as notified", async () => {
  const db = createDb(":memory:");
  const sent: string[] = [];
  const client = createFakeClient((content) => sent.push(content));

  const now = new Date("2026-01-01T12:00:00.000Z");
  db.addReminder("user-1", "channel-1", "牛乳を買う", now);

  const count = await checkReminders(client, db, now);

  expect(count).toBe(1);
  expect(sent[0]).toContain("牛乳を買う");
  expect(db.getDueReminders(now)).toHaveLength(0);
});
```

`as unknown as Client`という書き方は、「本来の`Client`型とは構造が違うが、このテストで使う範囲では代用できる」とTypeScriptに強制的に伝える型アサーションです。`checkReminders`が実際に呼び出すのは`client.channels.fetch(...)`と、その戻り値の`isSendable()`・`send(...)`だけなので、それ以外の(本物の`Client`が持つ膨大な)機能を持たないダミーでも、このテストの目的には十分です。`checkReminders`関数の第3引数`now`にテスト用の固定時刻を渡せるようにしてあるのも、「本当に30秒待たないとテストできない」という事態を避けるための設計です。

## 確認問題

`checkReminders`が`db.markReminderNotified(reminder.id)`を`finally`ではなく`try`の中、`channel.send(...)`のすぐあとに書いていたとします。どんな不具合が起こり得るか考えてみてください。

<details>
<summary>答えを見る</summary>

`channel.send(...)`が失敗して`catch`に処理が移った場合、`try`の中にある`db.markReminderNotified(reminder.id)`は実行されません。その結果、そのリマインドは「未通知」のまま残り続け、30秒ごとの次回チェックで再び送信が試みられます。送信が恒久的に失敗する状況(チャンネル削除など)では、このリマインドが際限なく再試行され続け、ログにエラーが出力され続けることになります。`finally`に置くことで、成功・失敗のどちらであっても1回の試行で「通知済み」として扱い、この無限リトライを防いでいます。

</details>

## 次の章

コマンドが増え、DBやスケジューラーが絡むようになった今、エラーが起きたときにBot全体が落ちないようにする設計を最後に固めます。→ [26章 Botらしいエラー処理と仕上げ](26-error-handling-and-wrap-up.md)
