---
{
  "title": "STRUCT型へのキャスト",
  "language": "ja",
  "description": "STRUCT型は構造化データを格納・処理するために使用され、それぞれ名前と対応する値を持つ異なる型のフィールドを含むことができます。"
}
---
STRUCT型は構造化データの格納と処理に使用され、異なる型のフィールドを含むことができ、各フィールドには名前と対応する値があります。STRUCTは、ARRAY、MAP、または他のSTRUCTなどの他の複合型をネストできます。

## STRUCTへのキャスト

### String から

#### Strict Mode

##### BNF Definition

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

1. STRUCTのテキスト表現は左波括弧 `{` で始まり、右波括弧 `}` で終わる必要があります。
2. 空のSTRUCTは直接 `{}` として表現されます。
3. STRUCT内のフィールド-値ペアはコンマ `,` で区切られます。
4. 各フィールド-値ペアは、オプションのフィールド名、コロン `:`、値から構成され、"fieldname:value" または単純に "value" の順序になります。
5. フィールド-値ペアは、すべて "fieldname:value" 形式を使用するか、すべて "value" 形式を使用するかのいずれかでなければなりません。
6. フィールド名と値は、オプションで一致するシングルクォート（`'`）またはダブルクォート（`"`）で囲むことができます。クォート内のコンテンツは単一のエンティティとして扱われます。
7. STRUCT内の要素の前後に空白を入れることができます。
8. 解析中、`<value-token>` に一致する部分は、値タイプの解析ルールを継続して適用します。`<field-token>` 部分がある場合、STRUCTで定義された名前の数と順序に一致する必要があります。
9. 要素は "null" を使用してnull値を表現できます。

STRUCTの形式が要件を満たしていない場合、エラーが報告されます。例えば：
1. フィールド-値ペアの数がSTRUCTで定義された数と一致しない。
2. フィールド-値の順序がSTRUCTで定義された順序と一致しない。
3. 一部のフィールド-値ペアにフィールド名があり、他にはない（すべてフィールド名があるか、すべてフィールド名がないかのいずれかでなければなりません）。

STRUCTの値が対応するタイプの要件を満たしていない場合、エラーが報告されます。

##### 例

| 入力文字列 | 変換結果 | コメント |
| --- | --- | --- |
| "{}" | {} | 有効な空のSTRUCT |
| "  {}" | Error | 波括弧で始まっていない、解析に失敗 |
| '{"a":1,"b":1}' | Cast to STRUCT\<a:int, b:int\>: {"a":1, "b":1} | フィールド名を持つ有効なSTRUCT |
| '{a:1,"b":3.14}' | Cast to STRUCT\<a:int, b:double\>: {"a":1, "b":3.14} | フィールド名はクォートありまたはなしが可能 |
| '{1,3.14}' | Cast to STRUCT\<a:int, b:double\>: {"a":1, "b":3.14} | フィールド名が提供されていない、解析成功 |
| '{a:1,3.1,c:100}' | Error | フィールド名があるものとないものが混在する形式 |
| '{a:1}' | Cast to STRUCT\<a:int, b:double\>: Error | フィールド-値ペアの数が定義された数と一致しない |
| '{b:1,a:1}' | Cast to STRUCT\<a:int, b:double\>: Error | フィールドの順序が正しくない |
| '{"a":"abc","b":1}' | Cast to STRUCT\<a:int, b:int\>: Error | "abc" をint型に変換できない |
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
##### ルール説明

