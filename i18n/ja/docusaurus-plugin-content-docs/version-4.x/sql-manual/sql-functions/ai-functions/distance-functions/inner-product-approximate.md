---
{
    "title": "INNER_PRODUCT_APPROXIMATE",
    "language": "ja",
    "description": "内積関数 inner_product の近似版です。対象の配列列に ANN インデックスが作成されている場合、結果をインデックスから取得することがあります。"
}
---

## 説明

`inner_product` の近似版です。対象の配列列に ANN インデックスが作成されている場合、この関数の結果をインデックスから取得することがあります。

## 構文

```sql
INNER_PRODUCT_APPROXIMATE(<array1>, <array2>)
```

## 引数

| 引数 | 説明 |
| -- |--|
| `<array1>` | 第一ベクトル。入力配列の要素型は TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE に対応し、要素数は array2 と同じである必要があります。 |
| `<array2>` | 第二ベクトル。入力配列の要素型は TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE に対応し、要素数は array1 と同じである必要があります。 |

## 戻り値

同じ要素数の二つのベクトルの内積を `FLOAT` 型で返します。

いずれかの入力配列が `NULL`、または `NULL` 要素を含む場合はエラーになります。

## 例

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

ANN インデックスで高速化できる Top-N 検索を実行します。

```sql
SELECT id,
       inner_product_approximate(embedding,
[0,11,77,24,3,0,0,0,28,70,125,8,0,0,0,0,44,35,50,45,9,0,0,0,4,0,4,56,18,0,3,9,16,17,59,10,10,8,57,57,100,105,125,41,1,0,6,92,8,14,73,125,29,7,0,5,0,0,8,124,66,6,3,1,63,5,0,1,49,32,17,35,125,21,0,3,2,12,6,109,21,0,0,35,74,125,14,23,0,0,6,50,25,70,64,7,59,18,7,16,22,5,0,1,125,23,1,0,7,30,14,32,4,0,2,2,59,125,19,4,0,0,2,1,6,53,33,2]
) AS distance
FROM   sift_1M
ORDER  BY distance DESC
LIMIT  10 
```
結果

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

入力配列が `NULL` の場合はエラーになります。

```sql
SELECT INNER_PRODUCT_APPROXIMATE(NULL, [1, 2]);
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]First argument for function inner_product_approximate cannot be null
```

入力配列に `NULL` 要素がある場合はエラーになります。

```sql
SELECT INNER_PRODUCT_APPROXIMATE([1, NULL], [1, 2]);
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]First argument for function inner_product_approximate cannot have null
```
