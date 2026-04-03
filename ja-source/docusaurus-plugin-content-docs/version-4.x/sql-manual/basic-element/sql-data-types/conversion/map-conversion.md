---
{
  "title": "MAP型へのキャスト",
  "description": "MAP型は、キー・バリューペアデータの格納と処理に使用され、様々な基本型のキーと値を含むことができます。",
  "language": "ja"
}
---
MAP型は、キー値ペアデータの保存と処理に使用され、様々な基本型のキーと値を含むことができ、他の複合型をネストすることも可能です。

## MAPへのキャスト

### FROM String

:::caution 動作変更
バージョン4.0以前では、MAP形式に適合しない一部の文字列が正常に変換される場合がありました（例：'{1:1,2}'）。
バージョン4.0以降では、MAP形式に適合しない文字列は、strict modeでエラーを報告し、non-strict modeではNULLを返します。
:::

#### Strict Mode

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
##### ルールの説明

1. MAPのテキスト表現は左波括弧`{`で始まり、右波括弧`}`で終わる必要があります。
2. 空のMAPは直接`{}`として表現されます。
3. MAP内のキー値ペアはコンマ`,`で区切られます。
4. 各キー値ペアは、キー、コロン`:`、値から構成され、「key:value」の順序で記述されます。
5. キーと値は、オプションで一致する単一引用符（`'`）または二重引用符（`"`）で囲むことができます。引用符内のコンテンツは単一のエンティティとして扱われます。
6. MAP内の要素の前後に空白文字を使用できます。
7. 解析中、`<key-token>`に一致する部分は型Kの解析ルールを引き続き適用し、`<value-token>`に一致する部分は型Vの解析ルールを引き続き適用します。これらの適用されるBNFルールと解析ロジックは、依然として現在のMAP<K, V>のBNFと解析ロジックの一部とみなされ、対応するエラーハンドリングと結果転送は現在のMAP<K, V>の動作と結果に行われます。
8. 要素はnull値を表現するために「null」を使用できます。

MAP形式が満たされていない場合、またはキー値ペアのキー/値が対応する型の形式を満たしていない場合、エラーが報告されます。

##### 例

| Input String | Conversion Result | Comment |
| --- | --- | --- |
| "{}" | {} | 有効な空のMAP |
| "  {}" | Error | 波括弧で始まっていない、解析失敗 |
| '{123:456}' | Cast to MAP\<int,int\>: {123:456} | 有効なMAP |
| '{123:null}' | Cast to MAP\<int,int\>: {123:null} | null値を含む有効なMAP |
| '{   123   :   456    }' | Cast to MAP\<int,int\>: {123:456} | 空白文字を含む有効なMAP |
| '{"123":"456"}' | Cast to MAP\<int,int\>: {123:456} | 引用符を使用した有効なMAP |
| '{   "123":"abc"  }' | Error | 「abc」はint型に変換できません |
| '{ 1:2 ,34, 5:6}' | Error | MAP形式を満たしていません |

#### Non-Strictモード

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

1. MAPのテキスト表現は左波括弧`{`で始まり、右波括弧`}`で終わる必要があります。
2. 空のMAPは`{}`として直接表現されます。
3. MAP内のキー値ペアはカンマ`,`で区切られます。
4. 各キー値ペアはキー、コロン`:`、値の順で「key:value」の形式で構成されます。
5. キーと値は任意で一致する単一引用符（`'`）または二重引用符（`"`）で囲むことができます。引用符内のコンテンツは単一のエンティティとして扱われます。
6. MAP内の要素の前後に空白を含めることができます。
7. 解析中、`<key-token>`に一致する部分は型Kの解析ルールを引き続き適用し、`<value-token>`に一致する部分は型Vの解析ルールを引き続き適用します。これらの適用されるBNFルールと解析ロジックは、依然として現在のMAP<K, V>のBNFと解析ロジックの一部と見なされ、対応するエラーハンドリングと結果転送は現在のMAP<K, V>の動作と結果に行われます。
8. 要素は「null」を使用してnull値を表現できます。

MAPフォーマットが上記のBNFフォーマットを満たさない場合、NULLが返されます。
キー値ペア内のkey/valueが対応する型のフォーマットを満たさない場合、対応する位置はnullに設定されます。

##### 例

| Input String | Conversion Result | Comment |
| --- | --- | --- |
| "{}" | {} | 有効な空のMAP |
| "  {}" | NULL | 波括弧で始まっていないため、解析失敗 |
| '{123:456}' | Cast to MAP\<int,int\>: {123:456} | 有効なMAP |
| '{123:null}' | Cast to MAP\<int,int\>: {123:null} | null値を含む有効なMAP |
| '{   123   :   456    }' | Cast to MAP\<int,int\>: {123:456} | 空白を含む有効なMAP |
| '{"123":"456"}' | Cast to MAP\<int,int\>: {123:456} | 引用符を使用した有効なMAP |
| '{   "123":"abc"  }' | Cast to MAP\<int,int\>: {123:null} | 「abc」はint型に変換できないため、nullに変換 |
| '{ 1:2 ,34, 5:6}' | NULL | MAPフォーマットを満たしていない |

### FROM MAP\<Other タイプ\>

#### Strict Mode

##### ルール説明

MAP内の各要素に対して、Other タイプ To TypeのCastが実行されます。Castも厳密モードで実行されます。

##### 例

| Input MAP | Conversion Result | Comment |
| --- | --- | --- |
| {"123":"456"} | Cast to MAP\<int,int\>: {123:456} | 「123」と「456」はIntに変換可能 |
| {"abc":"123"} | Error | 「abc」はIntに変換できない |
| {"123":null} | Cast to MAP\<int,int\>: {123:null} | nullのCast結果は依然としてnull |

#### Non-Strict Mode

##### ルール説明

MAP内の各要素に対して、Other タイプ To TypeのCastが実行されます。Castも非厳密モードで実行されます。

##### 例

| Input MAP | Conversion Result | Comment |
| --- | --- | --- |
| {"123":"456"} | Cast to MAP\<int,int\>: {123:456} | 「123」と「456」はIntに変換可能 |
| {"abc":"123"} | Cast to MAP\<int,int\>: {null:123} | 「abc」はIntに変換できないため、nullに変換 |
| {"123":null} | Cast to MAP\<int,int\>: {123:null} | nullのCast結果は依然としてnull |
