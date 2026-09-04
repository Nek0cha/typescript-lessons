# Botのメモリ上のデータは、再起動すると消える

09章までのコードは、プログラムが動いている間だけデータを保持していれば十分でした。しかしBotは違います。ユーザーが`/note add`で保存したメモは、Botを再起動したあとも(サーバーの再起動やデプロイのやり直しがあっても)残っていてほしいデータです。プログラムの外、ファイルという形でデータを保存する仕組みが必要になります。

## SQLiteとnode:sqlite

SQLiteは、1つのファイルにデータベース全体を保存する、軽量なデータベースです。サーバーを別途起動する必要がなく、ファイルをコピーするだけでバックアップも取れるため、`discord-bot`のように「そこまで大規模ではないが、確実にデータを残したい」用途に向いています。

Node.jsには`node:sqlite`という、SQLiteを扱うためのモジュールが標準で組み込まれています。外部パッケージを追加でインストールする必要がなく、`import`するだけで使えます。

```typescript
import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync("data/bot.sqlite"); // ファイルが無ければ自動作成される
```

`":memory:"`という特別な文字列を渡すと、ファイルに保存せず、メモリ上だけで完結するデータベースを作れます。この性質はテストで重宝します(後述します)。

## テーブルを作る

SQLiteでは、データを表(テーブル)の形で保存します。discord-botには、メモを保存する`notes`テーブルとリマインドを保存する`reminders`テーブルの2つがあります。

```typescript
// src/db.ts (抜粋)
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
```

`db.exec(...)`に、SQL(データベースへの命令を書くための言語)をそのまま渡しています。`CREATE TABLE IF NOT EXISTS`は「まだこのテーブルが無ければ作る」という意味で、Botを起動するたびに実行しても、2回目以降は何も起きません。`id INTEGER PRIMARY KEY AUTOINCREMENT`は、「行が追加されるたびに自動的に増える、重複しない番号」を表す定番の書き方です。

`notes`テーブルの各列(カラム)は、05章で見たオブジェクトのプロパティと似た役割です。`user_id`でどのユーザーのメモかを区別し、`title`と`body`にメモの内容を保存します。

## 値の出し入れにはprepared statementを使う

SQL文の中にユーザーの入力をそのまま埋め込む(文字列連結する)と、SQLインジェクションと呼ばれる深刻なセキュリティ上の問題を引き起こす可能性があります。`node:sqlite`では、`?`をプレースホルダー(値が入る場所の仮置き)として使い、実際の値は別の引数として渡す書き方(プリペアドステートメント)を使います。

```typescript
// src/db.ts (抜粋)
addNote(userId: string, title: string, body: string): Note {
  const createdAt = new Date().toISOString();
  const result = db
    .prepare("INSERT INTO notes (user_id, title, body, created_at) VALUES (?, ?, ?, ?)")
    .run(userId, title, body, createdAt);
  return { id: Number(result.lastInsertRowid), userId, title, body, createdAt };
},
```

`db.prepare(SQL文)`でSQL文の雛形を用意し、`.run(値1, 値2, ...)`で実際の値を`?`の位置に当てはめて実行します。ユーザーが入力した`title`や`body`にどんな文字列が入っていても、SQLの構文そのものとして解釈されることはありません。`INSERT`(追加)のほかに、値を読み取る`SELECT`には`.all()`(複数行取得)や`.get()`(1行だけ取得)、更新・削除には`.run()`を使います。

```typescript
// src/db.ts (抜粋)
listNotes(userId: string): Note[] {
  const rows = db.prepare("SELECT * FROM notes WHERE user_id = ? ORDER BY id DESC").all(userId);
  return rows.map(rowToNote);
},

deleteNote(userId: string, id: number): boolean {
  const result = db.prepare("DELETE FROM notes WHERE id = ? AND user_id = ?").run(id, userId);
  return Number(result.changes) > 0;
},
```

