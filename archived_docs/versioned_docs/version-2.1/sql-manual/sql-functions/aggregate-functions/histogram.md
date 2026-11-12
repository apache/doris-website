---
{
    "title": "HISTOGRAM",
    "language": "en",
    "description": "The histogram function is used to describe the distribution of the data. It uses an \"equal height\" bucking strategy,"
}
---

## Description

The histogram function is used to describe the distribution of the data. It uses an "equal height" bucking strategy, and divides the data into buckets according to the value of the data. It describes each bucket with some simple data, such as the number of values that fall in the bucket. 

## Alias

HIST

## Syntax

```sql
HISTOGRAM(<expr>[, <num_buckets>])
```

## Parameters

| Parameters | Description |
| -- | -- |
| `expr` | The expression that needs to be obtained. |
| `num_buckets` | Optional. Limit the number of histogram buckets. The default value is 128.|


## Return Value

Returns a value of JSON type after histogram estimation. Special cases:
- When the parameter <expr> is NULL, it returns NULL.

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

Query result description:

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