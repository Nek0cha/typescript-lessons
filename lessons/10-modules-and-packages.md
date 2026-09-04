# この章から通読モードを終え、必要になったときに引く参照モードに切り替わります

ここまでの10章はTypeScriptの文法を順番に積み上げる構成でしたが、この章からは少し性質が変わります。プロジェクトの構成やツールの使い方についてまとめた内容なので、一度目を通したあとは、実際にプロジェクトを作るときに該当箇所だけ読み返す使い方を想定しています。

## ファイルを分割する：import / export

これまでのコードはすべて`src/index.ts`の1ファイルに書いてきましたが、実際の開発ではファイルを機能ごとに分割します。分割したファイル同士でコードを共有するには、`export`と`import`を使います。

`src/tax.ts`というファイルに関数を定義し、外部から使えるようにexportします。

```typescript
// src/tax.ts
export function addTax(price: number): number {
  return price * 1.1;
}
```

`src/index.ts`から、そのファイルの中身をimportして使います。

```typescript
// src/index.ts
import { addTax } from "./tax.js";

console.log(addTax(1000));
```

importするパスの拡張子が`.ts`ではなく`.js`になっている点に注意してください。これは間違いではありません。02章の`tsconfig.json`で`"module": "NodeNext"`を指定した場合、TypeScriptはコンパイル後（つまりJavaScriptになったあと）のファイル構成を基準にimport文を解決するため、ソースコード上でも`.js`と書く決まりになっています。慣れないうちは違和感がありますが、Node.js + TypeScriptの標準的な構成ではこの書き方がルールです。

### exportの2つの書き方

```typescript
// 名前付きexport（1ファイルから複数exportできる）
export function addTax(price: number): number {
  return price * 1.1;
}
export function removeTax(price: number): number {
  return price / 1.1;
}

// import側は{}で囲んで名前を指定する
import { addTax, removeTax } from "./tax.js";
```

```typescript
// デフォルトexport（1ファイルにつき1つだけ）
export default function addTax(price: number): number {
  return price * 1.1;
}

// import側は{}を付けず、好きな名前を付けられる
import calculateTax from "./tax.js";
```

このシリーズでは、1ファイルから複数の関数やクラスをexportする場面が多いため、基本的に名前付きexportを使います。

## pnpmでパッケージを追加する

01章で説明したとおり、他人が作ったコードをパッケージとして取り込むには`pnpm add`を使います。

```bash
# 通常のパッケージ（実行時にも必要）
pnpm add discord.js

# 開発時にだけ必要なパッケージ（型定義など）
pnpm add -D @types/node

# パッケージを削除する
pnpm remove discord.js
```

`package.json`の`dependencies`と`devDependencies`の違いは02章で触れたとおりです。「実際にBotを動かすサーバー上でも必要か」を基準に判断してください。discord.jsのように実行時に使うライブラリは`dependencies`、`typescript`や`tsx`のように開発中だけ使うツールは`devDependencies`に入ります。

### @types/〜 パッケージとは

`@types/node`のように`@types/`から始まるパッケージは、そのライブラリ自体はTypeScriptで書かれていない（型情報を持たない）ものに対して、型情報だけを別途提供するパッケージです。npm上の多くのライブラリは最初からTypeScriptの型情報を含んでいますが、含んでいないライブラリを使う場合は`@types/パッケージ名`を追加でインストールする必要がないか確認してください。discord.jsは最初からTypeScriptで書かれているため、`@types/discord.js`のようなパッケージは不要です。

## package.jsonのscriptsを整備する

02章では`pnpm exec tsc`や`pnpm exec tsx src/index.ts`をそのまま打っていましたが、`package.json`の`scripts`に登録しておくと短いコマンドで実行できるようになります。

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

- `pnpm dev` … `tsx`でファイルの変更を監視しながら実行する（`watch`オプションにより、保存するたびに自動で再実行される）
- `pnpm build` … `tsc`でコンパイルする
- `pnpm start` … コンパイル済みのJavaScriptを実行する（本番運用を想定）

開発中は`pnpm dev`、実際にBotをサーバーにデプロイするときは`pnpm build`してから`pnpm start`、という使い分けが一般的です。

## tsconfig.jsonの主要オプション

02章で最小構成として設定した項目の意味をまとめておきます。

| オプション | 意味 |
|---|---|
| `target` | コンパイル後のJavaScriptがどのバージョンの仕様に準拠するか。`ES2022`はNode.js最新版で問題なく動く水準 |
| `module` | モジュールの解決方式。Node.jsでTypeScriptを使う場合は`NodeNext`を指定するのが現在の標準 |
| `moduleResolution` | importパスの解決アルゴリズム。`module`を`NodeNext`にした場合はこちらも`NodeNext`に揃える |
| `outDir` | コンパイル後のJavaScriptファイルの出力先フォルダ |
| `rootDir` | コンパイル対象のTypeScriptファイルが置かれているフォルダ |
| `strict` | 型チェックを最も厳格なモードにする。オフにすると型の恩恵の多くが失われるため常に`true`を推奨 |
| `esModuleInterop` | CommonJS形式（`require`を使う古い形式）のパッケージを`import`文で扱えるようにする互換設定 |
| `skipLibCheck` | node_modules内のパッケージが持つ型定義ファイルの型チェックを省略し、コンパイルを高速化する |

これ以外にも数十のオプションがありますが、Discord Bot開発の範囲であればこの構成から大きく変える必要はほとんどありません。

## 環境変数と.env：秘密の値をコードに書かない

Discord Botを動かすには「Botトークン」という、Botの操作権限を持つ秘密の文字列が必要になります（詳しくは[12章](12-next-steps-discord-bot.md)）。この値をソースコードに直接書いてしまうと、GitHubなどで公開したときに誰でもあなたのBotを操作できてしまいます。

こうした秘密の値は、環境変数（environment variable）としてコードの外側に置き、`.env`という名前のファイルにまとめて管理するのが一般的です。

```bash
pnpm add dotenv
```

```
# .env
DISCORD_TOKEN=ここに実際のトークンが入る
```

```typescript
// src/index.ts
import "dotenv/config";

const token = process.env.DISCORD_TOKEN;
console.log(token); // .envに書いた値が読み込まれる
```

`import "dotenv/config"`を実行すると、`.env`ファイルの中身が`process.env`（Node.jsが提供する、環境変数を格納するオブジェクト）に読み込まれます。

`.env`ファイルは絶対にGitで管理してはいけません。プロジェクトのルートに`.gitignore`というファイルを作り、次の1行を追加してください。

```
.env
```

こうしておくことで、`.env`ファイルはGitの管理対象から外れ、誤ってGitHubなどに公開してしまう事故を防げます。

## 次の章

型があってもプログラムが失敗する可能性そのものはなくならないので、次は失敗にどう向き合うか、エラー処理の書き方をきちんと学びます。→ [11章 エラー処理をきちんと書く](11-error-handling.md)
