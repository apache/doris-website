---
{
  "title": "STRUCT型へのキャスト",
  "description": "STRUCT型は構造化データの保存と処理に使用され、それぞれ名前と対応する値を持つ異なる型のフィールドを含むことができます。",
  "language": "ja"
}
---
STRUCT型は構造化データの格納と処理に使用され、それぞれ名前と対応する値を持つ異なる型のフィールドを含むことができます。STRUCTは、ARRAY、MAP、または他のSTRUCTなどの他の複合型をネストすることができます。

## STRUCTへのキャスト

### Stringから

#### Strict Mode

##### BNF定義

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
##### ルール説明

1. STRUCTのテキスト表現は左波括弧`{`で始まり、右波括弧`}`で終わる必要があります。
2. 空のSTRUCTは直接`{}`として表現されます。
3. STRUCT内のフィールド値ペアはカンマ`,`で区切られます。
4. 各フィールド値ペアは、オプションのフィールド名、コロン`:`、値から構成され、"fieldname:value"または単に"value"の順序で記述されます。
5. フィールド値ペアは、すべて"fieldname:value"形式を使用するか、すべて"value"形式を使用するかのいずれかである必要があります。
6. フィールド名と値は、対応する単一引用符（`'`）または二重引用符（`"`）で囲むことができます。引用符内のコンテンツは単一のエンティティとして扱われます。
7. STRUCT内の要素の前後に空白文字を使用することができます。
8. パース中に、`<value-token>`にマッチする部分は、値型のパースルールを適用し続けます。`<field-token>`部分がある場合、STRUCTで定義された名前の数と順序にマッチする必要があります。
9. 要素は"null"を使用してnull値を表現することができます。

STRUCT形式が要件を満たさない場合、エラーが報告されます。例えば：
1. フィールド値ペアの数がSTRUCTで定義された数と一致しない。
2. フィールド値の順序がSTRUCTで定義された順序と一致しない。
3. 一部のフィールド値ペアにはフィールド名があり、他にはない（すべてフィールド名を持つか、すべて持たないかのいずれかである必要があります）。

STRUCT内の値が対応する型の要件を満たさない場合、エラーが報告されます。

##### 例

| Input String | Conversion Result | Comment |
| --- | --- | --- |
| "{}" | {} | 有効な空のSTRUCT |
| "  {}" | Error | 波括弧で始まっていない、パース失敗 |
| '{"a":1,"b":1}' | Cast to STRUCT\<a:int, b:int\>: {"a":1, "b":1} | フィールド名を持つ有効なSTRUCT |
| '{a:1,"b":3.14}' | Cast to STRUCT\<a:int, b:double\>: {"a":1, "b":3.14} | フィールド名は引用符で囲んでも囲まなくても良い |
| '{1,3.14}' | Cast to STRUCT\<a:int, b:double\>: {"a":1, "b":3.14} | フィールド名が提供されていない、パース成功 |
| '{a:1,3.1,c:100}' | Error | フィールド名を持つものと持たないものが混在した形式 |
| '{a:1}' | Cast to STRUCT\<a:int, b:double\>: Error | フィールド値ペアの数が定義された数と一致しない |
| '{b:1,a:1}' | Cast to STRUCT\<a:int, b:double\>: Error | フィールドの順序が正しくない |
| '{"a":"abc","b":1}' | Cast to STRUCT\<a:int, b:int\>: Error | "abc"はint型に変換できない |
| '{null,1}' | Cast to STRUCT\<a:int, b:int\>: {"a":null, "b":1} | null値を持つ有効なSTRUCT |
| '{"name":"John","age":25}' | Cast to STRUCT\<name:string, age:int\>: {"name":"John", "age":25} | 文字列値を持つSTRUCT |
| '{{"x":1,"y":2},3}' | Cast to STRUCT\<point:struct<x:int,y:int>, z:int\>: {"point":{"x":1,"y":2}, "z":3} | ネストしたSTRUCT構造 |

#### 非厳密モード

##### BNF定義

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
##### Rule デスクリプション

