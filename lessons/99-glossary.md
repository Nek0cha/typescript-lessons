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
| ジェネリクス（generics） | 型そのものを引数として受け取り、同じロジックを複数の型で使い回す仕組み | [13](13-generics.md) |
| ユーティリティ型 | Record・Partial・Pick・Omitなど、既存の型を加工して新しい型を作る組み込みの型 | [14](14-utility-types.md) |
| keyof | オブジェクト型からプロパティ名だけを取り出し、ユニオン型にする演算子 | [15](15-mapped-types-and-keyof.md) |
| インデックスアクセス型 | `T[K]`の形で、オブジェクト型からキーKに対応する値の型を取り出す書き方 | [15](15-mapped-types-and-keyof.md) |
| マップ型 | `{ [K in keyof T]: ... }`の形で、型の全プロパティに同じ変換を適用する構文 | [15](15-mapped-types-and-keyof.md) |
| typeof（型の位置での） | 既存の値から、その形をそのまま型として取り出す演算子 | [15](15-mapped-types-and-keyof.md) |
| 条件型 | `T extends U ? X : Y`の形で、型のレベルで分岐する構文 | [16](16-conditional-types-and-infer.md) |
| infer | 条件型の中で、マッチした型の一部を新しい型変数として取り出すキーワード | [16](16-conditional-types-and-infer.md) |
| is述語（type predicate） | `x is T`という戻り値の型で、関数に型の絞り込み効果を持たせる書き方 | [17](17-custom-type-guards.md) |
| never型 | 「絶対に発生しない値」を表す型。網羅性チェックに使う | [17](17-custom-type-guards.md) |
| デコレータ | `@関数名`の形で、クラスやメソッドに横断的な処理を後付けする構文 | [18](18-decorators.md) |
| vitest | このシリーズで使うテストランナー。describe/it/expectでテストを書く | [19](19-testing-with-vitest.md) |
| スラッシュコマンド | Discordの`/`から始まる正式なコマンドUI。SlashCommandBuilderで定義する | [21](21-slash-commands.md) |
| 構造的部分型（structural typing） | 値の由来ではなく、形（プロパティ・メソッドの有無）だけを見て型の一致を判断する仕組み | [21](21-slash-commands.md), [25](25-remind-command.md) |
| インタラクション（interaction） | スラッシュコマンドの実行など、Discord上でのユーザー操作を表すイベント | [22](22-handling-interactions.md) |
| ephemeral | コマンドを打った本人にしか見えない返信にするオプション | [22](22-handling-interactions.md) |
| SQLite / node:sqlite | ファイル1つにデータを保存する軽量データベースと、それをNode.js標準で扱うモジュール | [23](23-persisting-data-with-sqlite.md) |
| プリペアドステートメント | `?`をプレースホルダーにしてSQLと値を分離し、SQLインジェクションを防ぐ書き方 | [23](23-persisting-data-with-sqlite.md) |
| setInterval | 指定した間隔で処理を繰り返し実行するJavaScript標準の仕組み | [25](25-remind-command.md) |
| 型アサーション（as） | 「この値はこの型として扱ってよい」とTypeScriptに明示的に伝える書き方 | [09](09-async-await.md), [25](25-remind-command.md) |

[目次に戻る](../README.md)
