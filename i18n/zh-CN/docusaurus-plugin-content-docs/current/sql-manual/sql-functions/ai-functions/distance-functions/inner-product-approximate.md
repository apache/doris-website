---
{
    "title": "INNER_PRODUCT_APPROXIMATE",
    "language": "zh-CN",
    "description": "innerproduct 的近似版本。如果相关的数组列在其上构建了 ANN 索引，则该函数的结果可以从索引中获取。"
}
---

## 描述

`inner_product` 的近似版本。如果相关的数组列在其上构建了 ANN 索引，则该函数的结果可以从索引中获取。

## 语法

```sql
INNER_PRODUCT_APPROXIMATE(<array1>, <array2>)
```

## 参数

| 参数 | 描述 |
| -- |--|
| `<array1>` | 第一个向量，输入数组的子类型支持：TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE，元素个数必须与 `array2` 一致 |
| `<array2>` | 第二个向量，输入数组的子类型支持：TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE，元素个数必须与 `array1` 一致 |

## 返回值

返回两个相同大小向量的标量积。如果输入数组为 NULL，或数组中的任一元素为 NULL，则返回 NULL。

## 示例

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

执行可由 ANN 索引加速的 topn 检索：

```sql
SELECT id,
       L2_distance_approximate(embedding,
[0,11,77,24,3,0,0,0,28,70,125,8,0,0,0,0,44,35,50,45,9,0,0,0,4,0,4,56,18,0,3,9,16,17,59,10,10,8,57,57,100,105,125,41,1,0,6,92,8,14,73,125,29,7,0,5,0,0,8,124,66,6,3,1,63,5,0,1,49,32,17,35,125,21,0,3,2,12,6,109,21,0,0,35,74,125,14,23,0,0,6,50,25,70,64,7,59,18,7,16,22,5,0,1,125,23,1,0,7,30,14,32,4,0,2,2,59,125,19,4,0,0,2,1,6,53,33,2]
) AS distance
FROM   sift_1M
ORDER  BY distance DESC
LIMIT  10 
```
结果：

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