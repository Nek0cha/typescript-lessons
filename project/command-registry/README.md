# command-registry ― TypeScript中級編の教材プロジェクト

「型安全なコマンドレジストリ」を作りながら、TypeScriptの中級的な機能（ジェネリクス・ユーティリティ型・条件型・マップ型・カスタム型ガード・デコレータ）を学ぶための、実際に動くプロジェクトです。[中級編レッスン](../../lessons/)の13〜20章が、このコードを解説する形で書かれています。

`CommandRegistry`は、「コマンド名」「受け取る引数の型」「処理内容」を登録しておくと、実行時に渡された文字列の引数を自動で型変換し、型の合っていない値が渡ってきたらエラーにしてくれる仕組みです。ここでは実験用のping/addコマンドしか登録していませんが、この仕組み自体は[12章](../../lessons/12-next-steps-discord-bot.md)で作ったDiscord Botのコマンド処理にそのまま応用できるように設計しています。

## セットアップ

```bash
pnpm install
```

## 使い方

```bash
# 開発中の実行（コンパイル不要）
pnpm dev

# テストを実行
pnpm test

# 型チェックだけ行う
pnpm exec tsc --noEmit

# 本番向けにコンパイルしてから実行
pnpm build
pnpm start
```

## ファイル構成

```
src/
├── types.ts        コマンドの型定義（ジェネリクス・マップ型・条件型）
├── errors.ts        このプロジェクト専用のエラークラス
├── parse-args.ts    文字列の引数を、型に沿った値へ変換する（カスタム型ガード・網羅性チェック）
├── decorators.ts     メソッド呼び出しをログに残すデコレータ
├── registry.ts       コマンドの登録・実行を管理するCommandRegistryクラス
└── index.ts          動作確認用のエントリーポイント
tests/
└── registry.test.ts  vitestによるユニットテスト
```

## 既知の制約について

`decorators.ts`の`logCall`デコレータは、このプロジェクトのビルド・テスト環境（vitest 4系がバンドルするoxcベースの変換）では、テスト対象のクラスへ直接適用するとトランスフォームエラーになることを確認しています。`pnpm exec tsc --noEmit`や`pnpm dev`（tsx経由）では問題なく動作するため、`index.ts`側の独立した`Greeter`クラスにのみ適用し、テストでimportされる`CommandRegistry`本体には適用していません。将来ツール側のバージョンが上がれば解消される可能性がありますが、現時点ではこの構成を正としています。
