---
{
  "title": "PERCENTILE_APPROX",
  "language": "ja",
  "description": "PERCENTILEAPPROX関数は、主に大規模なデータセットに対して近似パーセンタイルを計算するために使用されます。PERCENTILE関数と比較して、"
}
---
## 説明

`PERCENTILE_APPROX`関数は、主に大規模なデータセットに対して近似パーセンタイルを計算するために使用されます。`PERCENTILE`関数と比較して、以下の特徴があります：

1. メモリ効率: 固定サイズのメモリを使用し、低カーディナリティカラム（データ量は大きいが異なる要素の数は少ない）を処理する場合でも低いメモリ消費を維持します
2. パフォーマンス上の利点: 低カーディナリティの大規模データセットの処理に適しており、より高速な計算が可能です
3. 調整可能な精度: 圧縮パラメータを通じて精度とパフォーマンスのバランスを調整できます


## 構文

```sql
PERCENTILE_APPROX(<col>, <p> [, <compression>])
```
## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<col>` | パーセンタイルを計算する列、サポートされる型：Double。 |
| `<p>` | パーセンタイル値、定数、型Double、範囲 `[0.0, 1.0]`、例：`0.99` は99パーセンタイルを意味する。定数である必要があります。 |
| `<compression>` | オプション、圧縮レベル、型Double、範囲 `[2048, 10000]`。値が高いほど精度が向上しますが、より多くのメモリを消費します。指定されていない場合や範囲外の場合、デフォルトは `10000` です。 |

## 戻り値

指定された列の近似パーセンタイルを返します、型Double。
グループに有効なデータがない場合、NULLを返します。

## 例

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
