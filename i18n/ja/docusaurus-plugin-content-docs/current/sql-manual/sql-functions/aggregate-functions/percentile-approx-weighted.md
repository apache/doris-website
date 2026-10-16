---
{
    "title": "PERCENTILE_APPROX_WEIGHTED",
    "language": "ja",
    "description": "PERCENTILEAPPROXWEIGHTED 関数は重み付きの近似パーセンタイルを計算します。"
}
---

## 説明

`PERCENTILE_APPROX_WEIGHTED` 関数は重み付きの近似パーセンタイルを計算します。値の重要度を考慮する場合に使用します。`PERCENTILE_APPROX` の重み付き版であり、各値に重みを指定できます。

主な特徴:
1. 重みの指定: 各値に対応する重みを割り当てられ、最終的なパーセンタイル計算に反映されます。
2. メモリ効率: 固定サイズのメモリを使用します。カーディナリティが低い列 (データ量は多いが異なる要素は少ない列) でもメモリ使用量を抑えられます。
3. 調整可能な精度: 圧縮パラメータで精度と性能のバランスを調整できます。

## 構文

```sql
PERCENTILE_APPROX_WEIGHTED(<col>, <weight>, <p> [, <compression>])
```

## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<col>` | パーセンタイルを計算する列。Double 型をサポートします。 |
| `<weight>` | 重みの列。正の数である必要があります。Double 型をサポートします。 |
| `<p>` | パーセンタイル値。範囲は `[0.0, 1.0]` です。たとえば `0.99` は第 `99` パーセンタイルを表します。 |
| `<compression>` | 省略可能な引数。Double 型をサポートします。圧縮率の範囲は `[2048, 10000]` です。値が大きいほど精度が上がる一方、メモリ使用量も増えます。省略した場合、または範囲外の場合は `10000` を使用します。 |

## 戻り値

計算した重み付き近似パーセンタイルを表す `DOUBLE` 型の値を返します。
グループ内に有効なデータがない場合は `NULL` を返します。

## 使用例

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

NULL 以外の入力値のみを対象とします。

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

すべての入力値が NULL の場合、関数は NULL を返します。

```text
+------------------------------------------------------+
| percentile_approx_weighted(score, weight, 0.9, null) |
+------------------------------------------------------+
|                                                 NULL |
+------------------------------------------------------+
```


