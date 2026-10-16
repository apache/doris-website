---
{
    "title": "L2_DISTANCE_APPROXIMATE",
    "language": "ja",
    "description": "l2distance の近似版です。関連する配列カラムに ANN インデックスが作成されている場合、この関数の結果をインデックスから取得できる場合があります。"
}
---

## 説明

`l2_distance` の近似版です。関連する配列カラムに ANN インデックスが作成されている場合、この関数の結果をインデックスから取得できる場合があります。

## 構文

```sql
L2_DISTANCE_APPROXIMATE(<array1>, <array2>)
```

## 引数

| 引数 | 説明 |
| -- |--|
| `<array1>` | 最初のベクトル（各値は座標）。入力配列の要素型は TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE です。要素数は array2 と一致する必要があります |
| `<array2>` | 次のベクトル（各値は座標）。入力配列の要素型は TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE に対応します。要素数は array1 と一致する必要があります |

## 戻り値

ユークリッド空間における二点間の距離（ベクトルの値を座標として扱います）を返します。戻り値の型は `FLOAT` です。

いずれかの入力配列が `NULL`、または `NULL` 要素を含む場合、エラーになります。

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

ANN インデックスで高速化できる ANN TopN 検索を実行します。

```sql
SELECT id,
       L2_distance_approximate(embedding,
[0,11,77,24,3,0,0,0,28,70,125,8,0,0,0,0,44,35,50,45,9,0,0,0,4,0,4,56,18,0,3,9,16,17,59,10,10,8,57,57,100,105,125,41,1,0,6,92,8,14,73,125,29,7,0,5,0,0,8,124,66,6,3,1,63,5,0,1,49,32,17,35,125,21,0,3,2,12,6,109,21,0,0,35,74,125,14,23,0,0,6,50,25,70,64,7,59,18,7,16,22,5,0,1,125,23,1,0,7,30,14,32,4,0,2,2,59,125,19,4,0,0,2,1,6,53,33,2]
) AS distance
FROM   sift_1M
ORDER  BY distance
LIMIT  10 
```
結果：

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

入力配列が `NULL` の場合、エラーになります。

```sql
SELECT L2_DISTANCE_APPROXIMATE(NULL, [1, 2]);
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]First argument for function l2_distance_approximate cannot be null
```

入力配列に `NULL` 要素が含まれる場合、エラーになります。

```sql
SELECT L2_DISTANCE_APPROXIMATE([1, NULL], [1, 2]);
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]First argument for function l2_distance_approximate cannot have null
```
