import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";

export type Note = {
  id: number;
  userId: string;
  title: string;
  body: string;
  createdAt: string;
};

export type Reminder = {
  id: number;
  userId: string;
  channelId: string;
  message: string;
  remindAt: string;
  notified: boolean;
};

function rowToNote(row: Record<string, unknown>): Note {
  return {
    id: Number(row.id),
    userId: String(row.user_id),
    title: String(row.title),
    body: String(row.body),
    createdAt: String(row.created_at),
  };
}

function rowToReminder(row: Record<string, unknown>): Reminder {
  return {
    id: Number(row.id),
    userId: String(row.user_id),
    channelId: String(row.channel_id),
    message: String(row.message),
    remindAt: String(row.remind_at),
    notified: Number(row.notified) === 1,
  };
}

export function createDb(path: string) {
  if (path !== ":memory:") {
    mkdirSync(dirname(path), { recursive: true });
  }

  const db = new DatabaseSync(path);

  db.exec(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      message TEXT NOT NULL,
      remind_at TEXT NOT NULL,
      notified INTEGER NOT NULL DEFAULT 0
    );
  `);

  return {
    addNote(userId: string, title: string, body: string): Note {
      const createdAt = new Date().toISOString();
      const result = db
        .prepare("INSERT INTO notes (user_id, title, body, created_at) VALUES (?, ?, ?, ?)")
        .run(userId, title, body, createdAt);
      return { id: Number(result.lastInsertRowid), userId, title, body, createdAt };
    },

    listNotes(userId: string): Note[] {
      const rows = db.prepare("SELECT * FROM notes WHERE user_id = ? ORDER BY id DESC").all(userId);
      return rows.map(rowToNote);
    },

    deleteNote(userId: string, id: number): boolean {
      const result = db.prepare("DELETE FROM notes WHERE id = ? AND user_id = ?").run(id, userId);
      return Number(result.changes) > 0;
    },

    addReminder(userId: string, channelId: string, message: string, remindAt: Date): Reminder {
      const remindAtIso = remindAt.toISOString();
      const result = db
        .prepare(
          "INSERT INTO reminders (user_id, channel_id, message, remind_at, notified) VALUES (?, ?, ?, ?, 0)"
        )
        .run(userId, channelId, message, remindAtIso);
      return {
        id: Number(result.lastInsertRowid),
        userId,
        channelId,
        message,
        remindAt: remindAtIso,
        notified: false,
      };
    },

    getDueReminders(now: Date): Reminder[] {
      const rows = db
        .prepare("SELECT * FROM reminders WHERE notified = 0 AND remind_at <= ?")
        .all(now.toISOString());
      return rows.map(rowToReminder);
    },

    markReminderNotified(id: number): void {
      db.prepare("UPDATE reminders SET notified = 1 WHERE id = ?").run(id);
    },

    close(): void {
      db.close();
    },
  };
}

export type Db = ReturnType<typeof createDb>;
