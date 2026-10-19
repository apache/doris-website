---
{
    "title": "INNER_PRODUCT_APPROXIMATE",
    "language": "ko",
    "description": "innerproduct의 근사 버전입니다. 관련 배열 열에 ann 인덱스가 생성되어 있으면 이 함수의 결과를 인덱스에서 가져올 수 있습니다."
}
---

## 설명 {#description}

`inner_product`의 근사 버전입니다. 관련 배열 열에 ann 인덱스가 생성되어 있으면 이 함수의 결과를 인덱스에서 가져올 수 있습니다.

## 구문 {#syntax}

```sql
INNER_PRODUCT_APPROXIMATE(<array1>, <array2>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- |--|
| `<array1>` | 첫 번째 벡터입니다. 입력 배열의 원소 타입은 TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE을 지원하며, 원소 수는 array2와 같아야 합니다. |
| `<array2>` | 두 번째 벡터입니다. 입력 배열의 원소 타입은 TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE을 지원하며, 원소 수는 array1과 같아야 합니다. |

## 반환 값 {#return-value}

크기가 같은 두 벡터의 내적을 반환합니다. 반환 타입은 `FLOAT`입니다.

입력 배열 중 하나라도 `NULL`이거나 `NULL` 원소를 포함하면 함수가 오류를 반환합니다.

## 예제 {#examples}

```sql
CREATE TABLE sift_1M (
  id int NOT NULL,
  embedding array<float>  NOT NULL  COMMENT "",
  INDEX ann_index (embedding) USING ANN PROPERTIES(
      "index_type"="hnsw",
      "metric_type"="inner_product",
      "dim"="128",
      "quantizer"="flat"
  )
) ENGINE=OLAP
DUPLICATE KEY(id) COMMENT "OLAP"
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
  "replication_num" = "1"
);
```

```sql
INSERT INTO sift_1M
SELECT *
FROM S3(
  "uri" = "https://selectdb-customers-tools-bj.oss-cn-beijing.aliyuncs.com/sift_database.tsv",
  "format" = "csv");
```

ann 인덱스로 가속할 수 있는 ann topn 검색을 수행합니다:

```sql
SELECT id,
       inner_product_approximate(embedding,
[0,11,77,24,3,0,0,0,28,70,125,8,0,0,0,0,44,35,50,45,9,0,0,0,4,0,4,56,18,0,3,9,16,17,59,10,10,8,57,57,100,105,125,41,1,0,6,92,8,14,73,125,29,7,0,5,0,0,8,124,66,6,3,1,63,5,0,1,49,32,17,35,125,21,0,3,2,12,6,109,21,0,0,35,74,125,14,23,0,0,6,50,25,70,64,7,59,18,7,16,22,5,0,1,125,23,1,0,7,30,14,32,4,0,2,2,59,125,19,4,0,0,2,1,6,53,33,2]
) AS distance
FROM   sift_1M
ORDER  BY distance DESC
LIMIT  10 
```
결과

```text
+--------+----------+
| id     | distance |
+--------+----------+
| 178811 |   236430 |
| 177646 |   234617 |
| 181997 |   234301 |
| 821938 |   234211 |
| 181605 |   234026 |
| 716433 |   232980 |
| 807785 |   232551 |
| 358802 |   232390 |
| 279356 |   232177 |
| 153488 |   231871 |
+--------+----------+
10 rows in set (0.04 sec)
```

입력 배열이 `NULL`이면 함수가 오류를 반환합니다:

```sql
SELECT INNER_PRODUCT_APPROXIMATE(NULL, [1, 2]);
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]First argument for function inner_product_approximate cannot be null
```

입력 배열에 `NULL` 원소가 포함되어 있으면 함수가 오류를 반환합니다:

```sql
SELECT INNER_PRODUCT_APPROXIMATE([1, NULL], [1, 2]);
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]First argument for function inner_product_approximate cannot have null
```
