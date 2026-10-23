---
{
    "title": "MAP 型へのキャスト",
    "language": "ja",
    "description": "MAP 型は、さまざまな基本型のキーと値を含むキーと値のペアのデータを格納・処理するために使用します。",
}
---

MAP 型は、さまざまな基本型のキーと値を含むキーと値のペアのデータを格納・処理するために使用します。また、ほかの複合型をネストすることもできます。

## MAP へのキャスト {#cast-to-map}

### 文字列からの変換 {#from-string}

:::caution 動作変更
バージョン 4.0 より前は、MAP 形式に合わない一部の文字列（例: '{1:1,2}'）も正常に変換されることがありました。
バージョン 4.0 以降、MAP 形式に合わない文字列は、厳格モードではエラーになり、非厳格モードでは NULL を返します。
:::

#### 厳格モード {#strict-mode}

##### BNF 定義 {#bnf-definition}

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

##### ルールの説明 {#rule-description}

1. MAP のテキスト表現は、左波括弧 `{` で始まり、右波括弧 `}` で終わる必要があります。
2. 空の MAP は、そのまま `{}` と表します。
3. MAP 内のキーと値のペアは、カンマ `,` で区切ります。
4. 各ペアは、キー、コロン `:`、値の順に「key:value」で構成されます。
5. キーと値は、対応する一重引用符（`'`）または二重引用符（`"`）で囲むことができます。引用符の内側は一つのまとまりとして扱われます。
6. MAP 内の要素の前後には空白を入れることができます。
7. 解析時、`<key-token>` に一致する部分には引き続き型 K の解析ルールを適用し、`<value-token>` に一致する部分には引き続き型 V の解析ルールを適用します。適用される BNF ルールと解析ロジックも、現在の MAP<K, V> の BNF と解析ロジックの一部とみなされます。それぞれのエラー処理と結果は、現在の MAP<K, V> の動作と結果に反映されます。
8. 要素には、null 値を表すために "null" を使用できます。

MAP 形式に合わない場合、またはキーと値のペアに含まれるキーや値が対応する型の形式に合わない場合は、エラーになります。

##### 例 {#examples}

| 入力文字列 | 変換結果 | 説明 |
| --- | --- | --- |
| "{}" | {} | 有効な空の MAP |
| "  {}" | エラー | 左波括弧で始まらないため、解析に失敗します |
| '{123:456}' | MAP\<int,int\> へのキャスト: {123:456} | 有効な MAP |
| '{123:null}' | MAP\<int,int\> へのキャスト: {123:null} | null 値を含む有効な MAP |
| '{   123   :   456    }' | MAP\<int,int\> へのキャスト: {123:456} | 空白を含む有効な MAP |
| '{"123":"456"}' | MAP\<int,int\> へのキャスト: {123:456} | 引用符を使用した有効な MAP |
| '{   "123":"abc"  }' | エラー | "abc" は int 型に変換できません |
| '{ 1:2 ,34, 5:6}' | エラー | MAP 形式に合いません |

#### 非厳格モード {#non-strict-mode}

##### BNF 定義 {#bnf-definition-1}

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

##### ルールの説明 {#rule-description-1}

1. MAP のテキスト表現は、左波括弧 `{` で始まり、右波括弧 `}` で終わる必要があります。
2. 空の MAP は、そのまま `{}` と表します。
3. MAP 内のキーと値のペアは、カンマ `,` で区切ります。
4. 各ペアは、キー、コロン `:`、値の順に「key:value」で構成されます。
5. キーと値は、対応する一重引用符（`'`）または二重引用符（`"`）で囲むことができます。引用符の内側は一つのまとまりとして扱われます。
6. MAP 内の要素の前後には空白を入れることができます。
7. 解析時、`<key-token>` に一致する部分には引き続き型 K の解析ルールを適用し、`<value-token>` に一致する部分には引き続き型 V の解析ルールを適用します。適用される BNF ルールと解析ロジックも、現在の MAP<K, V> の BNF と解析ロジックの一部とみなされます。それぞれのエラー処理と結果は、現在の MAP<K, V> の動作と結果に反映されます。
8. 要素には、null 値を表すために "null" を使用できます。

MAP 形式が上記の BNF 形式に合わない場合は、NULL を返します。
キーと値のペアに含まれるキーや値が対応する型の形式に合わない場合は、該当する位置が null に設定されます。

##### 例 {#examples-1}

| 入力文字列 | 変換結果 | 説明 |
| --- | --- | --- |
| "{}" | {} | 有効な空の MAP |
| "  {}" | NULL | 左波括弧で始まらないため、解析に失敗します |
| '{123:456}' | MAP\<int,int\> へのキャスト: {123:456} | 有効な MAP |
| '{123:null}' | MAP\<int,int\> へのキャスト: {123:null} | null 値を含む有効な MAP |
| '{   123   :   456    }' | MAP\<int,int\> へのキャスト: {123:456} | 空白を含む有効な MAP |
| '{"123":"456"}' | MAP\<int,int\> へのキャスト: {123:456} | 引用符を使用した有効な MAP |
| '{   "123":"abc"  }' | MAP\<int,int\> へのキャスト: {123:null} | "abc" は int 型に変換できないため、null に変換されます |
| '{ 1:2 ,34, 5:6}' | NULL | MAP 形式に合いません |

#### ネストされた MAP 内の重複キー {#duplicate-keys-in-nested-maps}

文字列を `MAP`、`ARRAY`、または `STRUCT` にキャストすると、Doris は変換結果に含まれるすべての `MAP` から重複キーを除去します。これには、`ARRAY`、`STRUCT`、または MAP の値の中にネストされた MAP も含まれます。同じキーが複数回現れた場合は、最後の値が保持されます。

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

### MAP\<Other Type\> からの変換 {#from-mapother-type}

#### 厳格モード {#strict-mode-1}

##### ルールの説明 {#rule-description-2}

MAP 内の各要素に対して、別の型から対象の型へのキャストを行います。このキャストにも厳格モードが適用されます。

##### 例 {#examples-2}

| 入力 MAP | 変換結果 | 説明 |
| --- | --- | --- |
| {"123":"456"} | MAP\<int,int\> へのキャスト: {123:456} | "123" と "456" は Int に変換できます |
| {"abc":"123"} | エラー | "abc" は Int に変換できません |
| {"123":null} | MAP\<int,int\> へのキャスト: {123:null} | null のキャスト結果も null のままです |

#### 非厳格モード {#non-strict-mode-1}

##### ルールの説明 {#rule-description-3}

MAP 内の各要素に対して、別の型から対象の型へのキャストを行います。このキャストにも非厳格モードが適用されます。

##### 例 {#examples-3}

| 入力 MAP | 変換結果 | 説明 |
| --- | --- | --- |
| {"123":"456"} | MAP\<int,int\> へのキャスト: {123:456} | "123" と "456" は Int に変換できます |
| {"abc":"123"} | MAP\<int,int\> へのキャスト: {null:123} | "abc" は Int に変換できないため、null に変換されます |
| {"123":null} | MAP\<int,int\> へのキャスト: {123:null} | null のキャスト結果も null のままです |
