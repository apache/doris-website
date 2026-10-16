---
{
    "title": "MAP 型へのキャスト",
    "language": "ja",
    "description": "MAP 型はキーと値のペアを格納・処理するための型です。キーと値にはさまざまな基本型を使用でき、ほかの複合型をネストすることもできます。",
}
---

MAP 型はキーと値のペアを格納・処理するための型です。キーと値にはさまざまな基本型を使用でき、ほかの複合型をネストすることもできます。

## MAP 型へのキャスト

### 文字列から

:::caution 動作の変更
バージョン 4.0 より前は、MAP の形式に合わない文字列でも正常に変換される場合がありました（例: '{1:1,2}'）。
バージョン 4.0 以降、MAP の形式に合わない文字列は、厳密モードではエラーになり、非厳密モードでは NULL を返します。
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

1. MAP のテキスト表現は左波括弧 `{` で始まり、右波括弧 `}` で終わる必要があります。
2. 空の MAP は `{}` と表します。
3. MAP 内のキーと値のペアはコンマ `,` で区切ります。
4. 各ペアはキー、コロン `:`、値の順に並び、形式は「key:value」です。
5. キーと値は、対応する一重引用符（`'`）または二重引用符（`"`）で囲むことができます。引用符内の内容は単一の要素として扱われます。
6. MAP 内の各要素の前後には空白を入れることができます。
7. 解析時には、`<key-token>` に一致する部分に型 K の解析規則を、`<value-token>` に一致する部分に型 V の解析規則を適用します。適用した BNF 規則と解析ロジックも、現在の MAP<K, V> の BNF と解析ロジックの一部と見なされ、エラー処理と結果は現在の MAP<K, V> の動作と結果に反映されます。
8. 要素の値が null であることを表すには "null" を使用できます。

MAP の形式に合わない場合、またはペアのキーや値が対応する型の形式に合わない場合は、エラーになります。

##### 例

| 入力文字列 | 変換結果 | 説明 |
| --- | --- | --- |
| "{}" | {} | 有効な空の MAP |
| "  {}" | Error | 左波括弧で始まらないため、解析に失敗します |
| '{123:456}' | MAP\<int,int\> にキャスト: {123:456} | 有効な MAP |
| '{123:null}' | MAP\<int,int\> にキャスト: {123:null} | null 値を含む有効な MAP |
| '{   123   :   456    }' | MAP\<int,int\> にキャスト: {123:456} | 空白を含む有効な MAP |
| '{"123":"456"}' | MAP\<int,int\> にキャスト: {123:456} | 引用符を使用した有効な MAP |
| '{   "123":"abc"  }' | Error | "abc" は int 型に変換できません |
| '{ 1:2 ,34, 5:6}' | Error | MAP の形式に合いません |

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

1. MAP のテキスト表現は左波括弧 `{` で始まり、右波括弧 `}` で終わる必要があります。
2. 空の MAP は `{}` と表します。
3. MAP 内のキーと値のペアはコンマ `,` で区切ります。
4. 各ペアはキー、コロン `:`、値の順に並び、形式は「key:value」です。
5. キーと値は、対応する一重引用符（`'`）または二重引用符（`"`）で囲むことができます。引用符内の内容は単一の要素として扱われます。
6. MAP 内の各要素の前後には空白を入れることができます。
7. 解析時には、`<key-token>` に一致する部分に型 K の解析規則を、`<value-token>` に一致する部分に型 V の解析規則を適用します。適用した BNF 規則と解析ロジックも、現在の MAP<K, V> の BNF と解析ロジックの一部と見なされ、エラー処理と結果は現在の MAP<K, V> の動作と結果に反映されます。
8. 要素の値が null であることを表すには "null" を使用できます。

MAP の形式が上記の BNF に合わない場合は、NULL を返します。
ペアのキーや値が対応する型の形式に合わない場合は、該当する位置が null になります。

##### 例

| 入力文字列 | 変換結果 | 説明 |
| --- | --- | --- |
| "{}" | {} | 有効な空の MAP |
| "  {}" | NULL | 左波括弧で始まらないため、解析に失敗します |
| '{123:456}' | MAP\<int,int\> にキャスト: {123:456} | 有効な MAP |
| '{123:null}' | MAP\<int,int\> にキャスト: {123:null} | null 値を含む有効な MAP |
| '{   123   :   456    }' | MAP\<int,int\> にキャスト: {123:456} | 空白を含む有効な MAP |
| '{"123":"456"}' | MAP\<int,int\> にキャスト: {123:456} | 引用符を使用した有効な MAP |
| '{   "123":"abc"  }' | MAP\<int,int\> にキャスト: {123:null} | "abc" は int 型に変換できないため、null になります |
| '{ 1:2 ,34, 5:6}' | NULL | MAP の形式に合いません |

#### ネストした MAP の重複キー

文字列を `MAP`、`ARRAY`、または `STRUCT` にキャストすると、Doris は変換結果に含まれるすべての `MAP` から重複キーを取り除きます。`ARRAY`、`STRUCT`、または MAP の値にネストされた MAP も対象です。同じキーが複数回現れた場合は、最後の値を残します。

```sql
SELECT CAST('{"outer":[{"a":1,"a":2}]}' AS MAP<STRING, ARRAY<MAP<STRING, INT>>>);
SELECT CAST('[{"a":1,"a":2}]' AS ARRAY<MAP<STRING, INT>>);
SELECT CAST('{"m":{"a":1,"a":2}}' AS STRUCT<m:MAP<STRING, INT>>);
```

```text
{"outer":[{"a":2}]}
[{"a":2}]
{"m":{"a":2}}
```

### MAP\<Other Type\> から

#### 厳密モード

##### 規則の説明

MAP の各要素を別の型から対象の型にキャストします。このキャストにも厳密モードが適用されます。

##### 例

| 入力 MAP | 変換結果 | 説明 |
| --- | --- | --- |
| {"123":"456"} | MAP\<int,int\> にキャスト: {123:456} | "123" と "456" は Int に変換できます |
| {"abc":"123"} | Error | "abc" は Int に変換できません |
| {"123":null} | MAP\<int,int\> にキャスト: {123:null} | null のキャスト結果も null です |

#### 非厳密モード

##### 規則の説明

MAP の各要素を別の型から対象の型にキャストします。このキャストにも非厳密モードが適用されます。

##### 例

| 入力 MAP | 変換結果 | 説明 |
| --- | --- | --- |
| {"123":"456"} | MAP\<int,int\> にキャスト: {123:456} | "123" と "456" は Int に変換できます |
| {"abc":"123"} | MAP\<int,int\> にキャスト: {null:123} | "abc" は Int に変換できないため、null になります |
| {"123":null} | MAP\<int,int\> にキャスト: {123:null} | null のキャスト結果も null です |
