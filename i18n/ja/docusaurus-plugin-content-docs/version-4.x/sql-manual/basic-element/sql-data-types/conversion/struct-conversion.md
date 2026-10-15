---
{
    "title": "STRUCT 型へのキャスト",
    "language": "ja",
    "description": "STRUCT 型は、名前と対応する値を持つ、型の異なるフィールドを含む構造化データの格納と処理に使用します。"
}
---

STRUCT 型は、名前と対応する値を持つ、型の異なるフィールドを含む構造化データの格納と処理に使用します。STRUCT には、ARRAY、MAP、別の STRUCT などの複合型をネストできます。

## STRUCT 型へのキャスト

### 文字列からの変換

#### 厳密モード

##### BNF 定義

```xml
<struct>          ::= "{" <struct-content>? "}" | <empty-struct> 

<empty-struct> ::= "{}"

<struct-content>  ::=  <struct-field-value-content> | <struct-only-value-content>

<struct-field-value-content> ::=  <field-token> <map_key_delimiter> <value-token>
                     (<collection-delim> <field-token> <map_key_delimiter> <value-token>)*
                         
<struct-only-value-content> ::=  <value-token>(<collection-delim> <value-token>)*

<value-token>    ::= <whitespace>* "\"" <inner-sequence> "\"" <whitespace>*
                   | <whitespace>* "'" <inner-sequence> "'" <whitespace>*
                   | <whitespace>* <inner-sequence> <whitespace>*

<inner-sequence>    ::= .*
<collection-delim>  ::= "," 
<map_key_delimiter> ::= ":"
```

##### ルールの説明

1. STRUCT の文字列表現は、左波括弧 `{` で始まり、右波括弧 `}` で終わる必要があります。
2. 空の STRUCT は `{}` と表します。
3. STRUCT 内のフィールドと値の組は、コンマ `,` で区切ります。
4. 各組は、省略可能なフィールド名、コロン `:`、値からなり、"fieldname:value" または単に "value" の形式で記述します。
5. すべての組で "fieldname:value" 形式を使うか、すべての組で "value" 形式を使う必要があります。
6. フィールド名と値は、対応する一重引用符 (`'`) または二重引用符 (`"`) で囲むことができます。引用符内の内容は一つの要素として扱われます。
7. STRUCT 内の要素の前後には空白を含められます。
8. 解析時に `<value-token>` に一致する部分には、値の型に応じた解析ルールが引き続き適用されます。`<field-token>` に一致する部分の扱いは、フィールド名の有無によって異なります。
   - **フィールド名がある場合:** フィールドは大文字と小文字を区別せず、**名前**で照合します。入力フィールドの順序は、STRUCT で定義された順序と一致する**必要はありません**。STRUCT で定義されていて入力にないフィールドには NULL が設定されます。厳密モードでは、STRUCT に存在しないフィールド名が入力に含まれるとエラーになります。
   - **フィールド名がない場合:** フィールドは位置で照合します。値の数は、STRUCT で定義されたフィールド数と**完全に一致する必要があります**。
9. 要素には、NULL 値を表す "null" を使用できます。

STRUCT の形式が要件を満たさない場合、エラーが報告されます。例:
1. フィールド名がなく、値の数が STRUCT で定義されたフィールド数と一致しない場合。
2. フィールド名があり、STRUCT に存在しないフィールド名が入力に含まれる場合。
3. フィールド名がある組とない組が混在する場合（すべての組にフィールド名があるか、すべての組で省略されている必要があります）。

STRUCT 内の値が対応する型の要件を満たさない場合、エラーが報告されます。

##### 例

