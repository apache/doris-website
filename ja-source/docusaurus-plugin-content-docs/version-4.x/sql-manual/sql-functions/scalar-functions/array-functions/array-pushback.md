---
{
  "title": "ARRAY_PUSHBACK",
  "language": "ja"
}
---
## array_pushback

<version since="2.0.0">

</version>

## 説明

配列の末尾に要素を追加します。この関数は、元の配列のすべての要素と新しく追加された要素を含む新しい配列を返します。

## 構文

```sql
array_pushback(ARRAY<T> arr, T element)
```
### パラメータ

- `arr`：ARRAY<T> 型、要素を追加する配列
- `element`：T 型、配列の末尾に追加する要素

**T でサポートされる型:**
- 数値型: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL
- 文字列型: CHAR, VARCHAR, STRING
- 日付と時刻型: DATE, DATETIME, DATEV2, DATETIMEV2
- 真偽値型: BOOLEAN
- IP 型: IPV4, IPV6
- 複合型: ARRAY, MAP, STRUCT

### 戻り値

戻り値の型: ARRAY<T>

戻り値の意味:
- 元の配列のすべての要素と新しく追加された要素を含む新しい配列を返す
- NULL: 入力配列が NULL の場合

使用上の注意:
- この関数は指定された要素を配列の末尾に追加する
- 空の配列にも正常に要素を追加でき、新しい要素の型は配列要素の型と互換性がある必要がある
- 配列要素内の null 値について: null 要素は正常に処理される

**クエリ例:**

文字列配列の末尾に要素を追加:

```sql
SELECT array_pushback(['apple', 'banana', 'cherry'], 'date');
+----------------------------------------------------+
| array_pushback(['apple', 'banana', 'cherry'], 'date') |
+----------------------------------------------------+
| ["apple", "banana", "cherry", "date"]              |
+----------------------------------------------------+
```
null値を含む配列の末尾にnull要素を追加する：

```sql
SELECT array_pushback([1, null, 3], null);
+------------------------------------+
| array_pushback([1, null, 3], null) |
+------------------------------------+
| [1, null, 3, null]                 |
+------------------------------------+
```
空の配列の末尾に要素を追加する：

```sql
SELECT array_pushback([], 42);
+--------------------------+
| array_pushback([], 42)   |
+--------------------------+
| [42]                     |
+--------------------------+
```
float配列の末尾に要素を追加する：

```sql
SELECT array_pushback([1.1, 2.2, 3.3], 4.4);
+------------------------------------------+
| array_pushback([1.1, 2.2, 3.3], 4.4)    |
+------------------------------------------+
| [1.1, 2.2, 3.3, 4.4]                    |
+------------------------------------------+
```
NULL配列はNULLを返します：

```sql
SELECT array_pushback(NULL, 1);
+--------------------------+
| array_pushback(NULL, 1)  |
+--------------------------+
| NULL                     |
+--------------------------+
```
IPアドレス配列の末尾に要素を追加する：

```sql
SELECT array_pushback(CAST(['192.168.1.1', '192.168.1.2'] AS ARRAY<IPV4>), CAST('192.168.1.3' AS IPV4));
+----------------------------------------------------------------------------------+
| array_pushback(CAST(['192.168.1.1', '192.168.1.2'] AS ARRAY<IPV4>), CAST('192.168.1.3' AS IPV4)) |
+----------------------------------------------------------------------------------+
| ["192.168.1.1", "192.168.1.2", "192.168.1.3"]                                   |
+----------------------------------------------------------------------------------+
```
ネストした配列の末尾に要素を追加する:

```sql
SELECT array_pushback([[1,2], [3,4]], [5,6]);
+------------------------------------------+
| array_pushback([[1,2], [3,4]], [5,6])   |
+------------------------------------------+
| [[1, 2], [3, 4], [5, 6]]                |
+------------------------------------------+
```
MAP配列の末尾に要素を追加する：

```sql
SELECT array_pushback([{'a':1}, {'b':2}], {'c':3});
+----------------------------------------------+
| array_pushback([{'a':1}, {'b':2}], {'c':3}) |
+----------------------------------------------+
| [{"a":1}, {"b":2}, {"c":3}]                 |
+----------------------------------------------+
```
STRUCT配列の末尾に要素を追加する：

```sql
SELECT array_pushback(array(named_struct('name','Alice','age',20), named_struct('name','Bob','age',30)), named_struct('name','Charlie','age',40));
+-------------------------------------------------------------------------------------------------------------------------------------------+
| array_pushback(array(named_struct('name','Alice','age',20), named_struct('name','Bob','age',30)), named_struct('name','Charlie','age',40)) |
+-------------------------------------------------------------------------------------------------------------------------------------------+
| [{"name":"Alice", "age":20}, {"name":"Bob", "age":30}, {"name":"Charlie", "age":40}]                                                    |
+-------------------------------------------------------------------------------------------------------------------------------------------+
```
パラメータ数が間違っている場合のエラー:

```sql
SELECT array_pushback([1,2,3]);
ERROR 1105 (HY000): errCode = 2, detailMessage: Can not found function 'array_pushback' which has 1 arity. Candidate functions are: [array_pushback(Expression, Expression)]
```
非配列型を渡す際のエラー:

```sql
SELECT array_pushback('not_an_array', 1);
ERROR 1105 (HY000): errCode = 2, detailMessage: Can not find the compatibility function signature: array_pushback(VARCHAR(12), TINYINT)
```
### Keywords

ARRAY、PUSHBACK、ARRAY_PUSHBACK
