import type { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import type { Db } from "./db.js";

// discord.jsのSlashCommandBuilderは、addStringOptionなどを呼ぶたびに
// 内部的な型が少しずつ変化する（呼び出しごとに戻り値の型が違う）ため、
// ここでは「最終的にJSONへ変換できるビルダー」という広めの型でまとめて受ける。
export type Command = {
  data: Pick<SlashCommandBuilder, "name" | "toJSON">;
  execute: (interaction: ChatInputCommandInteraction, db: Db) => Promise<void>;
};