1. STRUCTのテキスト表現は左中括弧`{`で始まり、右中括弧`}`で終わる必要があります。
2. 空のSTRUCTは直接`{}`として表現されます。
3. STRUCT内のフィールド値ペアはカンマ`,`で区切られます。
4. 各フィールド値ペアは、オプションのフィールド名、コロン`:`、値で構成され、"fieldname:value"または単に"value"の順序で記述されます。
5. フィールド値ペアは、すべて"fieldname:value"形式を使用するか、すべて"value"形式を使用する必要があります。
6. フィールド名と値は、オプションで一致するシングルクォート(`'`)またはダブルクォート(`"`)で囲むことができます。クォート内のコンテンツは単一のエンティティとして扱われます。
7. STRUCT内の要素の前後には空白を使用できます。
8. 解析中、`<value-token>`にマッチする部分は値の型の解析ルールを引き続き適用します。`<field-token>`部分がある場合、STRUCTで定義された名前の数と順序にマッチする必要があります。
9. 要素は"null"を使用してnull値を表現できます。

STRUCT形式が要件を満たさない場合、NULLが返されます。例：
1. フィールド値ペアの数がSTRUCTで定義された数と一致しない。
2. フィールド値の順序がSTRUCTで定義された順序と一致しない。
3. 一部のフィールド値ペアにフィールド名があり、他にない場合（すべてフィールド名を持つか、すべて持たないかのいずれかである必要があります）。

STRUCT内の値が対応する型の要件を満たさない場合、対応する位置はnullに設定されます。

##### Examples

| Input String | Conversion Result | Comment |
| --- | --- | --- |
| "{}" | {} | Valid empty STRUCT |
| "  {}" | NULL | Does not start with a brace, parsing fails |
| '{"a":1,"b":1}' | Cast to STRUCT\<a:int, b:int\>: {"a":1, "b":1} | Valid STRUCT with field names |
| '{a:1,"b":3.14}' | Cast to STRUCT\<a:int, b:double\>: {"a":1, "b":3.14} | Field names can be quoted or unquoted |
| '{1,3.14}' | Cast to STRUCT\<a:int, b:double\>: {"a":1, "b":3.14} | No field names provided, parsing succeeds |
| '{a:1,3.1,c:100}' | NULL | Mixed format with some having field names and others not |
| '{a:1}' | Cast to STRUCT\<a:int, b:double\>: NULL | Number of field-value pairs does not match defined count |
| '{b:1,a:1}' | Cast to STRUCT\<a:int, b:double\>: NULL | Incorrect order of fields |
| '{"a":"abc","b":1}' | Cast to STRUCT\<a:int, b:int\>: {"a":null, "b":1} | "abc" cannot be converted to int type, position set to null |
| '{null,1}' | Cast to STRUCT\<a:int, b:int\>: {"a":null, "b":1} | Valid STRUCT with null value |
| '{"name":"John","age":"twenty-five"}' | Cast to STRUCT\<name:string, age:int\>: {"name":"John", "age":null} | "twenty-five" cannot be converted to int type, position set to null |
| '{{"x":"one","y":2},3}' | Cast to STRUCT\<point:struct<x:int,y:int>, z:int\>: {"point":{"x":null,"y":2}, "z":3} | In nested STRUCT, failed conversion results in null |

### FROM STRUCT\<Other タイプ\>

ソースデータがSTRUCT型で、ターゲットもSTRUCT型の場合、以下の条件を満たす必要があります：

1. ソースSTRUCTとターゲットSTRUCTは同じ数の要素（フィールド）を持つ必要があります
2. ソースSTRUCT内の各要素は、順番にターゲットSTRUCTの対応する要素型に変換されます

要素数が一致しない場合など、上記の条件が満たされない場合、変換は実行できません。

#### Strict Mode

##### Rule デスクリプション

STRUCT内の各要素に対して、Cast from Other タイプ To Typeが実行されます。Castもstrict modeです。

##### Examples

```sql
-- Create a simple STRUCT type variable
mysql> SELECT named_struct('a', 123, 'b', 'abc') AS original_struct;
+----------------------+
| original_struct      |
+----------------------+
| {"a":123, "b":"abc"} |
+----------------------+
-- Result: {"a":123,"b":"abc"} タイプ: struct<a:tinyint,b:varchar(3)>

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
#### Non-Strict Mode

##### Rule デスクリプション

STRUCT内の各要素に対して、Other TypeからTypeへのCastが実行されます。このCastも非厳密モードで行われます。

##### Examples

```sql
-- Create a simple STRUCT type variable
mysql> SELECT named_struct('a', 123, 'b', 'abc') AS original_struct;
+----------------------+
| original_struct      |
+----------------------+
| {"a":123, "b":"abc"} |
+----------------------+
-- Result: {"a":123,"b":"abc"} タイプ: struct<a:tinyint,b:varchar(3)>

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