| 入力文字列 | 変換結果 | 説明 |
| --- | --- | --- |
| "{}" | {} | 有効な空の STRUCT |
| "  {}" | Error | 波括弧で始まらないため、解析に失敗する |
| '{"a":1,"b":1}' | キャスト先 STRUCT\<a:int, b:int\>: {"a":1, "b":1} | フィールド名がある有効な STRUCT |
| '{a:1,"b":3.14}' | キャスト先 STRUCT\<a:int, b:double\>: {"a":1, "b":3.14} | フィールド名は引用符で囲んでも囲まなくてもよい |
| '{1,3.14}' | キャスト先 STRUCT\<a:int, b:double\>: {"a":1, "b":3.14} | フィールド名がないため、位置で照合する |
| '{b:3.14,a:1}' | キャスト先 STRUCT\<a:int, b:double\>: {"a":1, "b":3.14} | フィールド名がある場合は名前で照合するため、入力順序はスキーマと異なってもよい |
| '{A:1,B:3.14}' | キャスト先 STRUCT\<a:int, b:double\>: {"a":1, "b":3.14} | フィールド名は大文字と小文字を区別せずに照合する |
| '{a:1}' | キャスト先 STRUCT\<a:int, b:double\>: {"a":1, "b":null} | 入力にフィールド b がないため、NULL が設定される |
| '{a:1,c:100}' | キャスト先 STRUCT\<a:int, b:double\>: Error | フィールド名 c が STRUCT に存在しないため、厳密モードではエラーになる |
| '{a:1,3.1,c:100}' | Error | フィールド名がある形式とない形式が混在している |
| '{1,3.14,100}' | キャスト先 STRUCT\<a:int, b:double\>: Error | フィールド名がなく、値の数が定義済みのフィールド数と一致しない |
| '{"a":"abc","b":1}' | キャスト先 STRUCT\<a:int, b:int\>: Error | "abc" は int 型に変換できない |
| '{null,1}' | キャスト先 STRUCT\<a:int, b:int\>: {"a":null, "b":1} | null 値を含む有効な STRUCT |
| '{"name":"John","age":25}' | キャスト先 STRUCT\<name:string, age:int\>: {"name":"John", "age":25} | 文字列値を含む STRUCT |
| '{{"x":1,"y":2},3}' | キャスト先 STRUCT\<point:struct<x:int,y:int>, z:int\>: {"point":{"x":1,"y":2}, "z":3} | STRUCT をネストした構造 |

#### 非厳密モード

##### BNF 定義

```xml
<struct>          ::= "{" <struct-content>? "}" | <empty-struct> 

<empty-struct> ::= "{}"

<struct-content>  ::=  <struct-field-value-content> | <struct-only-value-content>

<struct-field-value-content> ::=  <field-token> <map_key_delimiter> <value-token>
                     (<collection-delim> <field-token> <map_key_delimiter> <value-token>)*
                         
<struct-only-value-content> ::=  <value-token>(<collection-delim> <value-token>)*

<value-token>    ::= <whitespace>* "\"" <inner-sequence> "\"" <whitespace>*
                   | <whitespace>* "'" <inner-sequence> "'" <whitespace>*
                   | <whitespace>* <inner-sequence> <whitespace>*

<inner-sequence>    ::= .*
<collection-delim>  ::= "," 
<map_key_delimiter> ::= ":"
```

##### ルールの説明

1. STRUCT の文字列表現は、左波括弧 `{` で始まり、右波括弧 `}` で終わる必要があります。
2. 空の STRUCT は `{}` と表します。
3. STRUCT 内のフィールドと値の組は、コンマ `,` で区切ります。
4. 各組は、省略可能なフィールド名、コロン `:`、値からなり、"fieldname:value" または単に "value" の形式で記述します。
5. すべての組で "fieldname:value" 形式を使うか、すべての組で "value" 形式を使う必要があります。
6. フィールド名と値は、対応する一重引用符 (`'`) または二重引用符 (`"`) で囲むことができます。引用符内の内容は一つの要素として扱われます。
7. STRUCT 内の要素の前後には空白を含められます。
8. 解析時に `<value-token>` に一致する部分には、値の型に応じた解析ルールが引き続き適用されます。`<field-token>` に一致する部分の扱いは、フィールド名の有無によって異なります。
   - **フィールド名がある場合:** フィールドは大文字と小文字を区別せず、**名前**で照合します。入力フィールドの順序は、STRUCT で定義された順序と一致する**必要はありません**。STRUCT で定義されていて入力にないフィールドには NULL が設定されます。STRUCT に存在しない入力フィールド名は無視されます。
   - **フィールド名がない場合:** フィールドは位置で照合します。値の数は、STRUCT で定義されたフィールド数と**完全に一致する必要があります**。
