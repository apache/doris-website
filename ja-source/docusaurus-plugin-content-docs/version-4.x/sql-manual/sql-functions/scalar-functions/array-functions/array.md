---
{
  "title": "ARRAY | Array 関数",
  "sidebar_label": "ARRAY",
  "language": "ja"
}
---
# ARRAY

## array

<version since="2.0.0">

</version>

## デスクリプション

配列を作成します。この関数は0個以上のパラメータを受け取り、すべての入力要素を含む配列を返します。

## Syntax

```sql
array([element1, element2, ...])
```
### パラメータ

- `element1, element2, ...`：任意の型、配列に含める要素。0個以上のパラメータをサポートします。

**サポートされる要素の型：**
- 数値型：TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE、DECIMAL
- 文字列型：CHAR、VARCHAR、STRING
- 日付・時刻型：DATE、DATETIME、DATEV2、DATETIMEV2
- Boolean型：BOOLEAN
- IP型：IPV4、IPV6
- 複合型：ARRAY、MAP、STRUCT

### 戻り値

戻り値の型：ARRAY<T>

戻り値の意味：
- すべての入力要素を含む配列を返します
- 空の配列：入力パラメータがない場合

使用上の注意：
- この関数は、同じデータ型のすべての入力要素を配列に結合します。要素の型に互換性がない場合、型変換を試行します
- 複合型と基本型は配列に互換性を持って結合できず、複合型同士も互換性を持って結合できません
- 0個以上のパラメータをサポートします

**クエリ例：**

複数の要素で配列を作成：

```sql
SELECT array(1, 2, 3, 4, 5);
+----------------------+
| array(1, 2, 3, 4, 5) |
+----------------------+
| [1, 2, 3, 4, 5]     |
+----------------------+
```
異なる型の要素を持つ配列を作成する：

```sql
SELECT array(1, 'hello', 3.14, true);
+----------------------------------+
| array(1, 'hello', 3.14, true)    |
+----------------------------------+
| ["1", "hello", "3.14", "true"]   |
+----------------------------------+
```
空の配列を作成します:

```sql
SELECT array();
+----------+
| array()  |
+----------+
| []       |
+----------+
```
null要素を含む配列を作成する：

```sql
SELECT array(1, null, 3, null, 5);
+--------------------------------+
| array(1, null, 3, null, 5)    |
+--------------------------------+
| [1, null, 3, null, 5]         |
+--------------------------------+
```
### 複合型の例

配列を含む配列を作成する：

```sql
SELECT array([1,2], [3,4], [5,6]);
+----------------------------+
| array([1,2], [3,4], [5,6]) |
+----------------------------+
| [[1, 2], [3, 4], [5, 6]]   |
+----------------------------+
```
map を含む配列を作成する：

```sql
SELECT array({'a':1}, {'b':2}, {'c':3});
+----------------------------------+
| array({'a':1}, {'b':2}, {'c':3}) |
+----------------------------------+
| [{"a":1}, {"b":2}, {"c":3}]      |
+----------------------------------+
```
構造体を含む配列を作成する：

```sql
SELECT array(named_struct('name','Alice','age',20), named_struct('name','Bob','age',30));
+-----------------------------------------------------------------------------------+
| array(named_struct('name','Alice','age',20), named_struct('name','Bob','age',30)) |
+-----------------------------------------------------------------------------------+
| [{"name":"Alice", "age":20}, {"name":"Bob", "age":30}]                            |
+-----------------------------------------------------------------------------------+
```
複合型と基本型を混在させるとエラーが発生します：

```sql
SELECT array([1,2], 'hello');
ERROR 1105 (HY000): errCode = 2, detailMessage = can not cast from origin type ARRAY<TINYINT> to target type=TEXT
```
異なる複素数型を混在させるとエラーが発生します：

```sql
SELECT array([1,2], named_struct('name','Alice','age',20));
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array(ARRAY<TINYINT>, STRUCT<name:VARCHAR(5),age:TINYINT>)
```
### Keywords

ARRAY
