---
{
    "title": "HISTOGRAM",
    "language": "ja",
    "description": "ヒストグラム関数はデータの分布を表します。「等高」のバケット分割方式を使用します。"
}
---

## 説明

ヒストグラム関数はデータの分布を表します。「等高」のバケット分割方式を使用し、データの値に応じてバケットに分割します。各バケットに含まれる値の数など、簡単な情報で各バケットを表します。NULL ではないデータのみをカウントします。

## 別名

HIST

## 構文

```sql
HISTOGRAM(<expr>[, <num_buckets>])
HIST(<expr>[, <num_buckets>])
```

## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `expr` | 計算対象の式。サポートされる型は TinyInt、SmallInt、Integer、BigInt、LargeInt、Float、Double、Decimal、String です。 |
| `num_buckets` | 省略可能。ヒストグラムのバケット数を制限します。デフォルト値は 128 です。サポートされる型は Integer です。 |


## 戻り値

ヒストグラムの推定結果を JSON 型の値として返します。グループ内のすべてのデータが NULL の場合、NULL を返します。有効なデータがない場合、num_buckets = 0 の結果を返します。

## 例

```sql
-- setup
CREATE TABLE histogram_test (
    c_int INT,
    c_float FLOAT,
    c_string VARCHAR(20)
) DISTRIBUTED BY HASH(c_int) BUCKETS 1
PROPERTIES ("replication_num"="1");

INSERT INTO histogram_test VALUES
    (1, 0.1, 'str1'),
    (2, 0.2, 'str2'),
    (3, 0.8, 'str3'),
    (4, 0.9, 'str4'),
    (5, 1.0, 'str5'),
    (6, 1.0, 'str6'),
    (NULL, NULL, 'str7');
```

```sql
SELECT histogram(c_float) FROM histogram_test;
```

```text
+-------------------------------------------------------------------------------------------------------------------------------------+
| histogram(c_float)                                                                                                                  |
+-------------------------------------------------------------------------------------------------------------------------------------+
| {"num_buckets":5,"buckets":[{"lower":"0.1","upper":"0.1","ndv":1,"count":1,"pre_sum":0},{"lower":"0.2","upper":"0.2","ndv":1,"count":1,"pre_sum":1},{"lower":"0.8","upper":"0.8","ndv":1,"count":1,"pre_sum":2},{"lower":"0.9","upper":"0.9","ndv":1,"count":1,"pre_sum":3},{"lower":"1","upper":"1","ndv":1,"count":2,"pre_sum":4}]} |
+-------------------------------------------------------------------------------------------------------------------------------------+
```

```sql
SELECT histogram(c_string, 2) FROM histogram_test;
```

```text
+-----------------------------------------------------------------------------------------------------------------------------------------------------------+
| histogram(c_string, 2)                                                                                                                                    |
+-----------------------------------------------------------------------------------------------------------------------------------------------------------+
| {"num_buckets":2,"buckets":[{"lower":"str1","upper":"str4","ndv":4,"count":4,"pre_sum":0},{"lower":"str5","upper":"str7","ndv":3,"count":3,"pre_sum":4}]} |
+-----------------------------------------------------------------------------------------------------------------------------------------------------------+
```

```sql
-- NULL case
SELECT histogram(c_float) FROM histogram_test WHERE c_float IS NULL;
```

```text
+--------------------------------+
| histogram(c_float)             |
+--------------------------------+
| {"num_buckets":0,"buckets":[]} |
+--------------------------------+
```

クエリ結果の説明：

```json
{
    "num_buckets": 3, 
    "buckets": [
        {
            "lower": "0.1", 
            "upper": "0.2", 
            "count": 2, 
            "pre_sum": 0, 
            "ndv": 2
        }, 
        {
            "lower": "0.8", 
            "upper": "0.9", 
            "count": 2, 
            "pre_sum": 2, 
            "ndv": 2
        }, 
        {
            "lower": "1.0", 
            "upper": "1.0", 
            "count": 2, 
            "pre_sum": 4, 
            "ndv": 1
        }
    ]
}
```

```text
Field description:
- num_buckets: The number of buckets
- buckets: All buckets
    - lower: Lower bound of the bucket
    - upper: Upper bound of the bucket
    - count: The number of elements contained in the bucket
    - pre_sum: The total number of elements in the front bucket
    - ndv: The number of different values in the bucket

> Total number of elements in the histogram = count of the last bucket + pre_sum of the last bucket.
```

num_buckets はバケット数、buckets はすべてのバケットを表します。各バケットの lower と upper は下限と上限、count は含まれる要素数、pre_sum はそれより前のバケットに含まれる要素の総数、ndv は異なる値の数です。ヒストグラムの要素総数は、最後のバケットの count と pre_sum の和です。