`deleteNote`の`WHERE id = ? AND user_id = ?`という条件に注目してください。単に`id`だけで検索すると、他のユーザーのメモまで削除できてしまいます。`user_id`も条件に含めることで、「自分のメモしか削除できない」という制約をSQLの時点で保証しています。`result.changes`(実際に変更された行数)が0より大きいかどうかで、削除が実際に行われたかを判定しています。

## SQLの結果に型を付ける

`node:sqlite`の`.all()`や`.get()`は、`Record<string, unknown>`という、列の名前も型も特定されていないゆるい型でデータを返してきます。09章で`fetch`の結果に`as`で型を指定したのと同じく、SQLの結果もTypeScript自身は中身の形を保証してくれません。`discord-bot`では、この変換をまとめる小さな関数を用意しています。

```typescript
// src/db.ts (抜粋)
function rowToNote(row: Record<string, unknown>): Note {
  return {
    id: Number(row.id),
    userId: String(row.user_id),
    title: String(row.title),
    body: String(row.body),
    createdAt: String(row.created_at),
  };
}
```

`Number(...)`や`String(...)`で明示的に変換しているのは、SQLiteの列の型がJavaScript側で必ずしも期待どおりの型として返ってくるとは限らないためです(例えば`INTEGER`列が状況により`bigint`で返ることがあります)。1か所にこの変換をまとめておくことで、`listNotes`や`addNote`を呼び出す側は、常に`Note`型という決まった形のデータだけを扱えます。

## テストしやすい設計にする

`discord-bot`のDB関連の処理は、`createDb(path)`という1つの関数にまとめられています。

```typescript
// src/db.ts (抜粋)
export function createDb(path: string) {
  // ... テーブル作成 ...
  return {
    addNote(userId: string, title: string, body: string): Note { /* ... */ },
    listNotes(userId: string): Note[] { /* ... */ },
    deleteNote(userId: string, id: number): boolean { /* ... */ },
    addReminder(/* ... */): Reminder { /* ... */ },
    getDueReminders(now: Date): Reminder[] { /* ... */ },
    markReminderNotified(id: number): void { /* ... */ },
    close(): void { /* ... */ },
  };
}
```

本番では`createDb("data/bot.sqlite")`のようにファイルパスを渡しますが、19章で扱ったテストでは`createDb(":memory:")`を使い、実行のたびにまっさらな(前回のテストの影響を受けない)データベースを用意しています。

```typescript
// tests/db.test.ts (抜粋)
import { beforeEach, describe, expect, it } from "vitest";
import { createDb, type Db } from "../src/db.js";

describe("db", () => {
  let db: Db;

  beforeEach(() => {
    db = createDb(":memory:");
  });

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
});
```

`beforeEach`(各テストの実行前に毎回呼ばれる関数)で新しい`:memory:`データベースを作り直すことで、テストどうしがお互いのデータに影響し合わないようにしています。「ユーザーをまたいでメモが漏れていないか」(`does not leak notes between users`)のような、実際に起きたら困るケースをテストとして明文化できるのが、ファイルではなくインメモリでテストできることの利点です。

## 確認問題

`notes`テーブルに、メモを最終更新した日時を記録する`updated_at`列を追加したいとします。`CREATE TABLE`のSQL文をどう変更すればよいでしょうか。また、既存の`addNote`関数はそのままで問題ないか考えてみてください。

<details>
<summary>答えを見る</summary>

`CREATE TABLE`に`updated_at TEXT NOT NULL`のような列定義を1行追加します。

```sql
CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

ただし、これだけでは不十分です。`addNote`のSQL文(`INSERT INTO notes (user_id, title, body, created_at) VALUES (?, ?, ?, ?)`)は`updated_at`に値を渡していないため、`NOT NULL`制約に違反してエラーになります。`INSERT`文にも`updated_at`を追加し、`Note`型・`rowToNote`関数にも`updatedAt`プロパティを足す必要があります。テーブルの構造を変えると、それに連動するコードが複数箇所にまたがって存在する、という感覚をつかんでおいてください。

</details>

## 次の章

データベースの土台ができたので、次はこれを使う最初のコマンド`/note`を実際に組み立てます。→ [24章 /noteコマンドを作る](24-note-command.md)
