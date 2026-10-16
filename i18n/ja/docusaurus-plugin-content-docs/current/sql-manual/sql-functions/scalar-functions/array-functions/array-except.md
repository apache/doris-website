---
{
    "title": "ARRAY_EXCEPT",
    "language": "ja",
    "description": "最初の配列に含まれ、次の配列には含まれない要素を返します。"
}
---

## array_except

<version since="2.0.0">

</version>

## 説明

最初の配列に含まれ、次の配列には含まれない要素を返します。重複を除き、元の順序を保った新しい配列を作成します。

## 構文

```sql
array_except(ARRAY<T> arr1, ARRAY<T> arr2)
```

### パラメータ

- `arr1`：ARRAY<T> 型の最初の配列。
- `arr2`：ARRAY<T> 型の次の配列。

**T でサポートされる型:**
- 数値型: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL
- 文字列型: CHAR, VARCHAR, STRING
- 日付時刻型: DATE, DATETIME, DATEV2, DATETIMEV2, TIMESTAMP_NS
- 真偽値型: BOOLEAN
- IP 型: IPV4, IPV6
- UUID: [UUID](../../../basic-element/sql-data-types/uuid.md)

### 戻り値

戻り値の型: ARRAY<T>

戻り値の内容:
- arr1 に含まれ、arr2 には含まれない要素を重複なく含む新しい配列を返します。要素の順序は arr1 と同じです。
- いずれかの入力配列が NULL の場合は NULL を返します。

使用上の注意:
- 基本型の配列のみをサポートします。複合型 (ARRAY、MAP、STRUCT) はサポートしません。
- 空の配列と任意の配列を組み合わせると、結果は空の配列になります。
- 要素の比較には型の互換性ルールが適用されます。型に互換性がない場合は変換を試み、失敗すると NULL になります。
- 配列内の NULL 要素は演算時に通常の要素として扱われ、NULL 同士は同じ要素と見なされます。

### 使用例

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

整数配列の基本的な差集合:
```sql
SELECT array_except(arr1, arr2) FROM array_except_test WHERE id = 1;
+-----------------------------+
| array_except(arr1, arr2)    |
+-----------------------------+
| [1, 3, 5]                   |
+-----------------------------+
```

一部の要素が重複する場合:
```sql
SELECT array_except(arr1, arr2) FROM array_except_test WHERE id = 2;
+-----------------------------+
| array_except(arr1, arr2)    |
+-----------------------------+
| [10, 20]                    |
+-----------------------------+
```

空の配列と任意の配列を組み合わせる場合:
```sql
SELECT array_except(arr1, arr2) FROM array_except_test WHERE id = 3;
+-----------------------------+
| array_except(arr1, arr2)    |
+-----------------------------+
| []                          |
+-----------------------------+
```

配列が NULL の場合: いずれかの入力配列が NULL なら、エラーを出さずに NULL を返します。
```sql
SELECT array_except(arr1, arr2) FROM array_except_test WHERE id = 4;
+-----------------------------+
| array_except(arr1, arr2)    |
+-----------------------------+
| NULL                        |
+-----------------------------+
```

NULL 値を含む配列:
```sql
SELECT array_except(arr1, arr2) FROM array_except_test WHERE id = 5;
+-----------------------------+
| array_except(arr1, arr2)    |
+-----------------------------+
| [1, 3]                      |
+-----------------------------+
```

次の配列が NULL の場合: いずれかの入力配列が NULL なら、エラーを出さずに NULL を返します。
```sql
SELECT array_except(arr1, arr2) FROM array_except_test WHERE id = 6;
+-----------------------------+
| array_except(arr1, arr2)    |
+-----------------------------+
| NULL                        |
+-----------------------------+
```

次の配列が空の場合:
```sql
SELECT array_except(arr1, arr2) FROM array_except_test WHERE id = 7;
+-----------------------------+
| array_except(arr1, arr2)    |
+-----------------------------+
| [1, 2, 3]                   |
+-----------------------------+
```

両方の配列が空の場合:
```sql
SELECT array_except(arr1, arr2) FROM array_except_test WHERE id = 8;
+-----------------------------+
| array_except(arr1, arr2)    |
+-----------------------------+
| []                          |
+-----------------------------+
```

重複を除去する例:
```sql
SELECT array_except(arr1, arr2) FROM array_except_test WHERE id = 9;
+-----------------------------+
| array_except(arr1, arr2)    |
+-----------------------------+
| [1, 4]                      |
+-----------------------------+
```

すべての要素が除外される場合:
```sql
SELECT array_except(arr1, arr2) FROM array_except_test WHERE id = 10;
+-----------------------------+
| array_except(arr1, arr2)    |
+-----------------------------+
| []                          |
+-----------------------------+
```

文字列配列の差集合:
```sql
SELECT array_except(['a', 'b', 'c', 'd'], ['b', 'd']);
+----------------------------------+
| array_except(['a','b','c','d'],['b','d']) |
+----------------------------------+
| ["a", "c"]                      |
+----------------------------------+
```

### エラーの例

引数の数が正しくない場合:
```sql
SELECT array_except([1, 2, 3]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'array_except' which has 1 arity. Candidate functions are: [array_except(Expression, Expression)]
```

型に互換性がない場合:
```sql
SELECT array_except([1, 2, 3], ['a', 'b']);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_except(ARRAY<INT>, ARRAY<VARCHAR(1)>)
```

配列以外の型を渡した場合:
```sql
SELECT array_except('not_an_array', [1, 2, 3]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_except(VARCHAR(12), ARRAY<INT>)
```

サポートされていない複合型を渡した場合:
```sql
SELECT array_except([[1,2],[3,4]], [[3,4]]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_except(ARRAY<ARRAY<INT>>, ARRAY<ARRAY<INT>>)
```

### キーワード

ARRAY, EXCEPT, ARRAY_EXCEPT
