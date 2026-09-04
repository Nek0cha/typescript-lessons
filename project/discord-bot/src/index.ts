import "dotenv/config";
import { Client, Collection, Events, GatewayIntentBits } from "discord.js";
import { createDb } from "./db.js";
import { note } from "./commands/note.js";
import { ping } from "./commands/ping.js";
import { remind } from "./commands/remind.js";
import { startReminderScheduler } from "./scheduler.js";
import type { Command } from "./types.js";

const token = process.env.DISCORD_TOKEN;
if (token === undefined) {
  throw new Error("環境変数 DISCORD_TOKEN が設定されていません（.envを確認してください）");
}

const db = createDb(new URL("../data/bot.sqlite", import.meta.url).pathname);

const commands = new Collection<string, Command>();
for (const command of [ping, note, remind]) {
  commands.set(command.data.name, command);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once(Events.ClientReady, (readyClient) => {
  console.log(`起動しました: ${readyClient.user.tag}`);
  startReminderScheduler(readyClient, db);
});

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

client.login(token);
