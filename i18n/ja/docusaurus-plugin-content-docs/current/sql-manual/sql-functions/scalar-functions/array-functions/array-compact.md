---
{
    "title": "ARRAY_COMPACT",
    "language": "ja",
    "description": "配列内で連続する重複要素を取り除き、同じ値が連続する部分の最初の要素だけを残します。"
}
---

## array_compact

<version since="2.0.0">


</version>

## 機能

配列内で連続する重複要素を取り除き、同じ値が連続する部分の最初の要素だけを残します。この関数は配列を左から右に走査し、直前の要素と同じ要素をスキップします。

## 構文

```sql
array_compact(ARRAY<T> arr)
```

### パラメータ

- `arr`：ARRAY<T> 型。重複を除去する配列です。列名または定数値を指定できます。

**T でサポートされる型：**
- 数値型：TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE、DECIMAL
- 文字列型：CHAR、VARCHAR、STRING
- 日付時刻型：DATE、DATETIME、DATEV2、DATETIMEV2、TIMESTAMP_NS
- 真偽値型：BOOLEAN
- IP 型：IPV4、IPV6
- UUID：[UUID](../../../basic-element/sql-data-types/uuid.md)
- 複合データ型：ARRAY

### 戻り値

戻り値の型：ARRAY\<T>

戻り値の意味：
- 連続する重複要素を取り除き、同じ値が連続する部分の最初の要素だけを残した配列
- 入力配列が NULL の場合は NULL

戻り値の動作：

1. 通常の重複除去：
   - 配列を左から右に走査し、各要素を残します。ただし、直前の要素と同じ要素はスキップします
   - 連続する重複要素だけを取り除きます。連続していない重複要素は残ります
   - null 値は残ります（null 同士は同じ値とみなされます）

2. 境界条件での動作：
   - 入力配列が空の場合は、空の配列を返します
   - 入力配列が NULL の場合は、NULL を返します
   - 配列に要素が一つしかない場合は、元の配列を返します

使用上の注意：

- この関数は配列要素の元の順序を維持します
- 連続する重複要素だけを取り除き、配列全体の重複除去は行いません
- map と struct は重複除去の対象としてサポートされません
- 配列内の null 要素も通常の要素と同様に処理され、連続する複数の null 要素は一つにまとめられます

### 使用例

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

**クエリの例：**

string_array 内で連続する重複要素を除去します。隣接する 'a' または 'b' の重複だけが取り除かれ、'c' は残ります。
```sql
SELECT array_compact(string_array) FROM array_compact_test WHERE id = 1;
+-----------------------------+
| array_compact(string_array) |
+-----------------------------+
| ["a", "b", "c"]             |
+-----------------------------+
```

連続していない重複要素は取り除かれず、元の順序と内容が維持されます。
```sql
SELECT array_compact(int_array) FROM array_compact_test WHERE id = 2;
+-------------------------------+
| array_compact(int_array)      |
+-------------------------------+
| [1, 2, 3, 1, 2, 3]            |
+-------------------------------+
```

null 値を含む配列では、連続する null は一つだけ残ります。null は通常の値として扱われ、離れた位置にある null はまとめられません。
```sql
SELECT array_compact(int_array) FROM array_compact_test WHERE id = 3;
+------------------------------------------+
| array_compact(int_array)                 |
+------------------------------------------+
| [1, null, 2, null, 3]                    |
+------------------------------------------+
```

複合型の例：

ネストされた配列型で、連続する重複要素を除去します。隣接する完全に同一の部分配列だけが取り除かれ、連続していないものは残ります。
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

NULL の配列は NULL を返します：
```sql
SELECT array_compact(int_array) FROM array_compact_test WHERE id = 5;
+----------------------+
| array_compact(int_array) |
+----------------------+
| NULL                 |
+----------------------+
```

要素が一つだけの配列は元の配列を返します：
```sql
SELECT array_compact([42]);
+----------------------+
| array_compact([42])  |
+----------------------+
| [42]                 |
+----------------------+
```

複数の引数を渡すとエラーになります。
```sql
SELECT array_compact([1,2,3],[4,5,6]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'array_compact' which has 2 arity. Candidate functions are: [array_compact(Expression)]
```

配列以外の型を渡すとエラーになります。
```sql
SELECT array_compact('not_an_array');
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_compact(VARCHAR(12))
```

### キーワード

ARRAY, COMPACT, ARRAY_COMPACT
