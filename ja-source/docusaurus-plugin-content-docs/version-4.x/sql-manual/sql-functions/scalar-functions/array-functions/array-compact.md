---
{
  "title": "ARRAY_COMPACT",
  "language": "ja"
}
---
## array_compact

<version since="2.0.0">


</version>

## 説明

配列から連続する重複要素を削除し、異なる値の最初の出現のみを保持します。この関数は配列を左から右へ走査し、前の要素と同じ要素をスキップして、各値の最初の出現のみを保持します。

## 構文

```sql
array_compact(ARRAY<T> arr)
```
### パラメータ

- `arr`：ARRAY<T>型、重複除去を行う配列。列名または定数値をサポートします。

**Tサポート型:**
- 数値型: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL
- 文字列型: CHAR, VARCHAR, STRING
- 日付時刻型: DATE, DATETIME, DATEV2, DATETIMEV2
- ブール型: BOOLEAN
- IP型: IPV4, IPV6
- 複合データ型: ARRAY

### 戻り値

戻り値の型: ARRAY\<T>

戻り値の意味:
- 重複除去された配列、連続する重複要素の最初の出現のみを保持
- NULL: 入力配列がNULLの場合

戻り値の動作説明:

1. 通常の重複除去動作:
   - 配列を左から右へ走査し、各要素の最初の出現を保持し、前の要素と同じ連続する要素をスキップ
   - 連続する重複要素のみを削除し、非連続の重複要素は保持される
   - null値を保持（nullとnullは同じと見なす）

2. 境界条件の動作:
   - 入力配列が空の場合、空の配列を返す
   - 入力配列がNULLの場合、NULLを返す
   - 配列に要素が1つのみの場合、元の配列を返す

使用上の注意:

- この関数は配列要素の元の順序を維持します
- 連続する重複要素のみを削除し、グローバルな重複除去は行いません
- map、structは重複除去ロジックをサポートしません
- 配列要素内のnull値について: null要素は正常に処理され、連続する複数のnull要素は1つにマージされます

### 例

```sql
CREATE TABLE array_compact_test (
    id INT,
    int_array ARRAY<INT>,
    string_array ARRAY<STRING>
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 3
PROPERTIES (
    "replication_num" = "1"
);

INSERT INTO array_compact_test VALUES
(1, [1, 1, 2, 2, 2, 3, 1, 4], ['a', 'a', 'b', 'b', 'c']),
(2, [1, 2, 3, 1, 2, 3], ['a', 'b', 'a', 'b']),
(3, [1, null, null, 2, null, null, 3], ['a', null, null, 'b']),
(4, [], []),
(5, NULL, NULL);
```
**クエリの例:**

string_array内の連続する重複の除去: 隣接する'a'または'b'のみが除去され、'c'は保持されます。

```sql
SELECT array_compact(string_array) FROM array_compact_test WHERE id = 1;
+-----------------------------+
| array_compact(string_array) |
+-----------------------------+
| ["a", "b", "c"]             |
+-----------------------------+
```
連続しない重複要素は削除されず、元の順序と内容が保持されます。

```sql
SELECT array_compact(int_array) FROM array_compact_test WHERE id = 2;
+-------------------------------+
| array_compact(int_array)      |
+-------------------------------+
| [1, 2, 3, 1, 2, 3]            |
+-------------------------------+
```
null値を含む配列で、連続するnullは1つのみ保持：nullは通常の値として扱われ、連続するnullは1つのみ保持され、連続しないnullはマージされません。

```sql
SELECT array_compact(int_array) FROM array_compact_test WHERE id = 3;
+------------------------------------------+
| array_compact(int_array)                 |
+------------------------------------------+
| [1, null, 2, null, 3]                    |
+------------------------------------------+
```
複合型の例：

ネストした配列型の連続する重複の削除。隣接する完全に同一のサブ配列のみが削除され、連続していないものは削除されません。

```sql
SELECT array_compact([[1,2],[1,2],[3,4],[3,4]]);
+------------------------------------------+
| array_compact([[1,2],[1,2],[3,4],[3,4]]) |
+------------------------------------------+
| [[1,2],[3,4]]                            |
+------------------------------------------+
```
空の配列は空の配列を返します：

```sql
SELECT array_compact(int_array) FROM array_compact_test WHERE id = 4;
+----------------------+
| array_compact(int_array) |
+----------------------+
| []                   |
+----------------------+
```
NULL配列はNULLを返します:

```sql
SELECT array_compact(int_array) FROM array_compact_test WHERE id = 5;
+----------------------+
| array_compact(int_array) |
+----------------------+
| NULL                 |
+----------------------+
```
要素が1つだけの配列は元の配列を返します：

```sql
SELECT array_compact([42]);
+----------------------+
| array_compact([42])  |
+----------------------+
| [42]                 |
+----------------------+
```
複数のパラメータを渡すとエラーが発生します。

```sql
SELECT array_compact([1,2,3],[4,5,6]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'array_compact' which has 2 arity. Candidate functions are: [array_compact(Expression)]
```
非配列型を渡すとエラーが発生します。

```sql
SELECT array_compact('not_an_array');
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_compact(VARCHAR(12))
```
### キーワード

ARRAY, COMPACT, ARRAY_COMPACT
