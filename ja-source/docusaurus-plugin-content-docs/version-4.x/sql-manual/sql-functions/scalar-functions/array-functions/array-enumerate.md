---
{
  "title": "ARRAY_ENUMERATE",
  "language": "ja"
}
---
## array_enumerate

<version since="2.0.0">

</version>

## 説明

配列内の各要素の位置インデックス（1から開始）を返します。この関数は配列内の各要素に対応する位置番号を生成します。

## 構文

```sql
array_enumerate(ARRAY<T> arr)
```
### パラメータ

- `arr`：ARRAY<T>型、位置インデックスを生成する対象の配列。列名または定数値をサポートします。

**Tでサポートされる型:**
- 数値型: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL
- 文字列型: CHAR, VARCHAR, STRING
- 日付・時刻型: DATE, DATETIME, DATEV2, DATETIMEV2
- ブール型: BOOLEAN
- IP型: IPV4, IPV6
- 複合型: ARRAY, MAP, STRUCT

### 戻り値

戻り値の型: ARRAY<BIGINT>

戻り値の意味:
- 入力配列と同じ長さの新しい配列を返し、各位置には配列内の対応する要素の位置インデックス（1から開始）が含まれます
- NULL: 入力配列がNULLの場合

使用上の注意:
- この関数は配列内の各要素に対して1から始まり、増分する位置インデックスを生成します
- 空の配列は空の配列を返し、NULL配列はNULLを返します
- 配列要素内のnull値について: null要素も対応する位置インデックスを生成します

### 例

**クエリ例:**

配列の位置インデックスを生成する:

```sql
SELECT array_enumerate([1, 2, 1, 4, 5]);
+----------------------------------+
| array_enumerate([1, 2, 1, 4, 5]) |
+----------------------------------+
| [1, 2, 3, 4, 5]                  |
+----------------------------------+
```
空の配列は空の配列を返します：

```sql
SELECT array_enumerate([]);
+----------------------+
| array_enumerate([])  |
+----------------------+
| []                   |
+----------------------+
```
null値を含む配列では、null要素も位置インデックスを生成します：

```sql
SELECT array_enumerate([1, null, 3, null, 5]);
+--------------------------------------------+
| array_enumerate([1, null, 3, null, 5])     |
+--------------------------------------------+
| [1, 2, 3, 4, 5]                            |
+--------------------------------------------+
```
複合型の例:

ネストした配列型:

```sql
SELECT array_enumerate([[1,2],[3,4],[5,6]]);
+----------------------------------------+
| array_enumerate([[1,2],[3,4],[5,6]])   |
+----------------------------------------+
| [1, 2, 3]                              |
+----------------------------------------+
```
Map型:

```sql
SELECT array_enumerate([{'k':1},{'k':2},{'k':3}]);
+----------------------------------------------+
| array_enumerate([{'k':1},{'k':2},{'k':3}])   |
+----------------------------------------------+
| [1, 2, 3]                                    |
+----------------------------------------------+
```
構造体型：

```sql
SELECT array_enumerate(array(named_struct('name','Alice','age',20),named_struct('name','Bob','age',30)));
+----------------------------------------------------------------------------------------+
| array_enumerate(array(named_struct('name','Alice','age',20),named_struct('name','Bob','age',30))) |
+----------------------------------------------------------------------------------------+
| [1, 2]                                                                                  |
+----------------------------------------------------------------------------------------+
```
パラメータ数が間違っている場合のエラー:

```sql
SELECT array_enumerate([1,2,3], [4,5,6]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'array_enumerate' which has 2 arity. Candidate functions are: [array_enumerate(Expression)]
```
非配列型を渡す際のエラー:

```sql
SELECT array_enumerate('not_an_array');
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_enumerate(VARCHAR(12))
```
### Keywords

ARRAY、ENUMERATE、ARRAY_ENUMERATE
