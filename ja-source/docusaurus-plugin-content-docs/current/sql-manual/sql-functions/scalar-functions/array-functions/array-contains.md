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

配列が指定された値を含むかどうかを確認します。見つかった場合はtrueを、そうでなければfalseを返します。配列がNULLの場合、NULLを返します。

## 構文

```sql
array_contains(ARRAY<T> arr, T value)
```
### パラメータ

- `arr`：ARRAY<T>型、チェックする配列。カラム名または定数値をサポートします。
- `value`：T型、検索する値。配列要素型と互換性のある型である必要があります。

**Tでサポートされる型：**
- 数値型：TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE、DECIMAL
- 文字列型：CHAR、VARCHAR、STRING
- 日付・時刻型：DATE、DATETIME、DATEV2、DATETIMEV2
- 真偽値型：BOOLEAN
- IP型：IPV4、IPV6

### 戻り値

戻り値の型：BOOLEAN

戻り値の意味：
- true：配列に指定した値が含まれている場合
- false：配列に指定した値が含まれていない場合
- NULL：入力配列がNULLの場合

戻り値の動作説明：

1. 境界条件の動作：
   - 入力配列が空の場合、falseを返します
   - 入力配列がNULLの場合、NULLを返します
   - 配列要素型が検索値型と一致しない場合、falseを返します
   - 配列要素のnull値について：null要素は正常に処理され、配列内のnull要素を検索できます

2. 例外値の動作：
   - 配列要素がサポートされていない型の場合、サポートされていないエラーを返します

3. NULLを返すケース：
   - 入力配列がNULLの場合

**型互換性ルール：**
1. **数値型の互換性**：
   - 整数型同士で比較可能（TINYINT、SMALLINT、INT、BIGINT、LARGEINT）
   - 浮動小数点型同士で比較可能（FLOAT、DOUBLE）
   - DECIMAL型同士で比較可能（DECIMAL32、DECIMAL64、DECIMAL128I、DECIMALV2、DECIMAL256）
   - 整数と浮動小数点数で相互比較可能
2. **文字列型の互換性**：
   - CHAR、VARCHAR、STRING型で相互比較可能
3. **日付・時刻型の互換性**：
   - DATEとDATEV2で相互比較可能
   - DATETIMEとDATETIMEV2で相互比較可能

### 例

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
**クエリの例:**

配列に特定の整数値が含まれているかを確認する: この例では、int_arrayに5が含まれていないため、falseを返します。

```sql
SELECT array_contains(int_array, 5) FROM array_contains_test WHERE id = 1;
+-------------------------------+
| array_contains(int_array, 5)  |
+-------------------------------+
| 0                             |
+-------------------------------+
```
文字列配列に特定の文字列が含まれているかを確認する：この例では、string_arrayに'banana'が含まれているためtrueを返します。

```sql
SELECT array_contains(string_array, 'banana') FROM array_contains_test WHERE id = 1;
+------------------------------------------+
| array_contains(string_array, 'banana')   |
+------------------------------------------+
| 1                                        |
+------------------------------------------+
```
現在は空の配列です。この例では、空の配列に値がないためfalseを返します。

```sql
SELECT array_contains(int_array, 1000) FROM array_contains_test WHERE id = 2;
+----------------------------------+
| array_contains(int_array, 1000)  |
+----------------------------------+
| 0                                |
+----------------------------------+
```
現在これはNULL配列であり、この例はNULLを返します。

```sql
SELECT array_contains(int_array, 1000) FROM array_contains_test WHERE id = 3;
+----------------------------------+
| array_contains(int_array, 1000)  |
+----------------------------------+
| NULL                             |
+----------------------------------+
```
配列にnullが含まれているかどうかを確認する
この例では、value_exprパラメータがnullであり、配列にnull要素が存在しないため、falseを返します。

```sql
SELECT array_contains([1, 2, 3], null);
+---------------------------------+
| array_contains([1, 2, 3], null) |
+---------------------------------+
|                               0 |
+---------------------------------+
```
配列にnullが含まれているかチェックする
この例では、value_exprパラメータがnullで、配列にSQL null値が含まれているため、trueを返します。

```sql
SELECT array_contains([null, 1, 2], null);
+------------------------------------+
| array_contains([null, 1, 2], null) |
+------------------------------------+
|                                  1 |
+------------------------------------+
```
検索値の型が配列要素の型と互換性がない場合、falseを返します。

```sql
SELECT array_contains([1, 2, 3], 'string');
+-------------------------------------+
| array_contains([1, 2, 3], 'string') |
+-------------------------------------+
| 0                                   |
+-------------------------------------+
```
検索値の型が配列要素と型変換できない場合、エラーが返されます

```sql
SELECT array_contains([1, 2, 3], [4, 5, 6]);
ERROR 1105 (HY000): errCode = 2, detailMessage = can not cast from origin type ARRAY<TINYINT> to target type=TINYINT
```
サポートされていない複合型はエラーをスローします。この例では、配列はネストした配列型であり、サポートされていないエラーを返します。

```sql
SELECT array_contains([[1,2],[2,3]], [1,2]);
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.6)[RUNTIME_ERROR]execute failed or unsupported types for function array_contains(Array(Nullable(Array(Nullable(TINYINT)))), Array(Nullable(TINYINT)))
```
### 注意事項

パフォーマンスに関する考慮事項：大きな配列を扱う場合、パフォーマンスが主要な懸念事項である場合は、クエリを高速化するために転置インデックスを使用できますが、注意すべき使用制限があります：

1. 配列の転置インデックスを作成するプロパティは、トークン化されていないインデックスのみ可能です
2. 配列の要素型Tは、転置インデックスの作成をサポートするデータ型である必要があります
3. クエリ条件パラメータTがNULLの場合、インデックスを高速化に使用できません
4. インデックス高速化は、この関数が述語フィルタ条件として使用される場合にのみ発生します

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
  "is_being_synced" = "false",
  "storage_format" = "V2",
  "light_schema_change" = "true",
  "disable_auto_compaction" = "false",
  "enable_single_replica_compaction" = "false"
  );
-- Query example
SELECT id, inventors FROM test_array_index WHERE array_contains(inventors, 'x') ORDER BY id;
```
### キーワード

ARRAY, CONTAIN, CONTAINS, ARRAY_CONTAINS
