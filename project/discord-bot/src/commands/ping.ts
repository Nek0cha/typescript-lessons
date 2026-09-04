import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../types.js";

export const ping: Command = {
  data: new SlashCommandBuilder().setName("ping").setDescription("Botの応答速度を確認する"),

  async execute(interaction) {
    const sentAt = Date.now();
    await interaction.reply("計測中…");
    const latency = Date.now() - sentAt;
    await interaction.editReply(`pong! (${latency}ms)`);
  },
};
