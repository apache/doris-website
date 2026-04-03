---
{
  "title": "PERCENTILE_APPROX_WEIGHTED",
  "description": "PERCENTILEAPPROXWEIGHTED関数は重み付き近似パーセンタイルを計算します。",
  "language": "ja"
}
---
## 説明

`PERCENTILE_APPROX_WEIGHTED`関数は重み付き近似パーセンタイルを計算し、主に値の重要度を考慮する必要があるシナリオで使用されます。これは`PERCENTILE_APPROX`の重み付きバージョンで、各値に重みを指定することができます。

主な特徴：
1. 重みサポート：各値に対応する重みを割り当てることができ、最終的なパーセンタイル計算に影響します
2. メモリ効率：固定サイズのメモリを使用し、低カーディナリティ列（データ量は大きいが異なる要素の数は少ない）を処理する場合でも低いメモリ消費を維持します
3. 精度調整可能：圧縮パラメータにより精度とパフォーマンスのバランスを取ることができます

## 構文

```sql
PERCENTILE_APPROX_WEIGHTED(<col>, <weight>, <p> [, <compression>])
```
## パラメータ

| Parameter | デスクリプション |
| -- | -- |
| `<col>` | パーセンタイルを計算する列 |
| `<weight>` | 重み列、正の数値である必要があります |
| `<p>` | パーセンタイル値、範囲 `[0.0, 1.0]`、例: `0.99` は `99` パーセンタイルを表します |
| `<compression>` | オプションパラメータ、圧縮率、範囲 `[2048, 10000]`。値が高いほど精度が向上しますが、メモリ消費量が増加します。指定されていない場合や範囲外の場合は、`10000` を使用します。 |

## 戻り値

`DOUBLE` 型の値を返し、計算された重み付き近似パーセンタイルを表します。

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
