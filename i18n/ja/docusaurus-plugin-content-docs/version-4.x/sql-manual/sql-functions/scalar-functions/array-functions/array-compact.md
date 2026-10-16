---
{
    "title": "ARRAY_COMPACT",
    "language": "ja",
    "description": "配列内で連続する重複要素を削除し、同じ値が連続する部分では最初の要素だけを残します。"
}
---

## array_compact

<version since="2.0.0">


</version>

## 説明

配列内で連続する重複要素を削除し、同じ値が連続する部分では最初の要素だけを残します。配列を左から右へ走査し、直前の要素と同じ要素をスキップします。

## 構文

```sql
array_compact(ARRAY<T> arr)
```

### パラメータ

- `arr`：ARRAY<T> 型の配列。重複要素を削除する対象です。カラム名または定数値を指定できます。

**T でサポートされる型：**
- 数値型：TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE、DECIMAL
- 文字列型：CHAR、VARCHAR、STRING
- 日付・時刻型：DATE、DATETIME、DATEV2、DATETIMEV2
- 真偽値型：BOOLEAN
- IP 型：IPV4、IPV6
- 複合データ型：ARRAY

### 戻り値

戻り値の型：ARRAY\<T>

戻り値の意味：
- 連続する重複要素を削除し、各連続部分の最初の要素だけを残した配列
- NULL：入力配列が NULL の場合

戻り値の動作：

1. 通常の重複削除：
   - 配列を左から右へ走査し、各要素を残します。ただし、直前の要素と同じ要素が連続する場合はスキップします
   - 連続する重複要素だけを削除します。離れた位置にある重複要素は残ります
   - null 値は残ります（null と null は同じ値として扱います）

2. 境界条件での動作：
   - 入力配列が空の場合、空の配列を返します
   - 入力配列が NULL の場合、NULL を返します
   - 配列に要素が一つしかない場合、元の配列を返します

使用上の注意：

- 配列要素の元の順序を維持します
- 連続する重複要素だけを削除します。配列全体の重複要素は削除しません
- map、struct は重複削除ロジックをサポートしていません
- 配列内の null 要素も通常どおり処理します。連続する複数の null 要素は一つにまとめられます

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

**クエリの例：**

string_array 内の連続する重複要素を削除します。隣接する 'a' または 'b' だけが削除され、'c' は残ります。
```sql
SELECT array_compact(string_array) FROM array_compact_test WHERE id = 1;
+-----------------------------+
| array_compact(string_array) |
+-----------------------------+
| ["a", "b", "c"]             |
+-----------------------------+
```

離れた位置にある重複要素は削除されず、元の順序と内容が維持されます。
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

ネストした配列型で、連続する重複要素を削除します。隣接する完全に同一の部分配列だけが削除され、離れた位置にあるものは削除されません。
```sql
SELECT array_compact([[1,2],[1,2],[3,4],[3,4]]);
+------------------------------------------+
| array_compact([[1,2],[1,2],[3,4],[3,4]]) |
+------------------------------------------+
| [[1,2],[3,4]]                            |
+------------------------------------------+
```

空の配列に対しては空の配列を返します：
```sql
SELECT array_compact(int_array) FROM array_compact_test WHERE id = 4;
+----------------------+
| array_compact(int_array) |
+----------------------+
| []                   |
+----------------------+
```

NULL の配列に対しては NULL を返します：
```sql
SELECT array_compact(int_array) FROM array_compact_test WHERE id = 5;
+----------------------+
| array_compact(int_array) |
+----------------------+
| NULL                 |
+----------------------+
```

要素が一つしかない配列に対しては、元の配列を返します：
```sql
SELECT array_compact([42]);
+----------------------+
| array_compact([42])  |
+----------------------+
| [42]                 |
+----------------------+
```

複数のパラメータを渡すとエラーになります。
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
