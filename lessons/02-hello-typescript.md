# TypeScriptはコンパイルしてから実行する

前章で作った`ts-lesson`フォルダに、最初のTypeScriptファイルを書いて実行します。まずはTypeScript本体をプロジェクトにインストールするところから始めます。

## TypeScriptをインストールする

```bash
pnpm add -D typescript
```

`add`はパッケージを追加するコマンド、`-D`は「開発時にだけ必要なパッケージ」であることを示すオプションです（`--save-dev`の省略形）。TypeScriptはコードを書いたり変換したりするための道具であって、完成したBotを実際に動かすサーバー上では不要になるため、`-D`を付けます。

実行すると`package.json`に次のような行が追加されます。

```json
"devDependencies": {
  "typescript": "^5.6.3"
}
```

同時に、どのバージョンのどのパッケージが実際にインストールされたかを記録する`pnpm-lock.yaml`というファイルも作られます。このファイルは中身を手で編集するものではありませんが、消さずにGit管理下に置いておくべきファイルです（他の人が同じプロジェクトを`pnpm install`したときに、まったく同じバージョンのパッケージが再現されるようになります）。

## tsconfig.jsonを作る

TypeScriptには「どうやってコンパイルするか」の設定ファイルが必要です。`tsconfig.json`という名前で、次のコマンドで雛形を作れます。

```bash
pnpm exec tsc --init
```

`pnpm exec`は「プロジェクトにインストールしたパッケージのコマンドを実行する」という意味です。グローバルにインストールしていなくても、プロジェクト内の`tsc`（TypeScriptコンパイラ）を呼び出せます。

生成される`tsconfig.json`は設定項目がコメントごとにずらっと並んでいて情報量が多いので、今の時点では次の最小構成に置き換えてしまって問題ありません。各項目の意味は[10章](10-modules-and-packages.md)で詳しく扱います。

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"]
}
```

とくに`"strict": true`は重要な設定です。TypeScriptの型チェックを最も厳しいモードにするオプションで、これをオフにすると型を書いていない変数が黙って`any`（何でも許容する型）として扱われてしまい、TypeScriptを使う意味が薄れます。このシリーズでは常に`true`のまま進めます。

## はじめてのファイルを書く

`src`フォルダを作り、その中に`index.ts`というファイルを作ります。拡張子は`.js`ではなく`.ts`です。

```bash
mkdir src
```

`src/index.ts`に次のコードを書いてください。

```typescript
function greet(name: string): string {
  return `こんにちは、${name}さん！`;
}

console.log(greet("Neko"));
```

## コンパイルして実行する

TypeScriptのファイルはそのままでは実行できません。まずJavaScriptに変換（コンパイル）する必要があります。

```bash
pnpm exec tsc
```

エラーが出なければ、`tsconfig.json`で指定した`outDir`（今回は`dist`）の中に`index.js`が生成されます。これがコンパイル後のJavaScriptファイルです。中身を覗いてみると、型注釈がすべて取り除かれた素のJavaScriptになっていることが分かります。

生成された`dist/index.js`をNode.jsで実行します。

```bash
node dist/index.js
# こんにちは、Nekoさん！
```

「コードを書く → `tsc`でコンパイル → `node`で実行する」という2段階の流れが、TypeScript開発の基本形です。

## わざと型エラーを起こしてみる

型チェックの効果を体感するために、`src/index.ts`を次のように書き換えてみてください。

```typescript
function greet(name: string): string {
  return `こんにちは、${name}さん！`;
}

console.log(greet(123));
```

VS Codeで開いていれば、`123`の下に赤い波線が表示されるはずです。カーソルを合わせると次のようなメッセージが出ます。

```
Argument of type 'number' is not assignable to parameter of type 'string'.
```

「`greet`関数は文字列を受け取る約束なのに、数値を渡している」とエディタが教えてくれています。この状態で`pnpm exec tsc`を実行するとコンパイル自体が失敗し、`dist/index.js`は更新されません。実行時に初めてバグに気づくのではなく、コードを書いている最中に気づけるというのが、00章で説明した型の恩恵です。試したら`greet("Neko")`に戻しておいてください。

## 補足：tscを毎回打つのが面倒なとき

開発中は「保存するたびにコンパイルし直して実行する」を何度も繰り返します。毎回`tsc`と`node`を別々に打つのは非効率なので、`tsx`というパッケージを使うと、TypeScriptファイルをコンパイルせず直接実行できます。

```bash
pnpm add -D tsx
pnpm exec tsx src/index.ts
```

`tsx`は内部でその場限りの変換をして実行してくれる開発用ツールです。ただし型エラーがあっても実行自体は通ってしまうことがあるため、「型チェックは`tsc`、日々の実行は`tsx`」という使い分けを覚えておくと便利です。[10章](10-modules-and-packages.md)で`package.json`の`scripts`にコマンドを登録する方法もあわせて紹介します。

## 次の章

型注釈の基本形は`name: string`のように見てきましたが、TypeScriptにどんな型があるのかをここから体系的に見ていきます。→ [03章 変数と基本の型](03-variables-and-types.md)
