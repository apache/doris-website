---
{
    "title": "ARRAY_COUNT",
    "language": "ja",
    
}
---

## array_count

<version since="2.0.0">

</version>

## 説明

配列の要素にラムダ式を適用し、戻り値が 0 でない要素の数を返します。

## 構文

```sql
array_count(lambda, array1, ...)
```

### パラメータ

- `lambda`：配列の要素を評価して計算するラムダ式
- `array1, ...`：一つ以上の ARRAY\<T> 型の引数

**T がサポートする型：**
- 数値型：TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE、DECIMAL
- 文字列型：CHAR、VARCHAR、STRING
- 日付・時刻型：DATE、DATETIME、DATEV2、DATETIMEV2、TIMESTAMP_NS
- 真偽値型：BOOLEAN
- IP 型：IPV4、IPV6
- UUID：[UUID](../../../basic-element/sql-data-types/uuid.md)
- 複合データ型：ARRAY、MAP、STRUCT

### 戻り値

戻り値の型：BIGINT

戻り値の意味：
- ラムダ式の結果が真である要素の数を返します
- 0：条件を満たす要素がない場合、または入力配列が NULL の場合

使用上の注意：
- ラムダ式の引数の数は、配列引数の数と一致する必要があります
- すべての入力配列は同じ長さである必要があります
- 複数の配列や複合型の配列を対象にカウントできます
- 空の配列は 0、NULL 配列も 0 を返します
- ラムダ式からほかの高階関数を呼び出せますが、戻り値の型に互換性が必要です
- 配列要素が NULL の場合、その要素も処理のためにラムダ式に渡されます。ラムダ式で NULL 値を評価できます

### 例

```sql
CREATE TABLE array_count_test (
    id INT,
    int_array ARRAY<INT>,
    double_array ARRAY<DOUBLE>,
    string_array ARRAY<STRING>
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 3
PROPERTIES (
    "replication_num" = "1"
);

INSERT INTO array_count_test VALUES
(1, [1, 2, 3, 4, 5], [1.1, 2.2, 3.3, 4.4, 5.5], ['a', 'bb', 'ccc', 'dddd', 'eeeee']),
(2, [1, null, 3, null, 5], [1.1, null, 3.3, null, 5.5], ['a', null, 'ccc', null, 'eeeee']),
(3, [], [], []),
(4, NULL, NULL, NULL);
```

**クエリ例：**

int_array の 2 より大きい要素を数える：
```sql
SELECT array_count(x -> x > 2, int_array) FROM array_count_test WHERE id = 1;
+-------------------------------------+
| array_count(x -> x > 2, int_array)  |
+-------------------------------------+
|                                   3 |
+-------------------------------------+
```

double_array の 3 以上の要素を数える：
```sql
SELECT array_count(x -> x >= 3, double_array) FROM array_count_test WHERE id = 1;
+------------------------------------------+
| array_count(x -> x >= 3, double_array)   |
+------------------------------------------+
|                                        3 |
+------------------------------------------+
```

string_array の長さが 2 より大きい要素を数える：
```sql
SELECT array_count(x -> length(x) > 2, string_array) FROM array_count_test WHERE id = 1;
+--------------------------------------------------+
| array_count(x -> length(x) > 2, string_array)    |
+--------------------------------------------------+
|                                              3   |
+--------------------------------------------------+
```

空の配列の場合：
```sql
SELECT array_count(x -> x > 0, int_array) FROM array_count_test WHERE id = 3;
+-------------------------------------+
| array_count(x -> x > 0, int_array)  |
+-------------------------------------+
|                                   0 |
+-------------------------------------+
```

NULL 配列の場合：
```sql
SELECT array_count(x -> x > 0, int_array) FROM array_count_test WHERE id = 4;
+-------------------------------------+
| array_count(x -> x > 0, int_array)  |
+-------------------------------------+
|                                   0 |
+-------------------------------------+
```

NULL 値を含む配列で NULL 要素を数える：
```sql
SELECT array_count(x -> x is null, int_array) FROM array_count_test WHERE id = 2;
+------------------------------------------+
| array_count(x -> x is null, int_array)   |
+------------------------------------------+
|                                        2 |
+------------------------------------------+
```

NULL 値を含む配列で NULL 以外の要素を数える：
```sql
SELECT array_count(x -> x is not null, int_array) FROM array_count_test WHERE id = 2;
+----------------------------------------------+
| array_count(x -> x is not null, int_array)   |
+----------------------------------------------+
|                                            3 |
+----------------------------------------------+
```

複数の配列引数を使用する例：
```sql
SELECT array_count((x, y) -> x > y, [1, 2, 3], [0, 3, 2]);
+--------------------------------------------------+
| array_count((x, y) -> x > y, [1, 2, 3], [0, 3, 2]) |
+--------------------------------------------------+
|                                              2   |
+--------------------------------------------------+
```

複合型の例：要素が 2 個より多い配列を数える：
```sql
SELECT array_count(x -> array_size(x) > 2, [[1,2],[1,2,3],[4,5,6,7]]);
+----------------------------------------------------------------+
| array_count(x -> array_size(x) > 2, [[1,2],[1,2,3],[4,5,6,7]]) |
+----------------------------------------------------------------+
|                                                              2 |
+----------------------------------------------------------------+
```

高階関数をネストする場合：`array_count` では、ラムダ式の本体が BOOLEAN にキャスト可能なスカラー値を返す必要があります。内側の `array_exists` が真偽値の ARRAY（内側の各要素に対して一つずつ）を返すと、`array_count` はそれを受け取れず、シグネチャエラーを報告します：

```sql
SELECT array_count(x -> array_exists(y -> y > 5, x), [[1,2,3],[4,5,6],[7,8,9]]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_count(ARRAY<ARRAY<BOOLEAN>>)
```

5 より大きい要素を *一つでも* 含む外側の配列を数えるには、内側の判定を囲み、ラムダ式がスカラーの BOOLEAN を返すようにします。たとえば `size(array_filter(y -> y > 5, x)) > 0` を使用します：

```sql
SELECT array_count(x -> size(array_filter(y -> y > 5, x)) > 0, [[1,2,3],[4,5,6],[7,8,9]]);
+----------------------------------------------------------------------------------+
| array_count(x -> size(array_filter(y -> y > 5, x)) > 0, [[1,2,3],[4,5,6],[7,8,9]]) |
+----------------------------------------------------------------------------------+
|                                                                                2 |
+----------------------------------------------------------------------------------+
```

配列リテラルの例：
```sql
SELECT array_count(x -> x % 2 = 0, [1, 2, 3, 4, 5, 6]);
+------------------------------------------+
| array_count(x -> x % 2 = 0, [1, 2, 3, 4, 5, 6]) |
+------------------------------------------+
|                                        3 |
+------------------------------------------+
```

### キーワード

ARRAY, COUNT, ARRAY_COUNT
