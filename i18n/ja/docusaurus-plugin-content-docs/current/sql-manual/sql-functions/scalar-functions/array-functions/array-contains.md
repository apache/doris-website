---
{
    "title": "ARRAY_CONTAINS",
    "language": "ja",
    "description": "<version since=\"1.2.0\">"
}
---

## array_contains

<version since="1.2.0">


</version>

## 説明

配列に指定した値が含まれているかを判定します。含まれていれば true、含まれていなければ false を返します。配列が NULL の場合は NULL を返します。

## 構文

```sql
array_contains(ARRAY<T> arr, T value)
```

### パラメータ

- `arr`：ARRAY<T> 型。検査対象の配列です。列名または定数値を指定できます。
- `value`：T 型。検索する値です。型は配列の要素型と互換性がある必要があります。

**T でサポートされる型：**
- 数値型：TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE、DECIMAL
- 文字列型：CHAR、VARCHAR、STRING
- 日付時刻型：DATE、DATETIME、DATEV2、DATETIMEV2、TIMESTAMP_NS
- 真偽値型：BOOLEAN
- IP 型：IPV4、IPV6
- UUID：[UUID](../../../basic-element/sql-data-types/uuid.md)

### 戻り値

戻り値の型：BOOLEAN

戻り値の意味：
- true：配列に指定した値が含まれる場合
- false：配列に指定した値が含まれない場合
- NULL：入力配列が NULL の場合

戻り値の動作：

1. 境界条件での動作：
   - 入力配列が空の場合は false を返します
   - 入力配列が NULL の場合は NULL を返します
   - 配列の要素型と検索値の型が一致しない場合は false を返します
   - 配列内の null 要素は通常どおり処理され、配列内の null 要素を検索できます

2. 例外値の動作：
   - 配列の要素がサポートされていない型の場合は、サポート対象外のエラーを返します

3. NULL を返す場合：
   - 入力配列が NULL の場合

**型の互換性ルール：**
1. **数値型の互換性**：
   - 整数型同士を比較できます（TINYINT、SMALLINT、INT、BIGINT、LARGEINT）
   - 浮動小数点型同士を比較できます（FLOAT、DOUBLE）
   - 十進数型同士を比較できます（DECIMAL32、DECIMAL64、DECIMAL128I、DECIMALV2、DECIMAL256）
   - 整数型と浮動小数点型を比較できます
2. **文字列型の互換性**：
   - CHAR、VARCHAR、STRING 型同士を比較できます
3. **日付時刻型の互換性**：
   - DATE と DATEV2 を比較できます
   - DATETIME、DATETIMEV2、TIMESTAMP_NS を比較できます。DATETIME と TIMESTAMP_NS を混在させる場合は、TIMESTAMP_NS を共通の型として使用します。

### 使用例

**テーブル作成例**
```sql
CREATE TABLE array_contains_test (
    id INT,
    int_array ARRAY<INT>,
    string_array ARRAY<STRING>
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 3
PROPERTIES (
    "replication_num" = "1"
);

-- Insert test data
INSERT INTO array_contains_test VALUES
(1, [1000, 2000, 3000], ['apple', 'banana', 'cherry']),
(2, [], []),
(3, NULL, NULL),
(4, [1000, null, 3000], ['apple', null, 'cherry']);
```

**クエリ例：**

配列に特定の整数値が含まれるかを確認します。この例では、5 が int_array に含まれないため false を返します。
```sql
SELECT array_contains(int_array, 5) FROM array_contains_test WHERE id = 1;
+-------------------------------+
| array_contains(int_array, 5)  |
+-------------------------------+
| 0                             |
+-------------------------------+
```

文字列配列に特定の文字列が含まれるかを確認します。この例では、'banana' が string_array に含まれるため true を返します。
```sql
SELECT array_contains(string_array, 'banana') FROM array_contains_test WHERE id = 1;
+------------------------------------------+
| array_contains(string_array, 'banana')   |
+------------------------------------------+
| 1                                        |
+------------------------------------------+
```

空の配列を確認します。この例では、空の配列には値がないため false を返します。
```sql
SELECT array_contains(int_array, 1000) FROM array_contains_test WHERE id = 2;
+----------------------------------+
| array_contains(int_array, 1000)  |
+----------------------------------+
| 0                                |
+----------------------------------+
```

NULL の配列を確認します。この例では NULL を返します。
```sql
SELECT array_contains(int_array, 1000) FROM array_contains_test WHERE id = 3;
+----------------------------------+
| array_contains(int_array, 1000)  |
+----------------------------------+
| NULL                             |
+----------------------------------+
```

配列に null が含まれるかを確認します。
この例では、value_expr パラメータが null で、配列に null 要素がないため false を返します。
```sql
SELECT array_contains([1, 2, 3], null);
+---------------------------------+
| array_contains([1, 2, 3], null) |
+---------------------------------+
|                               0 |
+---------------------------------+
```

配列に null が含まれるかを確認します。
この例では、value_expr パラメータが null で、配列に SQL の null 値が含まれるため true を返します。
```sql
SELECT array_contains([null, 1, 2], null);
+------------------------------------+
| array_contains([null, 1, 2], null) |
+------------------------------------+
|                                  1 |
+------------------------------------+
```

検索値の型が配列の要素型と互換性がない場合は false を返します。
```sql
SELECT array_contains([1, 2, 3], 'string');
+-------------------------------------+
| array_contains([1, 2, 3], 'string') |
+-------------------------------------+
| 0                                   |
+-------------------------------------+
```

検索値の型を配列の要素型に変換できない場合は、エラーを返します。
```sql
SELECT array_contains([1, 2, 3], [4, 5, 6]);
ERROR 1105 (HY000): errCode = 2, detailMessage = can not cast from origin type ARRAY<TINYINT> to target type=TINYINT
```

サポートされていない複合型ではエラーが発生します。この例では、配列が入れ子の配列型であるため、サポート対象外のエラーを返します。
```sql
SELECT array_contains([[1,2],[2,3]], [1,2]);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.6)[RUNTIME_ERROR]execute failed or unsupported types for function array_contains(Array(Nullable(Array(Nullable(TINYINT)))), Array(Nullable(TINYINT)))
```

### 注意事項

性能に関する注意：大きな配列を扱い、性能が重要な場合は、転置インデックスを使ってクエリを高速化できます。ただし、次の使用上の制約があります。

1. 配列に作成する転置インデックスは、トークン化しないインデックスに限られます
2. 配列の要素型 T は、転置インデックスの作成をサポートするデータ型である必要があります
3. クエリ条件のパラメータ T が NULL の場合、インデックスを使った高速化はできません
4. 関数を述語のフィルタ条件として使用する場合にのみ、インデックスによる高速化が行われます

```sql
-- Table creation example
CREATE TABLE `test_array_index` (
    `apply_date` date NULL COMMENT '',
    `id` varchar(60) NOT NULL COMMENT '',
    `inventors` array<text> NULL COMMENT '' -- Add non-tokenized inverted index to array column when creating table
  ) ENGINE=OLAP
  DUPLICATE KEY(`apply_date`, `id`)
  COMMENT 'OLAP'
  DISTRIBUTED BY HASH(`id`) BUCKETS 1
  PROPERTIES (
  "replication_allocation" = "tag.location.default: 1",
  "storage_format" = "V2",
  "light_schema_change" = "true",
  "disable_auto_compaction" = "false"
  );
-- Query example
SELECT id, inventors FROM test_array_index WHERE array_contains(inventors, 'x') ORDER BY id;
```

### キーワード

ARRAY, CONTAIN, CONTAINS, ARRAY_CONTAINS
