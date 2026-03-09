---
{
  "title": "ARRAY_EXCEPT",
  "language": "ja",
  "description": "最初の配列には存在するが2番目の配列には存在しない要素を返します。"
}
---
## array_except

<version since="2.0.0">

</version>

## 説明

最初の配列に存在するが2番目の配列には存在しない要素を返し、元の順序を保持しながら重複を除去して新しい配列を形成します。

## 構文

```sql
array_except(ARRAY<T> arr1, ARRAY<T> arr2)
```
### パラメータ

- `arr1`：ARRAY<T> 型、最初の配列。
- `arr2`：ARRAY<T> 型、2番目の配列。

**T サポート対象の型：**
- 数値型：TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE、DECIMAL
- 文字列型：CHAR、VARCHAR、STRING
- 日付・時刻型：DATE、DATETIME、DATEV2、DATETIMEV2
- 真偽値型：BOOLEAN
- IP型：IPV4、IPV6

### 戻り値

戻り値の型：ARRAY<T>

戻り値の意味：
- arr1には存在するがarr2には存在しない一意な要素をすべて含む新しい配列を返し、arr1と同じ順序を維持します。
- NULL：いずれかの入力配列がNULLの場合。

使用上の注意：
- 基本型の配列のみをサポートし、複合型（ARRAY、MAP、STRUCT）はサポートしません。
- 空の配列と任意の配列の演算結果は空の配列になります。
- 要素の比較は型互換性ルールに従い、型が互換性がない場合は変換を試行し、失敗した場合はnullになります。
- 配列要素内のnull値について：null要素は演算において通常の要素として扱われ、nullとnullは同じものと見なされます

### 例

```sql
CREATE TABLE array_except_test (
    id INT,
    arr1 ARRAY<INT>,
    arr2 ARRAY<INT>,
    str_arr1 ARRAY<STRING>,
    str_arr2 ARRAY<STRING>
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 3
PROPERTIES (
    "replication_num" = "1"
);

INSERT INTO array_except_test VALUES
(1, [1, 2, 3, 4, 5], [2, 4]),
(2, [10, 20, 30], [30, 40]),
(3, [], [1, 2]),
(4, NULL, [1, 2]),
(5, [1, null, 2, null, 3], [null, 2]),
(6, [1, 2, 3], NULL),
(7, [1, 2, 3], []),
(8, [], []),
(9, [1, 2, 2, 3, 3, 3, 4, 5, 5], [2, 3, 5]),
(10, [1], [1]);
```
**クエリの例:**

基本的な整数配列の except:

```sql
SELECT array_except(arr1, arr2) FROM array_except_test WHERE id = 1;
+-----------------------------+
| array_except(arr1, arr2)    |
+-----------------------------+
| [1, 3, 5]                   |
+-----------------------------+
```
部分的な要素の重複:

```sql
SELECT array_except(arr1, arr2) FROM array_except_test WHERE id = 2;
+-----------------------------+
| array_except(arr1, arr2)    |
+-----------------------------+
| [10, 20]                    |
+-----------------------------+
```
任意の配列を持つ空の配列：

```sql
SELECT array_except(arr1, arr2) FROM array_except_test WHERE id = 3;
+-----------------------------+
| array_except(arr1, arr2)    |
+-----------------------------+
| []                          |
+-----------------------------+
```
NULL配列：いずれかの入力配列がNULLの場合、エラーをスローすることなくNULLを返します。

```sql
SELECT array_except(arr1, arr2) FROM array_except_test WHERE id = 4;
+-----------------------------+
| array_except(arr1, arr2)    |
+-----------------------------+
| NULL                        |
+-----------------------------+
```
null値を含む配列:

```sql
SELECT array_except(arr1, arr2) FROM array_except_test WHERE id = 5;
+-----------------------------+
| array_except(arr1, arr2)    |
+-----------------------------+
| [1, 3]                      |
+-----------------------------+
```
2番目の配列がNULLです：エラーを発生させることなく、いずれかの入力配列がNULLの場合にNULLを返します。

```sql
SELECT array_except(arr1, arr2) FROM array_except_test WHERE id = 6;
+-----------------------------+
| array_except(arr1, arr2)    |
+-----------------------------+
| NULL                        |
+-----------------------------+
```
2番目の配列は空です：

```sql
SELECT array_except(arr1, arr2) FROM array_except_test WHERE id = 7;
+-----------------------------+
| array_except(arr1, arr2)    |
+-----------------------------+
| [1, 2, 3]                   |
+-----------------------------+
```
両方の配列が空です：

```sql
SELECT array_except(arr1, arr2) FROM array_except_test WHERE id = 8;
+-----------------------------+
| array_except(arr1, arr2)    |
+-----------------------------+
| []                          |
+-----------------------------+
```
重複排除の例:

```sql
SELECT array_except(arr1, arr2) FROM array_except_test WHERE id = 9;
+-----------------------------+
| array_except(arr1, arr2)    |
+-----------------------------+
| [1, 4]                      |
+-----------------------------+
```
全ての要素が除外されます：

```sql
SELECT array_except(arr1, arr2) FROM array_except_test WHERE id = 10;
+-----------------------------+
| array_except(arr1, arr2)    |
+-----------------------------+
| []                          |
+-----------------------------+
```
String配列を除く:

```sql
SELECT array_except(['a', 'b', 'c', 'd'], ['b', 'd']);
+----------------------------------+
| array_except(['a','b','c','d'],['b','d']) |
+----------------------------------+
| ["a", "c"]                      |
+----------------------------------+
```
### 例外の例

パラメータ数が正しくない場合:

```sql
SELECT array_except([1, 2, 3]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'array_except' which has 1 arity. Candidate functions are: [array_except(Expression, Expression)]
```
互換性のない型:

```sql
SELECT array_except([1, 2, 3], ['a', 'b']);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_except(ARRAY<INT>, ARRAY<VARCHAR(1)>)
```
非配列型の受け渡し:

```sql
SELECT array_except('not_an_array', [1, 2, 3]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_except(VARCHAR(12), ARRAY<INT>)
```
複合型はサポートされていません:

```sql
SELECT array_except([[1,2],[3,4]], [[3,4]]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_except(ARRAY<ARRAY<INT>>, ARRAY<ARRAY<INT>>)
```
### キーワード

ARRAY, EXCEPT, ARRAY_EXCEPT
