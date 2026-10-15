---
{
    "title": "MAP 型への変換",
    "language": "ja",
    "description": "MAP 型はキーと値のペアを格納・処理するために使用します。キーと値にはさまざまな基本型を使用できます。",
}
---

MAP 型はキーと値のペアを格納・処理するために使用します。キーと値にはさまざまな基本型を使用でき、ほかの複合型をネストすることもできます。

## MAP 型への変換

### 文字列から

:::caution 動作の変更
バージョン 4.0 より前は、MAP 形式に適合しない文字列（例: '{1:1,2}'）でも正常に変換される場合がありました。
バージョン 4.0 以降は、MAP 形式に適合しない文字列を変換すると、厳密モードではエラーが報告され、非厳密モードでは NULL が返されます。
:::

#### 厳密モード

##### BNF 定義

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

##### 規則の説明

1. MAP のテキスト表現は、左波括弧 `{` で始まり、右波括弧 `}` で終わる必要があります。
2. 空の MAP は `{}` と表します。
3. MAP 内のキーと値のペアはカンマ `,` で区切ります。
4. 各ペアはキー、コロン `:`、値の順に "key:value" で構成します。
5. キーと値は、対応する一重引用符（`'`）または二重引用符（`"`）で囲むこともできます。引用符内の内容は一つの要素として扱われます。
6. MAP 内では、各要素の前後に空白を入れることができます。
7. 解析時、`<key-token>` に一致する部分には型 K の解析規則が、`<value-token>` に一致する部分には型 V の解析規則が引き続き適用されます。適用される BNF 規則と解析処理も、現在の MAP<K, V> の BNF 規則と解析処理の一部と見なされます。そこでのエラー処理と結果は、現在の MAP<K, V> の動作と結果に反映されます。
8. 要素には、NULL 値を表す "null" を使用できます。

MAP 形式に適合しない場合、またはキーと値のペアに含まれるキーや値が対応する型の形式に適合しない場合は、エラーが報告されます。

##### 例

| 入力文字列 | 変換結果 | 説明 |
| --- | --- | --- |
| "{}" | {} | 有効な空の MAP |
| "  {}" | Error | 波括弧で始まらないため、解析に失敗します |
| '{123:456}' | Cast to MAP\<int,int\>: {123:456} | 有効な MAP |
| '{123:null}' | Cast to MAP\<int,int\>: {123:null} | NULL 値を含む有効な MAP |
| '{   123   :   456    }' | Cast to MAP\<int,int\>: {123:456} | 空白を含む有効な MAP |
| '{"123":"456"}' | Cast to MAP\<int,int\>: {123:456} | 引用符を使用した有効な MAP |
| '{   "123":"abc"  }' | Error | "abc" は int 型に変換できません |
| '{ 1:2 ,34, 5:6}' | Error | MAP 形式に適合しません |

#### 非厳密モード

##### BNF 定義

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

##### 規則の説明

1. MAP のテキスト表現は、左波括弧 `{` で始まり、右波括弧 `}` で終わる必要があります。
2. 空の MAP は `{}` と表します。
3. MAP 内のキーと値のペアはカンマ `,` で区切ります。
4. 各ペアはキー、コロン `:`、値の順に "key:value" で構成します。
5. キーと値は、対応する一重引用符（`'`）または二重引用符（`"`）で囲むこともできます。引用符内の内容は一つの要素として扱われます。
6. MAP 内では、各要素の前後に空白を入れることができます。
7. 解析時、`<key-token>` に一致する部分には型 K の解析規則が、`<value-token>` に一致する部分には型 V の解析規則が引き続き適用されます。適用される BNF 規則と解析処理も、現在の MAP<K, V> の BNF 規則と解析処理の一部と見なされます。そこでのエラー処理と結果は、現在の MAP<K, V> の動作と結果に反映されます。
8. 要素には、NULL 値を表す "null" を使用できます。

MAP 形式が上記の BNF 形式に適合しない場合は、NULL が返されます。
キーと値のペアに含まれるキーまたは値が対応する型の形式に適合しない場合は、該当する位置が null に設定されます。

##### 例

| 入力文字列 | 変換結果 | 説明 |
| --- | --- | --- |
| "{}" | {} | 有効な空の MAP |
| "  {}" | NULL | 波括弧で始まらないため、解析に失敗します |
| '{123:456}' | Cast to MAP\<int,int\>: {123:456} | 有効な MAP |
| '{123:null}' | Cast to MAP\<int,int\>: {123:null} | NULL 値を含む有効な MAP |
| '{   123   :   456    }' | Cast to MAP\<int,int\>: {123:456} | 空白を含む有効な MAP |
| '{"123":"456"}' | Cast to MAP\<int,int\>: {123:456} | 引用符を使用した有効な MAP |
| '{   "123":"abc"  }' | Cast to MAP\<int,int\>: {123:null} | "abc" は int 型に変換できないため、null に変換されます |
| '{ 1:2 ,34, 5:6}' | NULL | MAP 形式に適合しません |

### MAP\<Other Type\> から

#### 厳密モード

##### 規則の説明

MAP 内の各要素に対して、Other Type から Type への Cast を実行します。この Cast も厳密モードで実行されます。

##### 例

| 入力 MAP | 変換結果 | 説明 |
| --- | --- | --- |
| {"123":"456"} | Cast to MAP\<int,int\>: {123:456} | "123" と "456" は Int に変換できます |
| {"abc":"123"} | Error | "abc" は Int に変換できません |
| {"123":null} | Cast to MAP\<int,int\>: {123:null} | null を Cast した結果は null のままです |

#### 非厳密モード

##### 規則の説明

MAP 内の各要素に対して、Other Type から Type への Cast を実行します。この Cast も非厳密モードで実行されます。

##### 例

| 入力 MAP | 変換結果 | 説明 |
| --- | --- | --- |
| {"123":"456"} | Cast to MAP\<int,int\>: {123:456} | "123" と "456" は Int に変換できます |
| {"abc":"123"} | Cast to MAP\<int,int\>: {null:123} | "abc" は Int に変換できないため、null に変換されます |
| {"123":null} | Cast to MAP\<int,int\>: {123:null} | null を Cast した結果は null のままです |
