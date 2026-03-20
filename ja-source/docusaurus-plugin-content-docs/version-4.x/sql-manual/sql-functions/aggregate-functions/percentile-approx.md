---
{
  "title": "PERCENTILE_APPROX",
  "description": "PERCENTILEAPPROX関数は、主に大規模データセット向けに近似パーセンタイルを計算するために使用されます。PERCENTILE関数と比較して、",
  "language": "ja"
}
---
## 説明

`PERCENTILE_APPROX`関数は、主に大規模なデータセットに対して近似パーセンタイルを計算するために使用されます。`PERCENTILE`関数と比較して、以下の特徴があります：

1. メモリ効率性：固定サイズのメモリを使用し、低カーディナリティ列（データ量は大きいが異なる要素の数は少ない）を処理する場合でも低いメモリ消費を維持します
2. パフォーマンス上の利点：低カーディナリティの大規模データセットの処理に適しており、より高速な計算が可能です
3. 精度の調整可能性：圧縮パラメータを通じて精度とパフォーマンスのバランスを調整できます


## 構文

```sql
PERCENTILE_APPROX(<col>, <p> [, <compression>])
```
## パラメータ

| Parameter | デスクリプション |
| -- | -- |
| `<col>` | パーセンタイルを計算する列、サポートされる型：Double。 |
| `<p>` | パーセンタイル値、定数、型Double、範囲`[0.0, 1.0]`、例：`0.99`は99パーセンタイルを意味する。定数である必要がある。 |
| `<compression>` | オプション、圧縮レベル、型Double、範囲`[2048, 10000]`。値が大きいほど精度が向上するが、メモリ使用量が増加する。指定されない場合または範囲外の場合、デフォルトは`10000`。 |

## Return Value

指定された列の近似パーセンタイルを返す、型Double。
グループ内に有効なデータがない場合、NULLを返す。

## Examples

```sql
-- setup
CREATE TABLE response_times (
    request_id INT,
    response_time DECIMAL(10, 2)
) DUPLICATE KEY(`request_id`)
DISTRIBUTED BY HASH(`request_id`) BUCKETS AUTO
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
INSERT INTO response_times VALUES
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
-- Calculate 99th percentile using different compression levels
SELECT 
    percentile_approx(response_time, 0.99) as p99_default,          -- Default compression
    percentile_approx(response_time, 0.99, 2048) as p99_fast,       -- Lower compression, faster
    percentile_approx(response_time, 0.99, 10000) as p99_accurate   -- Higher compression, more accurate
FROM response_times;
```
```text
+-------------------+-------------------+-------------------+
| p99_default       | p99_fast          | p99_accurate      |
+-------------------+-------------------+-------------------+
| 100.5999984741211 | 100.5999984741211 | 100.5999984741211 |
+-------------------+-------------------+-------------------+
```
```sql
SELECT percentile_approx(if(response_time>90,response_time,NULL), 0.5) FROM response_times;
```
NULL以外のデータのみが計算されます。

```text
+-----------------------------------------------------------------+
| percentile_approx(if(response_time>90,response_time,NULL), 0.5) |
+-----------------------------------------------------------------+
|                                               100.5999984741211 |
+-----------------------------------------------------------------+
```
```sql
SELECT percentile_approx(NULL, 0.99) FROM response_times;
```
すべての入力データがNULLの場合、NULLを返します。

```text
+-------------------------------+
| percentile_approx(NULL, 0.99)  |
+-------------------------------+
|                          NULL  |
+-------------------------------+
```
