---
{
  "title": "ARRAY_INTERSECT",
  "language": "ja"
}
---
## array_intersect

<version since="2.0.0">

</version>

### 説明

複数の配列の積集合を返します。つまり、すべての配列に存在する要素を返します。この関数は、すべての入力配列に存在する要素を見つけ、重複を除去した後に新しい配列を形成します。

### 構文

```sql
array_intersect(ARRAY<T> arr1, ARRAY<T> arr2, [ARRAY<T> arr3, ...])
```
### パラメータ

- `arr1, arr2, arr3, ...`：ARRAY<T> 型、積集合を計算する配列。2個以上の配列パラメータをサポートします。

**T でサポートされる型:**
- 数値型: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL
- 文字列型: CHAR, VARCHAR, STRING
- 日付・時刻型: DATE, DATETIME, DATEV2, DATETIMEV2
- 論理型: BOOLEAN
- IP型: IPV4, IPV6

### 戻り値

戻り値の型: ARRAY<T>

戻り値の意味:
- すべての入力配列に存在する一意の要素を含む新しい配列を返します
- 空の配列: すべての入力パラメータ配列間に共通の要素がない場合

使用上の注意:
- この関数はすべての入力配列に存在する要素を見つけ、結果配列内の要素は重複除去されます
- 空の配列と任意の非NULL配列は空の配列となります。重複する要素がない場合、この関数は空の配列を返します。
- この関数はNULL配列をサポートしません
- 要素の比較は型互換性ルールに従います。型が互換性がない場合、変換が試行され、失敗するとnullになります
- 配列要素内のnull値について: null要素は操作において通常の要素として扱われ、nullはnullと同じとみなされます

**クエリ例:**

2つの配列の積集合:

```sql
SELECT array_intersect([1, 2, 3, 4, 5], [2, 4, 6, 8]);
+------------------------------------------------+
| array_intersect([1, 2, 3, 4, 5], [2, 4, 6, 8]) |
+------------------------------------------------+
| [4, 2]                                         |
+------------------------------------------------+
```
複数の配列の積集合：

```sql
SELECT array_intersect([1, 2, 3, 4, 5], [2, 4, 6, 8], [2, 4, 10, 12]);
+----------------------------------------------------------------+
| array_intersect([1, 2, 3, 4, 5], [2, 4, 6, 8], [2, 4, 10, 12]) |
+----------------------------------------------------------------+
| [2, 4]                                                         |
+----------------------------------------------------------------+
```
文字列配列の積集合:

```sql
SELECT array_intersect(['a', 'b', 'c'], ['b', 'c', 'd']);
+--------------------------------------------+
| array_intersect(['a','b','c'], ['b','c','d']) |
+--------------------------------------------+
| ["b", "c"]                                 |
+--------------------------------------------+
```
null値を含む配列では、nullは等価性を比較できる値として扱われます：

```sql
SELECT array_intersect([1, null, 2, null, 3], [null, 2, 3, 4]);
+---------------------------------------------------------+
| array_intersect([1, null, 2, null, 3], [null, 2, 3, 4]) |
+---------------------------------------------------------+
| [null, 2, 3]                                            |
+---------------------------------------------------------+
```
文字列配列と整数配列の交差：
文字列 '2' は整数 2 に変換できますが、'b' の変換は失敗して null になります：

```sql
SELECT array_intersect([1, 2, null, 3], ['2', 'b']);
+----------------------------------------------+
| array_intersect([1, 2, null, 3], ['2', 'b']) |
+----------------------------------------------+
| [null, 2]                                    |
+----------------------------------------------+
```
任意の配列を持つ空の配列:

```sql
SELECT array_intersect([], [1, 2, 3]);
+-----------------------------+
| array_intersect([], [1,2,3]) |
+-----------------------------+
| []                          |
+-----------------------------+
```
NULL入力配列はエラーになります：

```sql
SELECT array_intersect(NULL, NULL);
ERROR 1105 (HY000): errCode = 2, detailMessage = class org.apache.doris.nereids.types.NullType cannot be cast to class org.apache.doris.nereids.types.ArrayType (org.apache.doris.nereids.types.NullType and org.apache.doris.nereids.types.ArrayType are in unnamed module of loader 'app')
```
複合型はサポートされておらず、エラーになります：
ネストした配列型はサポートされておらず、エラーになります：

```sql
SELECT array_intersect([[1,2],[3,4],[5,6]]);
ERROR 1105 (HY000): errCode = 2, detailMessage = array_intersect does not support type ARRAY<ARRAY<TINYINT>>, expression is array_intersect([[1, 2], [3, 4], [5, 6]])
```
Mapタイプはサポートされておらず、エラーになります：

```sql
SELECT array_intersect([{'k':1},{'k':2},{'k':3}]);
ERROR 1105 (HY000): errCode = 2, detailMessage = array_intersect does not support type ARRAY<MAP<VARCHAR(1),TINYINT>>, expression is array_intersect([map('k', 1), map('k', 2), map('k', 3)])
```
パラメータ数が間違っている場合のエラー:

```sql
SELECT array_intersect([1, 2, 3]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'array_intersect' which has 1 arity. Candidate functions are: [array_intersect(Expression, Expression, ...)]
```
非配列型を渡した場合のエラー：

```sql
SELECT array_intersect('not_an_array', [1, 2, 3]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_intersect(VARCHAR(12), ARRAY<INT>)
```
### キーワード

ARRAY, INTERSECT, ARRAY_INTERSECT
