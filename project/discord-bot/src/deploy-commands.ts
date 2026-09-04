import "dotenv/config";
import { REST, Routes } from "discord.js";
import { note } from "./commands/note.js";
import { ping } from "./commands/ping.js";
import { remind } from "./commands/remind.js";

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.DISCORD_GUILD_ID;

if (token === undefined || clientId === undefined) {
  throw new Error("DISCORD_TOKEN と DISCORD_CLIENT_ID を .env に設定してください");
}

const commandsData = [ping, note, remind].map((command) => command.data.toJSON());

const rest = new REST().setToken(token);

async function main(clientId: string, guildId: string | undefined) {
  const route =
    guildId !== undefined
      ? Routes.applicationGuildCommands(clientId, guildId) // 特定サーバーに即時反映（開発向け）
      : Routes.applicationCommands(clientId); // 全サーバーに反映（グローバル。反映まで最大1時間ほどかかる）

  const result = (await rest.put(route, { body: commandsData })) as unknown[];
  console.log(`${result.length}個のスラッシュコマンドを登録しました`);
}

main(clientId, guildId).catch((error) => {
  console.error("コマンドの登録に失敗しました", error);
  process.exitCode = 1;
});
