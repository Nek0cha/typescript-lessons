# 用語集

本文中で説明した用語を、登場した章とあわせて一覧にしています。意味を忘れたときに引いてください。

| 用語 | 意味 | 登場章 |
|---|---|---|
| 型注釈（type annotation） | 変数や引数に`: 型名`と明示的に書くこと | [00](00-introduction.md) |
| コンパイル | TypeScriptのコードをJavaScriptに変換すること。`tsc`コマンドで行う | [00](00-introduction.md), [02](02-hello-typescript.md) |
| pnpm | このシリーズで推奨するパッケージ管理ツール。npmよりディスク効率と依存関係の厳格さに優れる | [01](01-setup.md) |
| package.json | プロジェクトに必要なパッケージや実行コマンドを記録する設定ファイル | [01](01-setup.md) |
| tsconfig.json | TypeScriptのコンパイル方法を設定するファイル | [02](02-hello-typescript.md), [10](10-modules-and-packages.md) |
| strictモード | tsconfig.jsonの設定の1つ。型チェックを最も厳格にする | [02](02-hello-typescript.md) |
| tsx | TypeScriptファイルをコンパイルせず直接実行できる開発用ツール | [02](02-hello-typescript.md) |
| 型推論（type inference） | 型注釈を書かなくても、代入された値からTypeScriptが型を自動判断すること | [03](03-variables-and-types.md) |
| プリミティブ型 | string・number・booleanなど、JavaScriptに元々ある基本的な値の種類 | [03](03-variables-and-types.md) |
| any型 | どんな値でも受け入れ、型チェックが実質無効になる型。基本的に使わない | [03](03-variables-and-types.md) |
| unknown型 | anyと同様どんな値でも受け入れるが、使う前に型の確認を要求する型 | [03](03-variables-and-types.md), [06](06-control-flow.md) |
| テンプレートリテラル | バッククォートで文字列を囲み、`${}`で変数を埋め込む書き方 | [03](03-variables-and-types.md) |
| アロー関数 | `(引数) => 処理`の形で関数を書く記法 | [04](04-functions.md) |
| オプション引数 | `?`を付けて「渡さなくてもよい」とした引数・プロパティ | [04](04-functions.md), [05](05-arrays-and-objects.md) |
| タプル | 要素数と各位置の型が固定された配列 | [05](05-arrays-and-objects.md) |
| 分割代入（destructuring） | オブジェクトや配列から値を個別の変数として取り出す書き方 | [05](05-arrays-and-objects.md) |
| readonly | プロパティを初期化後に再代入不可にする修飾子 | [05](05-arrays-and-objects.md) |
| 型の絞り込み（narrowing） | 条件分岐によって、複数の可能性がある型を1つに絞り込むこと | [03](03-variables-and-types.md), [06](06-control-flow.md) |
| ユニオン型 | `A \| B`の形で「AかBのどちらか」を表す型 | [06](06-control-flow.md), [07](07-types-deep-dive.md) |
| インターセクション型 | `A & B`の形で「AとBの両方」を表す型 | [07](07-types-deep-dive.md) |
| リテラル型 | `"pending"`のような特定の値そのものを表す型 | [07](07-types-deep-dive.md) |
| クラス | データ（プロパティ）と処理（メソッド）をまとめて定義する仕組み | [08](08-classes.md) |
| コンストラクタ | `new`でインスタンスを作るときに呼ばれる初期化処理 | [08](08-classes.md) |
| アクセス修飾子 | `public`/`private`/`protected`。プロパティやメソッドへのアクセス範囲を制限する | [08](08-classes.md) |
| 継承（extends） | あるクラスの機能を引き継いで新しいクラスを作ること | [08](08-classes.md) |
| Promise | 「あとで結果が返ってくる（かもしれない）」非同期処理を表す型 | [09](09-async-await.md) |
| async/await | Promiseを同期処理のように書ける構文 | [09](09-async-await.md) |
| モジュール（import/export） | ファイルをまたいでコードを共有する仕組み | [10](10-modules-and-packages.md) |
| 環境変数 | コードの外側で管理する設定値。`.env`ファイルとdotenvパッケージで扱う | [10](10-modules-and-packages.md) |
| throw / try / catch | エラーを発生させる（throw）・捕まえて処理する（try/catch）構文 | [11](11-error-handling.md) |
| カスタムエラークラス | `Error`を継承して作る、独自のエラーの種類 | [11](11-error-handling.md) |
| インテント（Intent） | discord.jsでBotが受け取るイベントの種類を事前に宣言する仕組み | [12](12-next-steps-discord-bot.md) |

[目次に戻る](../README.md)
