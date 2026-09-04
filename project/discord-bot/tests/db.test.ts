import { beforeEach, describe, expect, it } from "vitest";
import { createDb, type Db } from "../src/db.js";

describe("db", () => {
  let db: Db;

  beforeEach(() => {
    db = createDb(":memory:");
  });

  describe("notes", () => {
    it("adds and lists notes for a user", () => {
      db.addNote("user-1", "買い物", "牛乳を買う");
      db.addNote("user-1", "TODO", "宿題をやる");

      const notes = db.listNotes("user-1");
      expect(notes).toHaveLength(2);
      expect(notes.map((n) => n.title)).toEqual(["TODO", "買い物"]); // 新しい順
    });

    it("does not leak notes between users", () => {
      db.addNote("user-1", "秘密", "user-1のメモ");
      db.addNote("user-2", "秘密", "user-2のメモ");

      expect(db.listNotes("user-1")).toHaveLength(1);
      expect(db.listNotes("user-2")).toHaveLength(1);
    });

    it("deletes a note only if it belongs to the requesting user", () => {
      const note = db.addNote("user-1", "買い物", "牛乳を買う");

      expect(db.deleteNote("user-2", note.id)).toBe(false); // 他人のメモは消せない
      expect(db.listNotes("user-1")).toHaveLength(1);

      expect(db.deleteNote("user-1", note.id)).toBe(true);
      expect(db.listNotes("user-1")).toHaveLength(0);
    });
  });

  describe("reminders", () => {
    it("returns only reminders that are due", () => {
      const now = new Date("2026-01-01T12:00:00.000Z");
      const past = new Date("2026-01-01T11:00:00.000Z");
      const future = new Date("2026-01-01T13:00:00.000Z");

      db.addReminder("user-1", "channel-1", "過去のリマインド", past);
      db.addReminder("user-1", "channel-1", "未来のリマインド", future);

      const due = db.getDueReminders(now);
      expect(due).toHaveLength(1);
      expect(due[0]?.message).toBe("過去のリマインド");
    });

    it("stops returning a reminder once it is marked as notified", () => {
      const now = new Date("2026-01-01T12:00:00.000Z");
      const reminder = db.addReminder("user-1", "channel-1", "リマインド", now);

      expect(db.getDueReminders(now)).toHaveLength(1);

      db.markReminderNotified(reminder.id);

      expect(db.getDueReminders(now)).toHaveLength(0);
    });
  });
});
