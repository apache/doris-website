---
{
    "title": "ARRAY_EXCEPT",
    "language": "ja",
    "description": "最初の配列に存在し、もう一方の配列には存在しない要素を返します。",
}
---

## array_except

<version since="2.0.0">

</version>

## 説明

最初の配列に存在し、もう一方の配列には存在しない要素を返します。重複を除去し、元の順序を維持した新しい配列を生成します。

## 構文

```sql
array_except(ARRAY<T> arr1, ARRAY<T> arr2)
```

### パラメータ

- `arr1`：ARRAY<T> 型。最初の配列。
- `arr2`：ARRAY<T> 型。後者の配列。

**T でサポートされる型：**
- 数値型：TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE、DECIMAL
- 文字列型：CHAR、VARCHAR、STRING
- 日付・時刻型：DATE、DATETIME、DATEV2、DATETIMEV2
- 真偽値型：BOOLEAN
- IP 型：IPV4、IPV6

### 戻り値

戻り値の型：ARRAY<T>

戻り値の意味：
- arr1 に存在し、arr2 には存在しない一意の要素を、arr1 と同じ順序で格納した新しい配列を返します。
- いずれかの入力配列が NULL の場合は NULL を返します。

使用上の注意：
- 基本型の配列のみをサポートし、複合型（ARRAY、MAP、STRUCT）はサポートしません。
- 空の配列と任意の配列を演算すると、結果は空の配列になります。
- 要素の比較には型の互換性ルールが適用されます。型に互換性がない場合は変換を試み、失敗すると NULL になります。
- 配列内の NULL 要素は通常の要素として扱われ、NULL 同士は同じ要素とみなされます。

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

**クエリ例：**

整数配列の基本的な差分：
```sql
SELECT array_except(arr1, arr2) FROM array_except_test WHERE id = 1;
+-----------------------------+
| array_except(arr1, arr2)    |
+-----------------------------+
| [1, 3, 5]                   |
+-----------------------------+
```

要素が一部重複する場合：
```sql
SELECT array_except(arr1, arr2) FROM array_except_test WHERE id = 2;
+-----------------------------+
| array_except(arr1, arr2)    |
+-----------------------------+
| [10, 20]                    |
+-----------------------------+
```

空の配列と任意の配列：
```sql
SELECT array_except(arr1, arr2) FROM array_except_test WHERE id = 3;
+-----------------------------+
| array_except(arr1, arr2)    |
+-----------------------------+
| []                          |
+-----------------------------+
```

配列が NULL の場合：いずれかの入力配列が NULL なら、エラーを発生させずに NULL を返します。
```sql
SELECT array_except(arr1, arr2) FROM array_except_test WHERE id = 4;
+-----------------------------+
| array_except(arr1, arr2)    |
+-----------------------------+
| NULL                        |
+-----------------------------+
```

NULL 要素を含む配列：
```sql
SELECT array_except(arr1, arr2) FROM array_except_test WHERE id = 5;
+-----------------------------+
| array_except(arr1, arr2)    |
+-----------------------------+
| [1, 3]                      |
+-----------------------------+
```

後者の配列が NULL の場合：いずれかの入力配列が NULL なら、エラーを発生させずに NULL を返します。
```sql
SELECT array_except(arr1, arr2) FROM array_except_test WHERE id = 6;
+-----------------------------+
| array_except(arr1, arr2)    |
+-----------------------------+
| NULL                        |
+-----------------------------+
```

後者の配列が空の場合：
```sql
SELECT array_except(arr1, arr2) FROM array_except_test WHERE id = 7;
+-----------------------------+
| array_except(arr1, arr2)    |
+-----------------------------+
| [1, 2, 3]                   |
+-----------------------------+
```

両方の配列が空の場合：
```sql
SELECT array_except(arr1, arr2) FROM array_except_test WHERE id = 8;
+-----------------------------+
| array_except(arr1, arr2)    |
+-----------------------------+
| []                          |
+-----------------------------+
```

重複除去の例：
```sql
SELECT array_except(arr1, arr2) FROM array_except_test WHERE id = 9;
+-----------------------------+
| array_except(arr1, arr2)    |
+-----------------------------+
| [1, 4]                      |
+-----------------------------+
```

すべての要素が除外される場合：
```sql
SELECT array_except(arr1, arr2) FROM array_except_test WHERE id = 10;
+-----------------------------+
| array_except(arr1, arr2)    |
+-----------------------------+
| []                          |
+-----------------------------+
```

文字列配列の差分：
```sql
SELECT array_except(['a', 'b', 'c', 'd'], ['b', 'd']);
+----------------------------------+
| array_except(['a','b','c','d'],['b','d']) |
+----------------------------------+
| ["a", "c"]                      |
+----------------------------------+
```

### エラーの例

パラメータの数が正しくない場合：
```sql
SELECT array_except([1, 2, 3]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'array_except' which has 1 arity. Candidate functions are: [array_except(Expression, Expression)]
```

互換性のない型：
```sql
SELECT array_except([1, 2, 3], ['a', 'b']);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_except(ARRAY<INT>, ARRAY<VARCHAR(1)>)
```

配列以外の型を渡した場合：
```sql
SELECT array_except('not_an_array', [1, 2, 3]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_except(VARCHAR(12), ARRAY<INT>)
```

複合型はサポートされません：
```sql
SELECT array_except([[1,2],[3,4]], [[3,4]]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_except(ARRAY<ARRAY<INT>>, ARRAY<ARRAY<INT>>)
```

### キーワード

ARRAY, EXCEPT, ARRAY_EXCEPT 
