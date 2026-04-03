---
{
  "title": "STRUCT | Struct関数",
  "sidebar_label": "STRUCT",
  "description": "指定された値に基づいて構造体を構築し、返します。この関数は1つ以上のパラメータを受け取り、すべての入力要素を含む構造体を返します。",
  "language": "ja"
}
---
# STRUCT

## 説明

指定された値に基づいて構造体を構築し、返します。この関数は1つ以上のパラメータを受け取り、すべての入力要素を含む構造体を返します。

## 構文

```sql
STRUCT( <expr1> [ , <expr2> ... ] )
```
## パラメータ

- `<expr1>, <expr2>, ...`: struct構築のための入力コンテンツ、1つ以上のパラメータをサポート

**サポートされる要素タイプ:**
- 数値型: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL
- 文字列型: CHAR, VARCHAR, STRING
- 日付と時刻型: DATE, DATETIME, DATEV2, DATETIMEV2
- ブール型: BOOLEAN
- IP型: IPV4, IPV6
- 複合型: ARRAY, MAP, STRUCT

## 戻り値

戻り値の型: STRUCT<T>

戻り値の意味:
- 全ての入力要素を含むstructを返します。フィールド名はデフォルトでcol1, col2, col3, ...の形式になります
- 全てのフィールドはNULL値をサポートします

## 使用方法

- この関数は全ての入力要素をstructに結合します
- 少なくとも1つのパラメータが必要です
- 全てのフィールドはnullableとしてマークされます

## 例

**クエリ例:**

基本的な使用方法: nullフィールドを含む混在型のstructを作成

```sql
select struct(1, 'a', "abc"),struct(null, 1, null),struct(cast('2023-03-16' as datetime));
+--------------------------------------+--------------------------------------+----------------------------------------+
| struct(1, 'a', "abc")                | struct(null, 1, null)                | struct(cast('2023-03-16' as datetime)) |
+--------------------------------------+--------------------------------------+----------------------------------------+
| {"col1":1, "col2":"a", "col3":"abc"} | {"col1":null, "col2":1, "col3":null} | {"col1":"2023-03-16 00:00:00"}         |
+--------------------------------------+--------------------------------------+----------------------------------------+
```
複雑な型を含む構造体の作成：

```sql
select struct([1,2,3], {'name':'Alice','age':20}, named_struct('f1',1,'f2',2));
+----------------------------------------------------------------------------------+
| struct([1,2,3], {'name':'Alice','age':20}, named_struct('f1',1,'f2',2))          |
+----------------------------------------------------------------------------------+
| {"col1":[1, 2, 3], "col2":{"name":"Alice", "age":"20"}, "col3":{"f1":1, "f2":2}} |
+----------------------------------------------------------------------------------+
```
IP アドレスを含む構造体の作成：

```sql
select struct(cast('192.168.1.1' as ipv4), cast('2001:db8::1' as ipv6));
+------------------------------------------------------------------+
| struct(cast('192.168.1.1' as ipv4), cast('2001:db8::1' as ipv6)) |
+------------------------------------------------------------------+
| {"col1":"192.168.1.1", "col2":"2001:db8::1"}                     |
+------------------------------------------------------------------+
```
エラー例

サポートされていない型はエラーを報告します：
Json/Variant型を含む構造体の作成

```sql 
select struct(v) from var_with_index;
ERROR 1105 (HY000): errCode = 2, detailMessage = struct does not support jsonb/variant type

select struct(cast(1 as jsonb)) from var_with_index;
ERROR 1105 (HY000): errCode = 2, detailMessage = struct does not support jsonb/variant type
```
空のstructを作成するとエラーが報告され、少なくとも1つのパラメータが必要です。これはhiveの動作と一致しています：

```sql
select struct();
ERROR 1105 (HY000): errCode = 2, detailMessage = struct requires at least one argument, like: struct(1)
```
