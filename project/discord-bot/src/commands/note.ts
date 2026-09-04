import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../types.js";

export const note: Command = {
  data: new SlashCommandBuilder()
    .setName("note")
    .setDescription("自分用のメモを管理する")
    .addSubcommand((sub) =>
      sub
        .setName("add")
        .setDescription("メモを追加する")
        .addStringOption((opt) => opt.setName("title").setDescription("メモのタイトル").setRequired(true))
        .addStringOption((opt) => opt.setName("body").setDescription("メモの内容").setRequired(true))
    )
    .addSubcommand((sub) => sub.setName("list").setDescription("自分のメモ一覧を見る"))
    .addSubcommand((sub) =>
      sub
        .setName("delete")
        .setDescription("メモを削除する")
        .addIntegerOption((opt) => opt.setName("id").setDescription("削除するメモのID").setRequired(true))
    ),

  async execute(interaction, db) {
    const subcommand = interaction.options.getSubcommand();
    const userId = interaction.user.id;

    if (subcommand === "add") {
      const title = interaction.options.getString("title", true);
      const body = interaction.options.getString("body", true);
      const created = db.addNote(userId, title, body);
      await interaction.reply({
        content: `メモを追加しました（ID: ${created.id}）\n**${created.title}**\n${created.body}`,
        ephemeral: true,
      });
      return;
    }

    if (subcommand === "list") {
      const notes = db.listNotes(userId);
      if (notes.length === 0) {
        await interaction.reply({ content: "登録されたメモはありません。", ephemeral: true });
        return;
      }
      const lines = notes.map((n) => `- **[${n.id}] ${n.title}**: ${n.body}`);
      await interaction.reply({ content: lines.join("\n"), ephemeral: true });
      return;
    }

    if (subcommand === "delete") {
      const id = interaction.options.getInteger("id", true);
      const deleted = db.deleteNote(userId, id);
      await interaction.reply({
        content: deleted ? `メモ（ID: ${id}）を削除しました。` : `ID: ${id} のメモが見つかりませんでした。`,
        ephemeral: true,
      });
      return;
    }
  },
};
