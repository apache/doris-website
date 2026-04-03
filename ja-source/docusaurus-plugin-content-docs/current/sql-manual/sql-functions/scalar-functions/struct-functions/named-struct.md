---
{
  "title": "NAMED_STRUCT",
  "language": "ja",
  "description": "指定されたフィールド名と値に基づいてstructを構築し、返します。この関数は偶数個のパラメータを受け取り、"
}
---
## 説明

指定されたフィールド名と値に基づいて構造体を構築し、返します。この関数は偶数個のパラメータを受け取り、奇数位置がフィールド名、偶数位置がフィールド値になります。

## 構文

```sql
NAMED_STRUCT( <field_name> , <field_value> [ , <field_name> , <field_value> ... ] )
```
## パラメータ

- `<field_name>`: 構造体を構築するための奇数位置の入力コンテンツ、フィールドの名前、定数文字列である必要があります
- `<field_value>`: 構造体を構築するための偶数位置の入力コンテンツ、フィールドの値、複数の列または定数が可能です

**サポートされている要素タイプ:**
- 数値型: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL
- 文字列型: CHAR, VARCHAR, STRING
- 日付と時刻型: DATE, DATETIME, DATEV2, DATETIMEV2
- 論理型: BOOLEAN
- IP型: IPV4, IPV6
- 複合型: ARRAY, MAP, STRUCT

## 戻り値

戻り値の型: STRUCT<T>

戻り値の意味:
- 指定されたすべてのフィールド名と値のペアを含む構造体を返します
- すべてのフィールドはNULL値をサポートします

## 使用法

- この関数はすべてのフィールド名と値のペアを構造体に結合します。奇数位置はフィールド名（定数文字列である必要があり、重複不可、大文字小文字を区別しない）、偶数位置はフィールド値（複数の列または定数が可能）です
- パラメータ数は1より大きい非ゼロの偶数である必要があります
- すべてのフィールドはnullableとしてマークされます

**クエリ例:**

基本的な使用法:

```sql
select named_struct('name', 'Alice', 'age', 25, 'city', 'Beijing');
+-------------------------------------------------------------+
| named_struct('name', 'Alice', 'age', 25, 'city', 'Beijing') |
+-------------------------------------------------------------+
| {"name":"Alice", "age":25, "city":"Beijing"}                |
+-------------------------------------------------------------+
```
null値を含む:

```sql
select named_struct('id', 1, 'name', null, 'score', 95.5);
+----------------------------------------------------+
| named_struct('id', 1, 'name', null, 'score', 95.5) |
+----------------------------------------------------+
| {"id":1, "name":null, "score":95.5}                |
+----------------------------------------------------+
```
複合型を含む場合：

```sql
select named_struct('array', [1,2,3], 'map', {'key':'value'}, 'struct', named_struct('f1',1,'f2',2));
+-----------------------------------------------------------------------------------------------+
| named_struct('array', [1,2,3], 'map', {'key':'value'}, 'struct', named_struct('f1',1,'f2',2)) |
+-----------------------------------------------------------------------------------------------+
| {"array":[1, 2, 3], "map":{"key":"value"}, "struct":{"f1":1, "f2":2}}                         |
+-----------------------------------------------------------------------------------------------+
```
IP アドレスを含む名前付き構造体の作成:

```sql
select named_struct('ipv4', cast('192.168.1.1' as ipv4), 'ipv6', cast('2001:db8::1' as ipv6));
+----------------------------------------------------------------------------------------+
| named_struct('ipv4', cast('192.168.1.1' as ipv4), 'ipv6', cast('2001:db8::1' as ipv6)) |
+----------------------------------------------------------------------------------------+
| {"ipv4":"192.168.1.1", "ipv6":"2001:db8::1"}                                           |
+----------------------------------------------------------------------------------------+
```
エラー例

パラメータが2個未満の場合:

```sql
select named_Struct();
ERROR 1105 (HY000): errCode = 2, detailMessage = named_struct requires at least two arguments, like: named_struct('a', 1)

select named_struct('name');
ERROR 1105 (HY000): errCode = 2, detailMessage = named_struct requires at least two arguments, like: named_struct('a', 1)
```
パラメータの数が奇数です:

```sql
select named_struct('name', 'Alice', 'age');
ERROR 1105 (HY000): errCode = 2, detailMessage = named_struct can't be odd parameters, need even parameters named_struct('name', 'Alice', 'age')
```
重複するフィールド名、フィールド名は大文字小文字を区別しません：

```sql
select named_struct('name', 'Alice', 'name', 'Bob');
ERROR 1105 (HY000): errCode = 2, detailMessage = The name of the struct field cannot be repeated. same name fields are name

select named_struct('name', 'Alice', 'Name', 'Bob');
ERROR 1105 (HY000): errCode = 2, detailMessage = The name of the struct field cannot be repeated. same name fields are name
```
