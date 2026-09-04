# is述語は「この関数を通れば、型が絞り込まれる」と宣言する仕組み

06章で、`typeof value === "string"`のような条件分岐によってTypeScriptが型を自動的に絞り込んでくれる仕組み(narrowing)を学びました。この章では、その絞り込みを自分で定義した関数の中に閉じ込める方法と、絞り込みの分岐が「すべてのケースを網羅しているか」をコンパイラにチェックさせる方法を扱います。

## 絞り込みのロジックを関数に切り出したい

次のようなユニオン型があるとします。

```typescript
type Circle = { kind: "circle"; radius: number };
type Rectangle = { kind: "rectangle"; width: number; height: number };
type Shape = Circle | Rectangle;
```

`kind`プロパティを見て絞り込むコード自体は06章の内容の延長で書けます。

```typescript
function area(shape: Shape): number {
  if (shape.kind === "circle") {
    return Math.PI * shape.radius ** 2; // ここではshapeはCircleとして扱われる
  }
  return shape.width * shape.height; // ここではshapeはRectangleとして扱われる
}
```

この判定(`shape.kind === "circle"`かどうか)を複数の場所で使い回したくなったとき、単に真偽値を返す関数に切り出しただけでは、絞り込みの効果が失われます。

```typescript
function isCircle(shape: Shape): boolean {
  return shape.kind === "circle";
}

function area(shape: Shape): number {
  if (isCircle(shape)) {
    return Math.PI * shape.radius ** 2; // エラー: Property 'radius' does not exist on type 'Shape'.
  }
  return shape.width * shape.height;
}
```

`isCircle`の戻り値はただの`boolean`なので、TypeScriptは「`isCircle(shape)`が`true`のとき`shape`が`Circle`である」ことまでは推測してくれません。

## is述語で絞り込みの効果を関数に持たせる

戻り値の型を`boolean`ではなく`shape is Circle`のように書くと、その関数が「この条件が`true`なら、引数は指定した型に絞り込める」という約束をTypeScriptに伝えられます。これをユーザー定義型ガード(type predicate)と呼びます。

```typescript
function isCircle(shape: Shape): shape is Circle {
  return shape.kind === "circle";
}

function area(shape: Shape): number {
  if (isCircle(shape)) {
    return Math.PI * shape.radius ** 2; // OK: shapeはCircleに絞り込まれている
  }
  return shape.width * shape.height; // OK: elseのほうはRectangleに絞り込まれている
}
```

関数の中身(`return shape.kind === "circle";`)は変わっていませんが、戻り値の型注釈を`shape is Circle`に変えただけで、呼び出し側での絞り込みが復活しています。11章で`error instanceof Error`という絞り込みを使いましたが、`instanceof`は言語に組み込まれた型ガードで、`is`述語はそれと同じ効果を自分の関数に持たせるための書き方だと捉えてください。

## never型と網羅性チェック

07章の確認問題で、`switch`文の分岐が本当にすべてのケースを網羅しているかは、TypeScript自身は保証してくれないという例を見ました。実は「網羅できているか」もコンパイル時にチェックさせる方法があります。鍵になるのが`never`型です。

`never`は「絶対に発生しない値」を表す型です。「すべてのユニオン型の候補を`if`や`switch`で処理しきったあとに残る型」は`never`になります。

```typescript
function describeShape(shape: Shape): string {
  if (shape.kind === "circle") {
    return "円";
  }
  if (shape.kind === "rectangle") {
    return "長方形";
  }
  // ここに到達する時点で、shapeの型は理論上neverになっているはず
  const exhaustiveCheck: never = shape;
  throw new Error(`未対応の形状です: ${JSON.stringify(exhaustiveCheck)}`);
}
```

`Circle`と`Rectangle`の2択を両方`if`で処理しきったあとの`shape`は、TypeScriptの視点では「もう何も残っていない」ため`never`型に絞り込まれます。`const exhaustiveCheck: never = shape;`は、その`never`型の変数に`shape`を代入しているだけです。ここで威力を発揮するのは、`Shape`に3つ目の種類(例えば`Triangle`)を追加したときです。

```typescript
type Triangle = { kind: "triangle"; base: number; height: number };
type Shape = Circle | Rectangle | Triangle; // Triangleを追加

function describeShape(shape: Shape): string {
  if (shape.kind === "circle") {
    return "円";
  }
  if (shape.kind === "rectangle") {
    return "長方形";
  }
  const exhaustiveCheck: never = shape;
  // エラー: Type 'Triangle' is not assignable to type 'never'.
  throw new Error(`未対応の形状です: ${JSON.stringify(exhaustiveCheck)}`);
}
```

`Triangle`のケースを`if`で処理し忘れているため、その時点の`shape`は`Triangle`型のまま残ってしまい、`never`型の変数への代入が失敗します。「新しい種類を追加したのに、対応する分岐を書き忘れる」というありがちなミスを、実行時ではなくコンパイル時に検出できるのがこのパターンの価値です。

## command-registryでの実例

`parseArgs`関数の中の`switch`文は、この網羅性チェックのパターンをそのまま使っています。

```typescript
// src/parse-args.ts
function parseValue(raw: string, type: ArgType, key: string): string | number | boolean {
  switch (type) {
    case "string":
      return raw;
    case "number": {
      // ...
    }
    case "boolean": {
      // ...
    }
    default: {
      // ArgTypeに新しい種類を追加したのに、ここの分岐を追加し忘れると
      // exhaustiveCheckの型がneverでなくなり、コンパイルエラーで気づける
      const exhaustiveCheck: never = type;
      throw new ArgParseError(`未知の引数型です: ${exhaustiveCheck}`);
    }
  }
}
```

`ArgType`は`"string" | "number" | "boolean"`という3つのケースを持つユニオン型でした([13章](13-generics.md))。もし将来`ArgType`に`"date"`を追加したのに`case "date":`の分岐を書き忘れると、`default`節に到達したときの`type`の型が`never`ではなく`"date"`のまま残るため、`const exhaustiveCheck: never = type;`がコンパイルエラーになります。型を追加した瞬間に「対応する分岐が足りない」とエディタが教えてくれる、という仕組みです。

## 確認問題

次のコードは、`Status`型に`"cancelled"`が追加されたのに、`describe`関数の分岐が追いついていません。網羅性チェックを追加して、コンパイルエラーとして検出されるようにしてください。

```typescript
type Status = "pending" | "approved" | "rejected" | "cancelled";

function describe(status: Status): string {
  if (status === "pending") return "審査中";
  if (status === "approved") return "承認済み";
  if (status === "rejected") return "却下";
  return "不明な状態"; // "cancelled"のケースが漏れている
}
```

<details>
<summary>答えを見る</summary>

最後の`return`の手前で、絞り込まれた`status`を`never`型の変数に代入します。

```typescript
function describe(status: Status): string {
  if (status === "pending") return "審査中";
  if (status === "approved") return "承認済み";
  if (status === "rejected") return "却下";
  const exhaustiveCheck: never = status; // エラー: Type '"cancelled"' is not assignable to type 'never'.
  return exhaustiveCheck;
}
```

`"cancelled"`のケースがどの`if`にも一致しないまま最後まで残るため、`never`型への代入に失敗し、分岐漏れがコンパイル時に発覚します。

</details>

## 次の章

ここまでは型の話が中心でしたが、次は横断的な処理をクラスに後付けする仕組み、デコレータを扱います。→ [18章 デコレータ](18-decorators.md)
