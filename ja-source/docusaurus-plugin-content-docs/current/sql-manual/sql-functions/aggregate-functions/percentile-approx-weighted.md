---
{
  "title": "PERCENTILE_APPROX_WEIGHTED",
  "language": "ja",
  "description": "PERCENTILEAPPROXWEIGHTED関数は、重み付き近似パーセンタイルを計算します、"
}
---
## 説明

`PERCENTILE_APPROX_WEIGHTED`関数は重み付き近似パーセンタイルを計算し、主に値の重要度を考慮する必要があるシナリオで使用されます。これは`PERCENTILE_APPROX`の重み付きバージョンで、各値に重みを指定することができます。

主な機能：
1. 重みサポート：各値に対応する重みを割り当てることができ、最終的なパーセンタイル計算に影響を与えます
2. メモリ効率：固定サイズのメモリを使用し、低カーディナリティ列（大量のデータだが異なる要素の数は少ない）を処理する場合でも低メモリ消費を維持します
3. 調整可能な精度：compression パラメータによって精度とパフォーマンスのバランスを取ります

## 構文

```sql
PERCENTILE_APPROX_WEIGHTED(<col>, <weight>, <p> [, <compression>])
```
## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<col>` | パーセンタイルを計算する列。サポートされる型：Double |
| `<weight>` | 重み列、正の数である必要があります。サポートされる型：Double |
| `<p>` | パーセンタイル値、範囲`[0.0, 1.0]`、例：`0.99`は`99`パーセンタイルを表します |
| `<compression>` | オプションパラメータ、サポートされる型：Double。圧縮比、範囲`[2048, 10000]`。値が高いほど精度が高くなりますが、メモリ消費量も大きくなります。指定されていない場合や範囲外の場合は、`10000`が使用されます。 |

## 戻り値

計算された重み付き近似パーセンタイルを表す`DOUBLE`型の値を返します。
グループ内に有効なデータがない場合は、`NULL`を返します。

## 例

```sql
-- Create sample table
CREATE TABLE weighted_scores (
    student_id INT,
    score DECIMAL(10, 2),
    weight INT
) DUPLICATE KEY(student_id)
DISTRIBUTED BY HASH(student_id) BUCKETS AUTO
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);

-- Insert example data
INSERT INTO weighted_scores VALUES
(1, 85.5, 1),   -- Normal homework score, weight 1
(2, 90.0, 2),   -- Important homework score, weight 2
(3, 75.5, 1),
(4, 95.5, 3),   -- Very important homework, weight 3
(5, 88.0, 2),
(6, 92.5, 2),
(7, 78.0, 1),
(8, 89.5, 2),
(9, 94.0, 3),
(10, 83.5, 1);

-- Calculate weighted scores distribution
SELECT 
    -- Calculate 90th percentile for different compression ratios
    percentile_approx_weighted(score, weight, 0.9) as p90_default,          -- Default compression ratio
    percentile_approx_weighted(score, weight, 0.9, 2048) as p90_fast,       -- Lower compression ratio, faster
    percentile_approx_weighted(score, weight, 0.9, 10000) as p90_accurate   -- Higher compression ratio, more accurate
FROM weighted_scores;
```
```text
+------------------+------------------+------------------+
| p90_default      | p90_fast         | p90_accurate     |
+------------------+------------------+------------------+
| 95.3499984741211 | 95.3499984741211 | 95.3499984741211 |
+------------------+------------------+------------------+
```
```sql
select percentile_approx_weighted(if(score>95,score,null), weight, 0.9) from weighted_scores;
```
これはNULL以外の入力のみを考慮します。

```text
+------------------------------------------------------------------+
| percentile_approx_weighted(if(score>95,score,null), weight, 0.9) |
+------------------------------------------------------------------+
|                                                             95.5 |
+------------------------------------------------------------------+
```
```sql
select percentile_approx_weighted(score, weight, 0.9, null) from weighted_scores;
```
すべての入力値がNULLの場合、この関数はNULLを返します。

```text
+------------------------------------------------------+
| percentile_approx_weighted(score, weight, 0.9, null) |
+------------------------------------------------------+
|                                                 NULL |
+------------------------------------------------------+
```
