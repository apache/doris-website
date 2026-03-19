---
{
  "title": "ARRAY型へのキャスト",
  "language": "ja",
  "description": "ARRAY型は配列データを格納・処理するために使用され、整数や文字列などの様々な基本要素型を含むことができます。"
}
---
ARRAY型は配列データの格納と処理に使用され、整数や文字列などの様々な基本要素型を含むことができ、他の複合型をネストすることも可能です。

## ARRAYへのキャスト

### FROM String

:::caution 動作の変更
バージョン4.0以前では、区切り文字間の空文字列の解析が失敗し、例えば"[,,]"はNULLを返していました。
バージョン4.0以降では、"[,,]"は非strictモードで[null, null, null]を返し、strictモードではエラーを報告します。
:::

#### Strictモード

##### BNF定義

```xml
<array>          ::= "[" <array-content>? "]" | <empty-array> 

<empty-array> ::= "[]"

<array-content>  ::=  <data-token>(<collection-delim> <data-token>)*

<data-token>    ::= <whitespace>* "\"" <inner-sequence> "\"" <whitespace>*
                   | <whitespace>* "'" <inner-sequence> "'" <whitespace>*
                   | <whitespace>* <inner-sequence> <whitespace>*

<inner-sequence>    ::= .*

<collection-delim>  ::= "," 
```
##### ルール説明

1. 配列のテキスト表現は左括弧`[`で始まり、右括弧`]`で終わる必要があります。
2. 空の配列は`[]`として直接表現されます。
3. 配列内の要素はカンマで区切られます。
4. 配列内の要素の前後に空白文字を含めることができます。
5. 配列要素は、対応する単一引用符（`'`）または二重引用符（`"`）で囲むことができます。
6. 要素は"null"を使用してnull値を表現できます。
7. 解析中、`<data-token>`にマッチする部分は、対象型Tの解析ルールを引き続き適用します。

上記のルールが満たされない場合、または要素が対応する型の要件を満たさない場合、エラーが報告されます。

##### 例

| 入力文字列 | 変換結果 | コメント |
| --- | --- | --- |
| '[]' | [] | 有効な空配列 |
| '  []' | Error | 配列が括弧で始まっておらず、解析失敗 |
| '[ ]' | Error | 配列に1つの要素があり、空白文字列；空白文字列はintとして解析に失敗 |
| "[     123,       123]" | Array\<int\>にキャスト: [123, 123] | 有効な配列 |
| '[  "  123  "   ,    "456   "]' | Array\<int\>にキャスト: [123, 456] | 有効な配列 |
| '[    123     ,    "456"   ]' | Array\<int\>にキャスト: [123, 456] | 有効な配列 |
| '[ [] ]' | Array\<Array\<int\>\>にキャスト: [[]] | 最初の配列の内部要素は' [] 'で、トリミング後に有効な配列となる |
| '[ null ,123]' | Array\<int\>にキャスト: [null, 123] | nullを含む有効な配列 |
| '[ "null" ,123]' | Error | 文字列"null"はint型に変換できない |

注意: カンマ間の要素が有効なコンテンツを含むことを確認してください。そうでなければ解析に失敗します。

#### 非厳密モード

##### BNF定義

```xml
<array>          ::= "[" <array-content>? "]" | <empty-array> 

<empty-array> ::= "[]"

<array-content>  ::=  <data-token>(<collection-delim> <data-token>)*

<data-token>    ::= <whitespace>* "\"" <inner-sequence> "\"" <whitespace>*
                   | <whitespace>* "'" <inner-sequence> "'" <whitespace>*
                   | <whitespace>* <inner-sequence> <whitespace>*

<inner-sequence>    ::= .*

<collection-delim>  ::= "," 
```
##### ルール説明

1. 配列のテキスト表現は左括弧 `[` で始まり、右括弧 `]` で終わる必要があります。
2. 空の配列は直接 `[]` として表現されます。
3. 配列内の要素はカンマで区切られます。
4. 配列内の要素の前後に空白を含めることができます。
5. 配列要素は対応する単一引用符（`'`）または二重引用符（`"`）で囲むことができます。
6. 要素は "null" を使用してnull値を表すことができます。
7. 解析中、`<data-token>` に一致する部分は、対象タイプTの解析ルールを継続して適用します。

配列形式が上記のBNF形式を満たさない場合、NULLが返されます。
要素が対応するタイプの要件を満たさない場合、該当する要素位置はnullに設定されます。

##### 例

| 入力文字列 | 変換結果 | コメント |
| --- | --- | --- |
| '[]' | [] | 有効な空配列 |
| '  []' | NULL | 配列が括弧で始まらない、解析失敗 |
| '[ ]' | [null] | 配列に1つの要素がある、空白の文字列；空白文字列はintとして解析に失敗 |
| "[     123,       123]" | Array\<int\>へのCast: [123, 123] | 有効な配列 |
| '[  "  123  "   ,    "456   "]' | Array\<int\>へのCast: [123, 456] | 有効な配列 |
| '[    123     ,    "456"   ]' | Array\<int\>へのCast: [123, 456] | 有効な配列 |
| '[ [] ]' | Array\<Array\<int\>\>へのCast: [[]] | 最初の配列の内部要素は ' [] '、トリミング後に有効な配列になる |
| '[ null ,123]' | Array\<int\>へのCast: [null, 123] | nullを含む有効な配列 |
| '[ "null" ,123]' | Array\<int\>へのCast: [null, 123] | 文字列 "null" はintタイプに変換できない、nullに変換 |

### FROM Array\<Other Type\>

#### Strict Mode

##### ルール説明

Array内の各要素に対して、Other Type To TypeからのCastが実行されます。Castも strict mode で行われます。

##### 例

| 入力Array | 変換結果 | コメント |
| --- | --- | --- |
| ["123", "456"] | Array\<int\>へのCast: [123, 456] | "123" と "456" はIntに変換可能 |
| ["abc", "123"] | Error | "abc" はIntに変換できない |
| [null, "123"] | Array\<int\>へのCast: [null, 123] | nullのCast結果は依然としてnull |

#### Non-Strict Mode

##### ルール説明

Array内の各要素に対して、Other Type To TypeからのCastが実行されます。Castも non-strict mode で行われます。

##### 例

| 入力Array | 変換結果 | コメント |
| --- | --- | --- |
| ["123", "456"] | Array\<int\>へのCast: [123, 456] | "123" と "456" はIntに変換可能 |
| ["abc", "123"] | Array\<int\>へのCast: [null, 123] | "abc" はIntに変換できない、nullに変換 |
| [null, "123"] | Array\<int\>へのCast: [null, 123] | nullのCast結果は依然としてnull |