9. 要素には、NULL 値を表す "null" を使用できます。

STRUCT の形式が要件を満たさない場合、NULL が返されます。例:
1. フィールド名がなく、値の数が STRUCT で定義されたフィールド数と一致しない場合。
2. フィールド名がある組とない組が混在する場合（すべての組にフィールド名があるか、すべての組で省略されている必要があります）。

STRUCT 内の値が対応する型の要件を満たさない場合、対応する位置に null が設定されます。

##### 例

| 入力文字列 | 変換結果 | 説明 |
| --- | --- | --- |
| "{}" | {} | 有効な空の STRUCT |
| "  {}" | NULL | 波括弧で始まらないため、解析に失敗する |
| '{"a":1,"b":1}' | キャスト先 STRUCT\<a:int, b:int\>: {"a":1, "b":1} | フィールド名がある有効な STRUCT |
| '{a:1,"b":3.14}' | キャスト先 STRUCT\<a:int, b:double\>: {"a":1, "b":3.14} | フィールド名は引用符で囲んでも囲まなくてもよい |
| '{1,3.14}' | キャスト先 STRUCT\<a:int, b:double\>: {"a":1, "b":3.14} | フィールド名がないため、位置で照合する |
| '{b:3.14,a:1}' | キャスト先 STRUCT\<a:int, b:double\>: {"a":1, "b":3.14} | フィールド名がある場合は名前で照合するため、入力順序はスキーマと異なってもよい |
| '{A:1,B:3.14}' | キャスト先 STRUCT\<a:int, b:double\>: {"a":1, "b":3.14} | フィールド名は大文字と小文字を区別せずに照合する |
| '{a:1}' | キャスト先 STRUCT\<a:int, b:double\>: {"a":1, "b":null} | 入力にフィールド b がないため、NULL が設定される |
| '{a:1,c:100}' | キャスト先 STRUCT\<a:int, b:double\>: {"a":1, "b":null} | 未知のフィールド c は無視され、欠けているフィールド b には NULL が設定される |
| '{a:1,3.1,c:100}' | NULL | フィールド名がある形式とない形式が混在している |
| '{1,3.14,100}' | キャスト先 STRUCT\<a:int, b:double\>: NULL | フィールド名がなく、値の数が定義済みのフィールド数と一致しない |
| '{"a":"abc","b":1}' | キャスト先 STRUCT\<a:int, b:int\>: {"a":null, "b":1} | "abc" は int 型に変換できないため、その位置に null が設定される |
| '{null,1}' | キャスト先 STRUCT\<a:int, b:int\>: {"a":null, "b":1} | null 値を含む有効な STRUCT |
| '{"name":"John","age":"twenty-five"}' | キャスト先 STRUCT\<name:string, age:int\>: {"name":"John", "age":null} | "twenty-five" は int 型に変換できないため、その位置に null が設定される |
| '{{"x":"one","y":2},3}' | キャスト先 STRUCT\<point:struct<x:int,y:int>, z:int\>: {"point":{"x":null,"y":2}, "z":3} | ネストした STRUCT では、変換に失敗した値が null になる |

### STRUCT\<Other Type\> からの変換

変換元データと変換先がともに STRUCT 型の場合、次の条件を満たす必要があります。

1. 変換元と変換先の STRUCT の要素（フィールド）数が同じであること
2. 変換元 STRUCT の各要素が、順番に変換先 STRUCT の対応する要素の型へ変換されること

要素数が一致しないなど、上記の条件を満たさない場合は変換できません。

#### 厳密モード

##### ルールの説明

STRUCT の各要素に対して、別の型から目的の型へのキャストが行われます。このキャストにも厳密モードが適用されます。

##### 例

