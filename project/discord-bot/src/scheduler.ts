import type { Client } from "discord.js";
import type { Db } from "./db.js";

// 期限が来ているリマインドを見つけて送信し、送信済みとしてマークする。
// テストしやすいように、Discordへの送信自体はclient.channels.fetchに切り出している。
export async function checkReminders(client: Client, db: Db, now: Date = new Date()): Promise<number> {
  const due = db.getDueReminders(now);

  for (const reminder of due) {
    try {
      const channel = await client.channels.fetch(reminder.channelId);
      // isSendable()はdiscord.js標準の型ガード（17章で学んだis述語と同じ仕組み）。
      // これを通れば、channelは.send()を持つ型に絞り込まれる。
      if (channel !== null && channel.isSendable()) {
        await channel.send(`<@${reminder.userId}> ⏰ リマインド: ${reminder.message}`);
      }
    } catch (error) {
      console.error(`リマインド送信に失敗しました（id: ${reminder.id}）`, error);
    } finally {
      // 送信に失敗しても、同じリマインドを延々と再送し続けないようにマークしておく
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
