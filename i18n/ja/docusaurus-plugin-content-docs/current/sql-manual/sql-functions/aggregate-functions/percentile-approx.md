---
{
    "title": "PERCENTILE_APPROX",
    "language": "ja",
    "description": "PERCENTILEAPPROX 関数は、主に大規模データセットの近似パーセンタイルを計算します。"
}
---

## 説明

`PERCENTILE_APPROX` 関数は、主に大規模データセットの近似パーセンタイルを計算します。`PERCENTILE` 関数と比べて、次の特徴があります:

1. メモリ効率: 固定サイズのメモリを使用します。カーディナリティが低い列 (データ量は多いが異なる要素は少ない列) でも、メモリ使用量を抑えられます。
2. 処理性能: カーディナリティが低い大規模データセットに適し、計算を高速に実行できます。
3. 調整可能な精度: 圧縮パラメータで精度と性能のバランスを調整できます。


## 構文

```sql
PERCENTILE_APPROX(<col>, <p> [, <compression>])
```

## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<col>` | パーセンタイルを計算する列。Double 型をサポートします。 |
| `<p>` | パーセンタイル値。Double 型の定数で、範囲は `[0.0, 1.0]` です。たとえば `0.99` は第 99 パーセンタイルを表します。定数である必要があります。 |
| `<compression>` | 省略可能な圧縮レベル。Double 型で範囲は `[2048, 10000]` です。値が大きいほど精度は上がりますが、メモリ使用量も増えます。省略した場合、または範囲外の場合、デフォルトは `10000` です。 |

## 戻り値

指定した列の近似パーセンタイルを Double 型で返します。
グループ内に有効なデータがない場合は NULL を返します。

## 使用例

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

NULL 以外のデータのみを計算します。

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

すべての入力データが NULL の場合は NULL を返します。

```text
+-------------------------------+
| percentile_approx(NULL, 0.99)  |
+-------------------------------+
|                          NULL  |
+-------------------------------+
```


