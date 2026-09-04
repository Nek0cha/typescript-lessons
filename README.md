# TypeScript入門レッスン ― Discord Bot開発を目指して

このリポジトリは、プログラミングを少しだけ経験したことがある人が、TypeScriptを一から学び、最終的に自分のDiscord Botを作れるようになるための教材です。

## 対象読者

次のどちらかに当てはまる人を想定しています。

- 変数・条件分岐（if）・繰り返し（for）が何かは知っているが、TypeScriptもJavaScriptもほぼ書いたことがない人
- 他の言語（Python、Scratch、GAS など何でも構いません）を少し触ったことがあり、次はTypeScriptを学びたい人

「プログラミング自体が完全に初めて」という人には少し駆け足に感じる可能性があります。その場合はProgateやドットインストールなどで「変数」「if文」「for文」の基礎だけ先に触れてから戻ってくることをおすすめします。

## このシリーズのゴール

TypeScriptの文法を一通り学んだあと、最終章（[12章](lessons/12-next-steps-discord-bot.md)）でDiscord Botを作るための最初の一歩まで案内します。1〜11章はDiscord Bot開発に直結する内容を選んで構成しているので、寄り道せずにゴールへたどり着けるはずです。

## 使い方

0〜9章は通読を想定しています。TypeScriptの文法を順番に積み上げる構成になっているので、飛ばさずに順番に読んでください。10章以降は少し性質が変わり、必要になったタイミングで読み返す参照部に近くなります。

各章の想定所要時間は目安であり、詰まった場合はもっとかかっても問題ありません。実際に手元でコードを動かしながら読むことを前提にした時間です。

## 目次

| 章 | タイトル | 学べること |
|---|---|---|
| 00 | [TypeScriptってそもそも何なのか](lessons/00-introduction.md) | JavaScriptとの関係、型を書くメリット |
| 01 | [開発環境を作る](lessons/01-setup.md) | Node.js・pnpm・VS Codeのセットアップ |
| 02 | [はじめてのTypeScriptプログラム](lessons/02-hello-typescript.md) | tscでのコンパイルと実行、型エラーの体験 |
| 03 | [変数と基本の型](lessons/03-variables-and-types.md) | let/const、string・number・boolean、型推論 |
| 04 | [関数](lessons/04-functions.md) | 関数宣言、引数と戻り値の型、アロー関数 |
| 05 | [配列とオブジェクト](lessons/05-arrays-and-objects.md) | 配列の型、オブジェクトの型、分割代入 |
| 06 | [条件分岐と繰り返し](lessons/06-control-flow.md) | if/switch、for/while、配列メソッド、型の絞り込み |
| 07 | [型をもっと使いこなす](lessons/07-types-deep-dive.md) | type/interface、union型、optionalプロパティ |
| 08 | [クラス](lessons/08-classes.md) | class、アクセス修飾子、継承、interfaceの実装 |
| 09 | [非同期処理](lessons/09-async-await.md) | Promise、async/await、非同期のエラー処理 |
| 10 | [モジュールとパッケージ管理](lessons/10-modules-and-packages.md) | import/export、pnpmでのパッケージ追加、tsconfig.json |
| 11 | [エラー処理をきちんと書く](lessons/11-error-handling.md) | try/catch、カスタムエラークラス |
| 12 | [次の一歩：Discord Botを作る](lessons/12-next-steps-discord-bot.md) | discord.jsの導入、Botトークンの安全な扱い方 |

用語のまとめは[用語集](lessons/99-glossary.md)にあります。本文中に出てきた専門用語で意味を忘れたときは、そちらを引いてください。

## パッケージ管理はpnpmを推奨します

このシリーズでは`npm`ではなく`pnpm`の利用を推奨します。理由は[01章](lessons/01-setup.md#pnpmを使う理由)で詳しく説明していますが、要点だけ先に書くと次のとおりです。

- ディスク容量を圧迫しにくい（同じパッケージを複数プロジェクトで使い回しても、実体は1つだけ保存される）
- `node_modules`の中身がnpmより厳格に管理されるため、「明示的にインストールしていないパッケージが動いてしまう」という事故が起きにくい
- インストール速度がnpmより速い傾向がある

とはいえ、`npm`しか使えない環境（一部の学習環境やCIなど）でこのシリーズのコードが動かないわけではありません。コマンドを読み替えれば`npm`でも進められます。

## 誤りの報告・質問について

この教材は現在ドラフト段階です。公開時の問い合わせ窓口（GitHub Issuesなど）は未定のため、ここは公開前に確定させてください。

## 最終更新日

2026-09-04（初版作成）
