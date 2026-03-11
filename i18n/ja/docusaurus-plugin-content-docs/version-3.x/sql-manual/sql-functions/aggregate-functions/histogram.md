---
{
  "title": "ヒストグラム",
  "description": "histogram関数はデータの分布を記述するために使用されます。この関数は「equal height」バケット戦略を使用し、",
  "language": "ja"
}
---
## デスクリプション

histogram関数は、データの分布を記述するために使用されます。この関数は「equal height」バケット戦略を使用し、データの値に応じてデータをバケットに分割します。各バケットは、バケットに含まれる値の数など、いくつかの簡単なデータで記述されます。

## Alias

HIST

## Syntax

```sql
HISTOGRAM(<expr>[, <num_buckets>])
```
## パラメータ

| パラメータ | デスクリプション |
| -- | -- |
| `expr` | 取得する必要がある式。 |
| `num_buckets` | オプション。ヒストグラムバケットの数を制限します。デフォルト値は128です。|


## Return Value

ヒストグラム推定後にJSON型の値を返します。特殊なケース：
- パラメータ<expr>がNULLの場合、NULLを返します。

## Example

```sql
SELECT histogram(c_float) FROM histogram_test;
```
```text
+-------------------------------------------------------------------------------------------------------------------------------------+
| histogram(`c_float`)                                                                                                                |
+-------------------------------------------------------------------------------------------------------------------------------------+
| {"num_buckets":3,"buckets":[{"lower":"0.1","upper":"0.1","count":1,"pre_sum":0,"ndv":1},...]} |
+-------------------------------------------------------------------------------------------------------------------------------------+
```
```sql
SELECT histogram(c_string, 2) FROM histogram_test;
```
```text
+-------------------------------------------------------------------------------------------------------------------------------------+
| histogram(`c_string`)                                                                                                               |
+-------------------------------------------------------------------------------------------------------------------------------------+
| {"num_buckets":2,"buckets":[{"lower":"str1","upper":"str7","count":4,"pre_sum":0,"ndv":3},...]} |
+-------------------------------------------------------------------------------------------------------------------------------------+
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
- num_buckets：The number of buckets
- buckets：All buckets
    - lower：Upper bound of the bucket
    - upper：Lower bound of the bucket
    - count：The number of elements contained in the bucket
    - pre_sum：The total number of elements in the front bucket
    - ndv：The number of different values in the bucket

> Total number of histogram elements = number of elements in the last bucket(count) + total number of elements in the previous bucket(pre_sum).
```
