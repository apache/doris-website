---
{
  "title": "ヒストグラム",
  "language": "ja",
  "description": "ヒストグラム関数は、データの分布を記述するために使用されます。これは「等高」バケット戦略を使用します。"
}
---
## 説明

histogram関数は、データの分布を記述するために使用されます。この関数は「等高」バケット戦略を使用し、データの値に従ってデータをバケットに分割します。各バケットは、そのバケットに含まれる値の数など、いくつかの簡単なデータで記述されます。NULL以外のデータのみがカウントされます。

## エイリアス

HIST

## 構文

```sql
HISTOGRAM(<expr>[, <num_buckets>])
HIST(<expr>[, <num_buckets>])
```
## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `expr` | 計算対象の式。サポートされる型: TinyInt、SmallInt、Integer、BigInt、LargeInt、Float、Double、Decimal、String。 |
| `num_buckets` | オプション。ヒストグラムバケットの数を制限します。デフォルト値は128です。サポートされる型: Integer。|


## 戻り値

ヒストグラム推定後のJSON型の値を返します。グループ内のすべてのデータがNULLの場合、NULLを返します。有効なデータがない場合、num_buckets = 0の結果を返します。

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
クエリ結果の説明:

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
    - lower: Upper bound of the bucket
    - upper: Lower bound of the bucket
    - count: The number of elements contained in the bucket
    - pre_sum: The total number of elements in the front bucket
    - ndv: The number of different values in the bucket

> Total number of elements in the histogram = count of the last bucket + pre_sum of the last bucket.
```
