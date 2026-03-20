---
{
  "title": "MAP型へのキャスト",
  "language": "ja",
  "description": "MAP型は、キー値ペアデータの格納と処理に使用され、様々な基本型のキーと値を含むことができる。"
}
---
MAP型は、キー値ペアデータの格納と処理に使用され、様々な基本型のキーと値を含むことができ、他の複合型をネストすることも可能です。

## MAPへのキャスト

### String型から

:::caution 動作変更
バージョン4.0以前では、MAP形式に適合しない一部の文字列が正常に変換される可能性がありました（例：'{1:1,2}'）。
バージョン4.0以降、MAP形式に適合しない文字列は、strictモードではエラーを報告し、非strictモードではNULLを返します。
:::

#### Strictモード

##### BNF定義

```xml
<map>          ::= "{" <map-content>? "}" | <empty-map> 

<empty-map>    ::= "{}"

<map-content>  ::=  <key-token> <map_key_delimiter> <value-token>
                     (<collection-delim> <key-token> <map_key_delimiter> <value-token>)*

<key-token>    ::= <whitespace>* "\"" <inner-sequence> "\"" <whitespace>*
                   | <whitespace>* "'" <inner-sequence> "'" <whitespace>*
                   | <whitespace>* <inner-sequence> <whitespace>*
<value-token>  ::= <key-token>

<inner-sequence>    ::= .*
<collection-delim>  ::= "," 
<map_key_delimiter> ::= ":"
```
##### ルール説明

1. MAPのテキスト表現は左中括弧`{`で始まり、右中括弧`}`で終わる必要があります。
2. 空のMAPは直接`{}`として表現されます。
3. MAP内のキー・値のペアはカンマ`,`で区切られます。
4. 各キー・値のペアは、キー、コロン`:`、値の順序で「キー:値」として構成されます。
5. キーと値は、一致する単一引用符（`'`）または二重引用符（`"`）でオプションで囲むことができます。引用符内の内容は単一のエンティティとして扱われます。
6. MAP内の要素の前後に空白を含めることができます。
7. パース時に、`<key-token>`に一致する部分は型Kのパースルールを引き続き適用し、`<value-token>`に一致する部分は型Vのパースルールを引き続き適用します。これらの適用されたBNFルールとパース論理は、現在のMAP<K, V>のBNFとパース論理の一部とみなされ、対応するエラー処理と結果転送は現在のMAP<K, V>の動作と結果に引き継がれます。
8. 要素は「null」を使用してnull値を表現できます。

MAP形式が満たされない場合、またはキー・値のペア内のキー/値が対応する型の形式を満たさない場合、エラーが報告されます。

##### 例

| Input String | Conversion Result | Comment |
| --- | --- | --- |
| "{}" | {} | 有効な空のMAP |
| "  {}" | Error | 中括弧で始まっていない、パース失敗 |
| '{123:456}' | Cast to MAP\<int,int\>: {123:456} | 有効なMAP |
| '{123:null}' | Cast to MAP\<int,int\>: {123:null} | null値を含む有効なMAP |
| '{   123   :   456    }' | Cast to MAP\<int,int\>: {123:456} | 空白を含む有効なMAP |
| '{"123":"456"}' | Cast to MAP\<int,int\>: {123:456} | 引用符を使用した有効なMAP |
| '{   "123":"abc"  }' | Error | "abc"はint型に変換できない |
| '{ 1:2 ,34, 5:6}' | Error | MAP形式を満たしていない |

#### Non-Strict Mode

##### BNF Definition

```xml
<map>          ::= "{" <map-content>? "}" | <empty-map> 

<empty-map>    ::= "{}"

<map-content>  ::=  <key-token> <map_key_delimiter> <value-token>
                     (<collection-delim> <key-token> <map_key_delimiter> <value-token>)*

<key-token>    ::= <whitespace>* "\"" <inner-sequence> "\"" <whitespace>*
                   | <whitespace>* "'" <inner-sequence> "'" <whitespace>*
                   | <whitespace>* <inner-sequence> <whitespace>*
<value-token>  ::= <key-token>

<inner-sequence>    ::= .*
<collection-delim>  ::= "," 
<map_key_delimiter> ::= ":"
```
##### ルール説明

1. MAPのテキスト表現は左波括弧`{`で始まり、右波括弧`}`で終わる必要があります。
2. 空のMAPは直接`{}`として表現されます。
3. MAP内のキー・バリューペアはカンマ`,`で区切られます。
4. 各キー・バリューペアは、キー、コロン`:`、バリューで構成され、"key:value"の順序になります。
5. キーとバリューは、オプションで対応するシングルクォート（`'`）またはダブルクォート（`"`）で囲むことができます。クォート内のコンテンツは単一のエンティティとして扱われます。
6. MAP内の要素の前後に空白文字を使用することができます。
7. パース中、`<key-token>`に一致する部分は引き続きタイプKのパースルールを適用し、`<value-token>`に一致する部分は引き続きタイプVのパースルールを適用します。これらの適用されるBNFルールとパースロジックは、現在のMAP<K, V>のBNFとパースロジックの一部とみなされ、対応するエラーハンドリングと結果転送が現在のMAP<K, V>の動作と結果に適用されます。
8. 要素は"null"を使用してnull値を表現することができます。

MAPフォーマットが上記のBNFフォーマットを満たさない場合、NULLが返されます。
キー・バリューペア内のkey/valueが対応するタイプのフォーマットを満たさない場合、対応する位置はnullに設定されます。

##### 例

| 入力文字列 | 変換結果 | コメント |
| --- | --- | --- |
| "{}" | {} | 有効な空のMAP |
| "  {}" | NULL | 波括弧で始まっていない、パース失敗 |
| '{123:456}' | MAP\<int,int\>にキャスト: {123:456} | 有効なMAP |
| '{123:null}' | MAP\<int,int\>にキャスト: {123:null} | null値を含む有効なMAP |
| '{   123   :   456    }' | MAP\<int,int\>にキャスト: {123:456} | 空白文字を含む有効なMAP |
| '{"123":"456"}' | MAP\<int,int\>にキャスト: {123:456} | クォートを使用した有効なMAP |
| '{   "123":"abc"  }' | MAP\<int,int\>にキャスト: {123:null} | "abc"はintタイプに変換できない、nullに変換 |
| '{ 1:2 ,34, 5:6}' | NULL | MAPフォーマットを満たさない |

### MAP\<Other Type\>からの変換

#### Strictモード

##### ルール説明

MAP内の各要素に対して、Other TypeからTypeへのキャストが実行されます。キャストもstrictモードで実行されます。

##### 例

| 入力MAP | 変換結果 | コメント |
| --- | --- | --- |
| {"123":"456"} | MAP\<int,int\>にキャスト: {123:456} | "123"と"456"はIntに変換可能 |
| {"abc":"123"} | エラー | "abc"はIntに変換できない |
| {"123":null} | MAP\<int,int\>にキャスト: {123:null} | nullのキャスト結果は依然としてnull |

#### Non-Strictモード

##### ルール説明

MAP内の各要素に対して、Other TypeからTypeへのキャストが実行されます。キャストもnon-strictモードで実行されます。

##### 例

| 入力MAP | 変換結果 | コメント |
| --- | --- | --- |
| {"123":"456"} | MAP\<int,int\>にキャスト: {123:456} | "123"と"456"はIntに変換可能 |
| {"abc":"123"} | MAP\<int,int\>にキャスト: {null:123} | "abc"はIntに変換できない、nullに変換 |
| {"123":null} | MAP\<int,int\>にキャスト: {123:null} | nullのキャスト結果は依然としてnull |
