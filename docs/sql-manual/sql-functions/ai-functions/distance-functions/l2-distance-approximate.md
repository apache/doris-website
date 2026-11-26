---
{
    "title": "L2_DISTANCE_APPROXIMATE",
    "language": "en",
    "description": "Approximate version of l2distance. If related array column has ann index built on it, result of this function could be collected from index."
}
---

## Description

Approximate version of `l2_distance`. If related array column has ann index built on it, result of this function could be collected from index.

In dev, array inputs support missing vectors: a whole `NULL` array or an empty array (`[]`) produces `NULL`; see Return Value for invalid-input handling.

## Syntax

```sql
L2_DISTANCE_APPROXIMATE(<array1>, <array2>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<array1>` | Vector 1, of type `ARRAY<FLOAT>`; other numeric arrays can be converted to this type. The whole array can be `NULL` or empty (`[]`); a non-empty array must not contain `NULL` elements. |
| `<array2>` | Vector 2, of type `ARRAY<FLOAT>`; other numeric arrays can be converted to this type. The whole array can be `NULL` or empty (`[]`); a non-empty array must not contain `NULL` elements. |

When both arrays are non-empty, they must have the same number of elements.

## Return Value

Returns the Euclidean distance between two vectors as a nullable `FLOAT`. In the dev version, array inputs follow these rules:

- If either whole array is `NULL` or empty (`[]`), the result is `NULL`, including `NULL`/`NULL` and `[]`/`[]`.
- A non-empty array containing a `NULL` element raises an error. Passing `NULL` or `[]` as the other argument does not make that invalid array valid.
- Two non-empty arrays with different numbers of elements raise an error.

These scalar evaluation rules do not depend on `enable_ann_index_empty_array`, which only controls whether ANN-indexed columns accept empty arrays on writes.

When TopN uses an ANN index, only indexed, non-empty vectors participate. Empty-vector rows do not pad the result to `LIMIT`, and `NULLS FIRST` or `NULLS LAST` alone does not trigger fallback. Segments without a physical index, among other cases, fall back to scalar evaluation, whose `NULL` distances still participate in SQL sorting. See [Empty vectors and NULL distances](../../../../table-design/index/vector-index/overview.md#empty-vectors-and-null-distances).

## Example

```sql
CREATE TABLE sift_1M (
  id int NOT NULL,
  embedding array<float>  NOT NULL  COMMENT "",
  INDEX ann_index (embedding) USING ANN PROPERTIES(
      "index_type"="hnsw",
      "metric_type"="l2_distance",
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

Do ann topn search that can be accelerated by ann index:

```sql
SELECT id,
       L2_distance_approximate(embedding,
[0,11,77,24,3,0,0,0,28,70,125,8,0,0,0,0,44,35,50,45,9,0,0,0,4,0,4,56,18,0,3,9,16,17,59,10,10,8,57,57,100,105,125,41,1,0,6,92,8,14,73,125,29,7,0,5,0,0,8,124,66,6,3,1,63,5,0,1,49,32,17,35,125,21,0,3,2,12,6,109,21,0,0,35,74,125,14,23,0,0,6,50,25,70,64,7,59,18,7,16,22,5,0,1,125,23,1,0,7,30,14,32,4,0,2,2,59,125,19,4,0,0,2,1,6,53,33,2]
) AS distance
FROM   sift_1M
ORDER  BY distance
LIMIT  10 
```
Result

```text
+--------+----------+
| id     | distance |
+--------+----------+
| 178811 | 210.1595 |
| 177646 | 217.0161 |
| 181997 | 218.5406 |
| 181605 | 219.2989 |
| 821938 | 221.7228 |
| 807785 | 226.7135 |
| 716433 | 227.3148 |
| 358802 | 230.7314 |
| 803100 | 230.9112 |
| 866737 | 231.6441 |
+--------+----------+
10 rows in set (0.08 sec)
```


If an input array contains a `NULL` element, the function returns an error:

```sql
SELECT L2_DISTANCE_APPROXIMATE([1, NULL], [1, 2]);
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]First argument for function l2_distance_approximate cannot have null
```

The following examples need no table and show empty-array and NULL input behavior in dev:

```sql
SELECT L2_DISTANCE_APPROXIMATE(CAST([] AS ARRAY<FLOAT>), [1, 2]) AS empty_result,
       L2_DISTANCE_APPROXIMATE(CAST(NULL AS ARRAY<FLOAT>), [1, 2]) AS null_result;
```

```text
+--------------+-------------+
| empty_result | null_result |
+--------------+-------------+
|         NULL |        NULL |
+--------------+-------------+
```
