import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../types.js";

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
