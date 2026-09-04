import { describe, expect, it, vi } from "vitest";
import type { Client } from "discord.js";
import { createDb } from "../src/db.js";
import { checkReminders } from "../src/scheduler.js";

// discord.jsのClientを本物で用意するにはBotトークンでの接続が必要になるため、
// テストでは「このテストが使うメソッドだけ」を持った最小限のダミーで代用する。
// 構造的部分型のTypeScriptでは、必要な形さえ満たしていれば本物として扱える。
function createFakeClient(send: (content: string) => void) {
  const channel = {
    isSendable: () => true,
    send: async (content: string) => {
      send(content);
    },
  };

  return {
    channels: {
      fetch: async () => channel,
    },
  } as unknown as Client;
}

describe("checkReminders", () => {
  it("sends a message for a due reminder and marks it as notified", async () => {
    const db = createDb(":memory:");
    const sent: string[] = [];
    const client = createFakeClient((content) => sent.push(content));

    const now = new Date("2026-01-01T12:00:00.000Z");
    db.addReminder("user-1", "channel-1", "牛乳を買う", now);

    const count = await checkReminders(client, db, now);

    expect(count).toBe(1);
    expect(sent).toHaveLength(1);
    expect(sent[0]).toContain("牛乳を買う");
    expect(db.getDueReminders(now)).toHaveLength(0); // 通知済みになっている
  });

  it("does nothing when no reminder is due yet", async () => {
    const db = createDb(":memory:");
    const sent: string[] = [];
    const client = createFakeClient((content) => sent.push(content));

    const now = new Date("2026-01-01T12:00:00.000Z");
    const future = new Date("2026-01-01T13:00:00.000Z");
    db.addReminder("user-1", "channel-1", "まだ先の予定", future);

    const count = await checkReminders(client, db, now);

    expect(count).toBe(0);
    expect(sent).toHaveLength(0);
  });

  it("marks the reminder as notified even if sending fails", async () => {
    const db = createDb(":memory:");
    const client = {
      channels: { fetch: vi.fn().mockRejectedValue(new Error("network error")) },
    } as unknown as Client;

    const now = new Date("2026-01-01T12:00:00.000Z");
    const reminder = db.addReminder("user-1", "channel-1", "失敗するはず", now);

    await checkReminders(client, db, now);

    // 送信に失敗しても再送し続けないよう、notified扱いになっている
    expect(db.getDueReminders(now)).toHaveLength(0);
    expect(reminder.notified).toBe(false); // 返り値自体はスナップショットなので変化しない
  });
});
