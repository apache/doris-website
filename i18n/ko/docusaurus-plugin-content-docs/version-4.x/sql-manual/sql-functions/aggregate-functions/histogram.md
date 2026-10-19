---
{
    "title": "HISTOGRAM",
    "language": "ko",
    "description": "histogram 함수는 데이터의 분포를 설명하는 데 사용되며, \"동일 높이\" 버킷 분할 전략을 사용합니다."
}
---

## 설명 {#description}

histogram 함수는 데이터의 분포를 설명하는 데 사용됩니다. "동일 높이" 버킷 분할 전략을 사용하여 데이터 값에 따라 데이터를 버킷으로 나눕니다. 각 버킷에 속하는 값의 개수와 같은 간단한 정보로 각 버킷을 설명합니다. NULL이 아닌 데이터만 집계합니다.

## 별칭 {#alias}

HIST

## 구문 {#syntax}

```sql
HISTOGRAM(<expr>[, <num_buckets>])
HIST(<expr>[, <num_buckets>])
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `expr` | 계산할 표현식입니다. 지원되는 타입: TinyInt, SmallInt, Integer, BigInt, LargeInt, Float, Double, Decimal, String. |
| `num_buckets` | 선택 사항입니다. 히스토그램의 버킷 수를 제한합니다. 기본값은 128입니다. 지원되는 타입: Integer.|


## 반환 값 {#return-value}

히스토그램 추정 후 JSON 타입의 값을 반환합니다. 그룹의 모든 데이터가 NULL이면 NULL을 반환합니다. 유효한 데이터가 없으면 num_buckets = 0인 결과를 반환합니다.

## 예제 {#example}

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

쿼리 결과 설명:

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