```sql
-- Create a simple STRUCT type variable
mysql> SELECT named_struct('a', 123, 'b', 'abc') AS original_struct;
+----------------------+
| original_struct      |
+----------------------+
| {"a":123, "b":"abc"} |
+----------------------+
-- Result: {"a":123,"b":"abc"} Type: struct<a:tinyint,b:varchar(3)>

-- Normal CAST
mysql> SELECT CAST(named_struct('a', 123, 'b', 'abc') AS STRUCT<c:bigint, d:string>) AS renamed_struct;
+----------------------+
| renamed_struct       |
+----------------------+
| {"c":123, "d":"abc"} |
+----------------------+

-- Fields count doesn't match
mysql> SELECT CAST(named_struct('a', 123, 'b', 'abc') AS STRUCT<c:bigint, d:string,e:char>) AS renamed_struct;
ERROR 1105 (HY000): errCode = 2, detailMessage = can not cast from ...

mysql> SELECT CAST(named_struct('a', 123, 'b', 'abc') AS STRUCT<c:bigint>) AS renamed_struct;
ERROR 1105 (HY000): errCode = 2, detailMessage = can not cast from ...

-- Element in STRUCT doesn't have a corresponding CAST
mysql> SELECT CAST(named_struct('a', 123, 'b', 'abc') AS STRUCT<b:Array<int>, a:int>) AS renamed_struct;
ERROR 1105 (HY000): errCode = 2, detailMessage = can not cast from ...

-- CAST is based on the defined order, not field names
mysql> SELECT CAST(named_struct('a', 123, 'b', 'abc') AS STRUCT<b:string, a:int>) AS renamed_struct;
+------------------------+
| renamed_struct         |
+------------------------+
| {"b":"123", "a":"abc"} |
+------------------------+

-- Element CAST fails, the whole CAST reports an error
mysql> SELECT CAST(named_struct('a', 123, 'b', 'abc') AS STRUCT<b:string, a:int>) AS renamed_struct;
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]parse number fail, string: 'abc'
```

#### 非厳密モード

##### ルールの説明

STRUCT の各要素に対して、別の型から目的の型へのキャストが行われます。このキャストにも非厳密モードが適用されます。

##### 例

```sql
-- Create a simple STRUCT type variable
mysql> SELECT named_struct('a', 123, 'b', 'abc') AS original_struct;
+----------------------+
| original_struct      |
+----------------------+
| {"a":123, "b":"abc"} |
+----------------------+
-- Result: {"a":123,"b":"abc"} Type: struct<a:tinyint,b:varchar(3)>

-- Normal CAST
mysql> SELECT CAST(named_struct('a', 123, 'b', 'abc') AS STRUCT<c:bigint, d:string>) AS renamed_struct;
+----------------------+
| renamed_struct       |
+----------------------+
| {"c":123, "d":"abc"} |
+----------------------+

-- Fields count doesn't match
mysql> SELECT CAST(named_struct('a', 123, 'b', 'abc') AS STRUCT<c:bigint, d:string,e:char>) AS renamed_struct;
ERROR 1105 (HY000): errCode = 2, detailMessage = can not cast from ...

mysql> SELECT CAST(named_struct('a', 123, 'b', 'abc') AS STRUCT<c:bigint>) AS renamed_struct;
ERROR 1105 (HY000): errCode = 2, detailMessage = can not cast from ...

-- Element in STRUCT doesn't have a corresponding CAST
mysql> SELECT CAST(named_struct('a', 123, 'b', 'abc') AS STRUCT<b:Array<int>, a:int>) AS renamed_struct;
ERROR 1105 (HY000): errCode = 2, detailMessage = can not cast from ...

-- CAST is based on the defined order, not field names
mysql> SELECT CAST(named_struct('a', 123, 'b', 'abc') AS STRUCT<b:string, a:int>) AS renamed_struct;
+------------------------+
| renamed_struct         |
+------------------------+
| {"b":"123", "a":"abc"} |
+------------------------+

-- Element CAST fails, the corresponding element is set to null
mysql> SELECT CAST(named_struct('a', 123, 'b', 'abc') AS STRUCT<b:string, a:int>) AS renamed_struct;
+-----------------------+
| renamed_struct        |
+-----------------------+
| {"b":"123", "a":null} |
+-----------------------+
```
