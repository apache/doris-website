---
{
  "title": "ARRAY_PUSHFRONT",
  "language": "ja",
  "description": "配列の先頭に要素を追加します。この関数は、新しく追加された要素と元の配列のすべての要素を含む新しい配列を返します。"
}
---
## array_pushfront

<version since="2.0.0">

</version>

## 説明

配列の先頭に要素を追加します。この関数は、新しく追加された要素と元の配列のすべての要素を含む新しい配列を返します。

## 構文

```sql
array_pushfront(ARRAY<T> arr, T element)
```
### パラメータ

- `arr`：ARRAY<T> 型、要素を追加する配列
- `element`：T 型、配列の先頭に追加する要素

**T でサポートされる型：**
- 数値型: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL
- 文字列型: CHAR, VARCHAR, STRING
- 日付と時刻型: DATE, DATETIME, DATEV2, DATETIMEV2
- ブール型: BOOLEAN
- IP 型: IPV4, IPV6
- 複合型: ARRAY, MAP, STRUCT

### 戻り値

戻り値の型: ARRAY<T>

戻り値の意味:
- 新しく追加された要素と元の配列のすべての要素を含む新しい配列を返す
- NULL: 入力配列が NULL の場合

使用上の注意:
- この関数は指定された要素を配列の先頭に追加する
- 空の配列でも正常に要素を追加できる、新しい要素の型は配列の要素型と互換性がある必要がある
- 配列要素の null 値について: null 要素は正常に処理される

**クエリ例：**

文字列配列の先頭に要素を追加：

```sql
SELECT array_pushfront(['banana', 'cherry', 'date'], 'apple');
+--------------------------------------------------------+
| array_pushfront(['banana', 'cherry', 'date'], 'apple') |
+--------------------------------------------------------+
| ["apple", "banana", "cherry", "date"]                  |
+--------------------------------------------------------+
```
null値を含む配列の先頭にnull要素を追加する：

```sql
SELECT array_pushfront([1, null, 3], null);
+-------------------------------------+
| array_pushfront([1, null, 3], null) |
+-------------------------------------+
| [null, 1, null, 3]                  |
+-------------------------------------+
```
空の配列の先頭に要素を追加する：

```sql
SELECT array_pushfront([], 42);
+--------------------------+
| array_pushfront([], 42)  |
+--------------------------+
| [42]                     |
+--------------------------+
```
NULL配列はNULLを返します：

```sql
SELECT array_pushfront(NULL, 1);
+---------------------------+
| array_pushfront(NULL, 1)  |
+---------------------------+
| NULL                      |
+---------------------------+
```
float配列の先頭に要素を追加する：

```sql
SELECT array_pushfront([2.2, 3.3, 4.4], 1.1);
+------------------------------------------+
| array_pushfront([2.2, 3.3, 4.4], 1.1)   |
+------------------------------------------+
| [1.1, 2.2, 3.3, 4.4]                    |
+------------------------------------------+
```
IP アドレス配列の先頭に要素を追加する:

```sql
SELECT array_pushfront(CAST(['192.168.1.2', '192.168.1.3'] AS ARRAY<IPV4>), CAST('192.168.1.1' AS IPV4));
+----------------------------------------------------------------------------------+
| array_pushfront(CAST(['192.168.1.2', '192.168.1.3'] AS ARRAY<IPV4>), CAST('192.168.1.1' AS IPV4)) |
+----------------------------------------------------------------------------------+
| ["192.168.1.1", "192.168.1.2", "192.168.1.3"]                                   |
+----------------------------------------------------------------------------------+
```
ネストされた配列の先頭に要素を追加する:

```sql
SELECT array_pushfront([[3,4], [5,6]], [1,2]);
+------------------------------------------+
| array_pushfront([[3,4], [5,6]], [1,2])  |
+------------------------------------------+
| [[1, 2], [3, 4], [5, 6]]                |
+------------------------------------------+
```
MAP配列の先頭に要素を追加する：

```sql
SELECT array_pushfront([{'b':2}, {'c':3}], {'a':1});
+----------------------------------------------+
| array_pushfront([{'b':2}, {'c':3}], {'a':1}) |
+----------------------------------------------+
| [{"a":1}, {"b":2}, {"c":3}]                 |
+----------------------------------------------+
```
STRUCT配列の先頭に要素を追加する：

```sql
SELECT array_pushfront(array(named_struct('name','Bob','age',30), named_struct('name','Charlie','age',40)), named_struct('name','Alice','age',20));
+-------------------------------------------------------------------------------------------------------------------------------------------+
| array_pushfront(array(named_struct('name','Bob','age',30), named_struct('name','Charlie','age',40)), named_struct('name','Alice','age',20)) |
+-------------------------------------------------------------------------------------------------------------------------------------------+
| [{"name":"Alice", "age":20}, {"name":"Bob", "age":30}, {"name":"Charlie", "age":40}]                                                    |
+-------------------------------------------------------------------------------------------------------------------------------------------+
```
パラメータ数が間違っているエラー:

```sql
SELECT array_pushfront([1,2,3]);
ERROR 1105 (HY000): errCode = 2, detailMessage: Can not found function 'array_pushfront' which has 1 arity. Candidate functions are: [array_pushfront(Expression, Expression)]
```
非配列型を渡した際のエラー:

```sql
SELECT array_pushfront('not_an_array', 1);
ERROR 1105 (HY000): errCode = 2, detailMessage: Can not find the compatibility function signature: array_pushfront(VARCHAR(12), TINYINT)
```
### キーワード

ARRAY, PUSHFRONT, ARRAY_PUSHFRONT
