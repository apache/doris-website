---
{
  "title": "L2_DISTANCE_APPROXIMATE",
  "language": "ja",
  "description": "l2distanceの近似版。関連する配列列にannインデックスが構築されている場合、この関数の結果はインデックスから取得できます。"
}
---
## 説明

`l2_distance`の近似バージョンです。関連する配列カラムにannインデックスが構築されている場合、この関数の結果はインデックスから取得できます。

## 構文

```sql
L2_DISTANCE_APPROXIMATE(<array1>, <array2>)
```
## パラメータ

| パラメータ | 説明 |
| -- |--|
| `<array1>` | 最初のベクトル（ベクトル値は座標）、入力配列のサブタイプは：TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE、要素数はarray2と一致している必要があります |
| `<array2>` | 2番目のベクトル（ベクトル値は座標）、入力配列のサブタイプは：TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE、要素数はarray1と一致している必要があります |

## 戻り値

ユークリッド空間内の2点間の距離を返します（ベクトル値は座標）。入力配列がNULLの場合、または配列内の任意の要素がNULLの場合、NULLが返されます。

## 例

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
ann index によって高速化できる ann topn 検索を実行する：

```sql
SELECT id,
       L2_distance_approximate(embedding,
[0,11,77,24,3,0,0,0,28,70,125,8,0,0,0,0,44,35,50,45,9,0,0,0,4,0,4,56,18,0,3,9,16,17,59,10,10,8,57,57,100,105,125,41,1,0,6,92,8,14,73,125,29,7,0,5,0,0,8,124,66,6,3,1,63,5,0,1,49,32,17,35,125,21,0,3,2,12,6,109,21,0,0,35,74,125,14,23,0,0,6,50,25,70,64,7,59,18,7,16,22,5,0,1,125,23,1,0,7,30,14,32,4,0,2,2,59,125,19,4,0,0,2,1,6,53,33,2]
) AS distance
FROM   sift_1M
ORDER  BY distance
LIMIT  10 
```
結果

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
