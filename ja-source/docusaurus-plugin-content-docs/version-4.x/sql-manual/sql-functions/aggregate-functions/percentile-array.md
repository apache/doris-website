---
{
  "title": "PERCENTILE_ARRAY",
  "description": "PERCENTILEARRAY関数は正確なパーセンタイル配列を計算し、複数のパーセンタイル値を一度に計算することを可能にします。",
  "language": "ja"
}
---
## デスクリプション

`PERCENTILE_ARRAY`関数は正確なパーセンタイル配列を計算し、複数のパーセンタイル値を一度に計算することができます。この関数は主に小さなデータセットに適しています。

主な特徴:
1. 正確な計算: 近似値ではなく正確なパーセンタイル結果を提供します
2. バッチ処理: 単一の操作で複数のパーセンタイルを計算できます
3. 適用範囲: 小規模データセットの処理に最適です


## Syntax

```sql
PERCENTILE_ARRAY(<col>, <array_p>)
```
## パラメータ

| Parameter | デスクリプション |
| -- | -- |
| `<col>` | 正確なパーセンタイルを計算する対象の列。サポートされる型: Double、Float、LargeInt、BigInt、Int、SmallInt、TinyInt。 |
| `<array_p>` | パーセンタイル配列。各要素は Array<Double> 型の定数である必要があり、値は `[0.0, 1.0]` の範囲内である必要があります。例: `[0.5, 0.95, 0.99]`。 |

## Return Value

計算されたパーセンタイル値を含む DOUBLE 型の配列を返します。
グループ内に有効なデータがない場合は、空の配列を返します。


## Examples

```sql
-- setup
CREATE TABLE sales_data (
    id INT,
    amount DECIMAL(10, 2)
) DUPLICATE KEY(`id`)
DISTRIBUTED BY HASH(`id`) BUCKETS AUTO
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
INSERT INTO sales_data VALUES
(1, 10.5),
(2, 15.2),
(3, 20.1),
(4, 25.8),
(5, 30.3),
(6, 35.7),
(7, 40.2),
(8, 45.9),
(9, 50.4),
(10, 100.6);
```
```sql
SELECT percentile_array(amount, [0.25, 0.5, 0.75, 0.9]) as percentiles
FROM sales_data;
```
複数のパーセンタイルを計算します。

```text
+-----------------------------------------------------+
| percentiles                                         |
+-----------------------------------------------------+
| [21.525000000000002, 33, 44.475, 55.41999999999998] |
+-----------------------------------------------------+
```
```sql
SELECT percentile_array(if(amount>90, amount, NULL), [0.5, 0.99]) FROM sales_data;
```
NULL以外のデータのみが計算されます。

```text
+------------------------------------------------------------+
| percentile_array(if(amount>90, amount, NULL), [0.5, 0.99]) |
+------------------------------------------------------------+
| [100.6, 100.6]                                             |
+------------------------------------------------------------+
```
```sql
SELECT percentile_array(NULL, [0.5, 0.99]) FROM sales_data;
```
全ての入力データがNULLの場合、空の配列を返します。

```text
+-------------------------------------+
| percentile_array(NULL, [0.5, 0.99]) |
+-------------------------------------+
| []                                  |
+-------------------------------------+
```
