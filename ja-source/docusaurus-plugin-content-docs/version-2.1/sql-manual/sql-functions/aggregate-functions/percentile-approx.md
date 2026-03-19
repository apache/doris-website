---
{
  "title": "PERCENTILE_APPROX",
  "language": "ja",
  "description": "PERCENTILEAPPROX関数は、主に大規模なデータセットに対して近似パーセンタイルを計算するために使用されます。PERCENTILE関数と比較して、"
}
---
## 説明

`PERCENTILE_APPROX`関数は、主に大規模なデータセットに対して近似パーセンタイルを計算するために使用されます。`PERCENTILE`関数と比較して、以下の特徴があります：

1. メモリ効率性：固定サイズのメモリを使用し、低カーディナリティ列（大量のデータだが異なる要素の数が少ない）を処理する際でも低いメモリ消費を維持
2. パフォーマンス上の利点：低カーディナリティの大規模データセットの処理に適しており、より高速な計算が可能
3. 調整可能な精度：圧縮パラメータを通じて精度とパフォーマンスのバランスを調整


## 構文

```sql
PERCENTILE_APPROX(<col>, <p> [, <compression>])
```
## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<col>` | パーセンタイルを計算する列 |
| `<p>` | パーセンタイル値、範囲 `[0.0, 1.0]`、例：`0.99` は `99th` パーセンタイルを表す |
| `<compression>` | オプションパラメータ、圧縮レベル、範囲 `[2048, 10000]`、値が高いほど精度が向上するがメモリを多く消費する。指定されていないか範囲外の場合は `10000` を使用 |

## 戻り値

計算された近似パーセンタイルを表す `DOUBLE` 値を返します。

## 例

```sql
-- Create sample table
CREATE TABLE response_times (
    request_id INT,
    response_time DECIMAL(10, 2)
) DUPLICATE KEY(`request_id`)
DISTRIBUTED BY HASH(`request_id`) BUCKETS AUTO
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);

-- Insert sample data
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