1. STRUCTのテキスト表現は左波括弧`{`で始まり、右波括弧`}`で終わる必要があります。
2. 空のSTRUCTは直接`{}`として表現されます。
3. STRUCT内のフィールド値ペアはカンマ`,`で区切られます。
4. 各フィールド値ペアは、オプションのフィールド名、コロン`:`、値から構成され、「fieldname:value」または単に「value」の順序で記述されます。
5. フィールド値ペアは、すべて「fieldname:value」形式を使用するか、すべて「value」形式を使用する必要があります。
6. フィールド名と値は、オプションで一致する単一引用符（`'`）または二重引用符（`"`）で囲むことができます。引用符内のコンテンツは単一のエンティティとして扱われます。
7. STRUCT内の要素の前後に空白を含めることができます。
8. 解析中、`<value-token>`に一致する部分は、値タイプの解析ルールを継続して適用します。`<field-token>`部分がある場合、STRUCTで定義された名前の数と順序と一致する必要があります。
9. 要素は「null」を使用してnull値を表現できます。

STRUCT形式が要件を満たしていない場合、NULLが返されます。例：
1. フィールド値ペアの数がSTRUCTで定義された数と一致しない。
2. フィールド値の順序がSTRUCTで定義された順序と一致しない。
3. 一部のフィールド値ペアにフィールド名があり、他にはない（すべてフィールド名があるか、すべてフィールド名がないかのいずれかでなければなりません）。

STRUCT内の値が対応するタイプの要件を満たしていない場合、対応する位置はnullに設定されます。

##### 例

| 入力文字列 | 変換結果 | コメント |
| --- | --- | --- |
| "{}" | {} | 有効な空のSTRUCT |
| "  {}" | NULL | 波括弧で始まらない、解析失敗 |
| '{"a":1,"b":1}' | STRUCT\<a:int, b:int\>にキャスト: {"a":1, "b":1} | フィールド名を持つ有効なSTRUCT |
| '{a:1,"b":3.14}' | STRUCT\<a:int, b:double\>にキャスト: {"a":1, "b":3.14} | フィールド名は引用符で囲んでも囲まなくても良い |
| '{1,3.14}' | STRUCT\<a:int, b:double\>にキャスト: {"a":1, "b":3.14} | フィールド名が提供されていない、解析成功 |
| '{a:1,3.1,c:100}' | NULL | フィールド名があるものとないものが混在した形式 |
| '{a:1}' | STRUCT\<a:int, b:double\>にキャスト: NULL | フィールド値ペアの数が定義された数と一致しない |
| '{b:1,a:1}' | STRUCT\<a:int, b:double\>にキャスト: NULL | フィールドの順序が不正 |
| '{"a":"abc","b":1}' | STRUCT\<a:int, b:int\>にキャスト: {"a":null, "b":1} | 「abc」はintタイプに変換できない、位置をnullに設定 |
| '{null,1}' | STRUCT\<a:int, b:int\>にキャスト: {"a":null, "b":1} | null値を持つ有効なSTRUCT |
| '{"name":"John","age":"twenty-five"}' | STRUCT\<name:string, age:int\>にキャスト: {"name":"John", "age":null} | 「twenty-five」はintタイプに変換できない、位置をnullに設定 |
| '{{"x":"one","y":2},3}' | STRUCT\<point:struct<x:int,y:int>, z:int\>にキャスト: {"point":{"x":null,"y":2}, "z":3} | ネストしたSTRUCTで、変換失敗によりnull |

### FROM STRUCT\<Other Type\>

ソースデータがSTRUCTタイプで、ターゲットもSTRUCTタイプの場合、以下の条件を満たす必要があります：

1. ソースSTRUCTとターゲットSTRUCTの要素（フィールド）数が同じである必要があります
2. ソースSTRUCT内の各要素は、順番にターゲットSTRUCTの対応する要素タイプに変換されます

要素数が一致しない場合など、上記の条件が満たされない場合、変換は不可能になります。

#### Strict Mode

##### ルール説明

STRUCT内の各要素に対して、Other Type To TypeからのCastが実行されます。Castもstrict modeです。

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
#### Non-Strict Mode

##### ルールの説明

STRUCT内の各要素に対して、Other TypeからTypeへのCastが実行されます。Castも非厳密モードで行われます。

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
