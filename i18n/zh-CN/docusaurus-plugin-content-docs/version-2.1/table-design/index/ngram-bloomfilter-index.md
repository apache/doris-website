---
{
    "title": "N-Gram 索引",
    "language": "zh-CN",
    "description": "n-gram 分词是将一句话或一段文字拆分成多个相邻的词组的分词方法。NGram BloomFilter 索引和 BloomFilter 索引类似，也是基于 BloomFilter 的跳数索引。"
}
---

## 索引原理

n-gram 分词是将一句话或一段文字拆分成多个相邻的词组的分词方法。NGram BloomFilter 索引和 BloomFilter 索引类似，也是基于 BloomFilter 的跳数索引。

与 BloomFilter 索引不同的是，NGram BloomFilter 索引用于加速文本 LIKE 查询，它存入 BloomFilter 的不是原始文本的值，而是对文本进行 NGram 分词，每个词作为值存入 BloomFilter。对于 LIKE 查询，将 LIKE '%pattern%' 的 pattern 也进行 NGram 分词，判断每个词是否在 BloomFilter 中，如果某个词不在则对应的数据块就不满足 LIKE 条件，可以跳过这部分数据减少 IO 加速查询。

## 使用场景

NGram BloomFilter 索引只能加速字符串 LIKE 查询，而且 LIKE pattern 中的连续字符个数要大于等于索引定义的 NGram 中的 N。

:::tip

-   NGram BloomFilter 只支持字符串列，只能加速 LIKE 查询。

-   NGram BloomFilter 索引和 BloomFilter 索引为互斥关系，即同一个列只能设置两者中的一个。

-   NGram BloomFilter 索引的效果分析，跟 BloomFilter 索引类似。

:::


## 管理索引

### 创建 NGram BloomFilter 索引


在建表语句中 COLUMN 的定义之后是索引定义：

```sql
  INDEX `idx_column_name` (`column_name`) USING NGRAM_BF PROPERTIES("gram_size"="3", "bf_size"="1024") COMMENT 'username ngram_bf index'
```

语法说明如下：

**1. `idx_column_name(column_name)` 是必须的，`column_name` 是建索引的列名，必须是前面列定义中出现过的，`idx_column_name` 是索引名字，必须表级别唯一，建议命名规范：列名前面加前缀 `idx_`**

**2. `USING NGRAM_BF` 是必须的，用于指定索引类型是 NGram BloomFilter 索引**

**3. `PROPERTIES` 是可选的，用于指定 NGram BloomFilter 索引的额外属性，目前支持的属性如下：**

- gram_size：NGram 中的 N，指定 N 个连续字符分词一个词，比如 'This is a simple ngram example' 在 N = 3 的时候分成 'This is a', 'is a simple', 'a simple ngram', 'simple ngram example' 4 个词。

- bf_size：BloomFilter 的大小，单位是 Bit。bf_size 决定每个数据块对应的索引大小，这个值越大占用存储空间越大，同时 Hash 碰撞的概率也越低。

- gram_size 建议取 LIKE 查询的字符串最小长度，但是不建议低于 2。一般建议设置 "gram_size"="3", "bf_size"="1024"，然后根据 Query Profile 调优。

**4. `COMMENT` 是可选的，用于指定索引注释**

### 查看 NGram BloomFilter 索引

```sql
-- 语法 1，表的 schema 中 INDEX 部分 USING NGRAM_BF 是倒排索引
SHOW CREATE TABLE table_name;

-- 语法 2，IndexType 为 NGRAM_BF 的是倒排索引
SHOW INDEX FROM idx_name;
```

### 删除 NGram BloomFilter 索引

```sql
ALTER TABLE table_ngrambf DROP INDEX idx_ngrambf;
```

### 修改 NGram BloomFilter 索引

```sql
CREATE INDEX idx_column_name2(column_name2) ON table_ngrambf USING NGRAM_BF PROPERTIES("gram_size"="3", "bf_size"="1024") COMMENT 'username ngram_bf index';

ALTER TABLE table_ngrambf ADD INDEX idx_column_name2(column_name2) USING NGRAM_BF PROPERTIES("gram_size"="3", "bf_size"="1024") COMMENT 'username ngram_bf index';
```

## 使用索引

使用 NGram BloomFilter 索引需设置如下参数（enable_function_pushdown 默认为 false）：
```sql
SET enable_function_pushdown = true;
```
NGram BloomFilter 索引用于加速 LIKE 查询，比如：
```sql
SELECT count() FROM table1 WHERE message LIKE '%error%';
```

可以通过 Query Profile 中的下面几个指标分析 BloomFilter 索引（包括 NGram）的加速效果。
- RowsBloomFilterFiltered BloomFilter 索引过滤掉的行数，可以与其他几个 Rows 值对比分析索引过滤效果
- BlockConditionsFilteredBloomFilterTime BloomFilter 倒排索引消耗的时间


## 使用示例

以亚马逊产品的用户评论信息的数据集 amazon_reviews 为例展示 NGram BloomFilter 索引的使用和效果。

### 建表


```sql
CREATE TABLE `amazon_reviews` (  
  `review_date` int(11) NULL,  
  `marketplace` varchar(20) NULL,  
  `customer_id` bigint(20) NULL,  
  `review_id` varchar(40) NULL,
  `product_id` varchar(10) NULL,
  `product_parent` bigint(20) NULL,
  `product_title` varchar(500) NULL,
  `product_category` varchar(50) NULL,
  `star_rating` smallint(6) NULL,
  `helpful_votes` int(11) NULL,
  `total_votes` int(11) NULL,
  `vine` boolean NULL,
  `verified_purchase` boolean NULL,
  `review_headline` varchar(500) NULL,
  `review_body` string NULL
) ENGINE=OLAP
DUPLICATE KEY(`review_date`)
COMMENT 'OLAP'
DISTRIBUTED BY HASH(`review_date`) BUCKETS 16
PROPERTIES (
"replication_allocation" = "tag.location.default: 1",
"compression" = "ZSTD"
);
```

### 导入数据

**用 wget 或者其他工具从下面的地址下载数据集**

```
https://datasets-documentation.s3.eu-west-3.amazonaws.com/amazon_reviews/amazon_reviews_2010.snappy.parquet
https://datasets-documentation.s3.eu-west-3.amazonaws.com/amazon_reviews/amazon_reviews_2011.snappy.parquet
https://datasets-documentation.s3.eu-west-3.amazonaws.com/amazon_reviews/amazon_reviews_2012.snappy.parquet
https://datasets-documentation.s3.eu-west-3.amazonaws.com/amazon_reviews/amazon_reviews_2013.snappy.parquet
https://datasets-documentation.s3.eu-west-3.amazonaws.com/amazon_reviews/amazon_reviews_2014.snappy.parquet
https://datasets-documentation.s3.eu-west-3.amazonaws.com/amazon_reviews/amazon_reviews_2015.snappy.parquet
```

**用 stream load 导入数据**

```
curl --location-trusted -u root: -T amazon_reviews_2010.snappy.parquet -H "format:parquet" http://127.0.0.1:8030/api/${DB}/amazon_reviews/_stream_load
curl --location-trusted -u root: -T amazon_reviews_2011.snappy.parquet -H "format:parquet" http://127.0.0.1:8030/api/${DB}/amazon_reviews/_stream_load
curl --location-trusted -u root: -T amazon_reviews_2012.snappy.parquet -H "format:parquet" http://127.0.0.1:8030/api/${DB}/amazon_reviews/_stream_load
curl --location-trusted -u root: -T amazon_reviews_2013.snappy.parquet -H "format:parquet" http://127.0.0.1:8030/api/${DB}/amazon_reviews/_stream_load
curl --location-trusted -u root: -T amazon_reviews_2014.snappy.parquet -H "format:parquet" http://127.0.0.1:8030/api/${DB}/amazon_reviews/_stream_load
curl --location-trusted -u root: -T amazon_reviews_2015.snappy.parquet -H "format:parquet" http://127.0.0.1:8030/api/${DB}/amazon_reviews/_stream_load
```

:::info
上面的文件可能超过 10 GB，您可能需要调整 be.conf 的 streaming_load_max_mb 防止超过 stream load 文件上传大小的限制，可以通过下面方式动态调整
```bash
curl -X POST http://{be_ip}:{be_http_port}/api/update_config?streaming_load_max_mb=32768
```
需要每台 be 都执行上述命令。
:::

**SQL 运行 count() 确认导入数据成功**
```
mysql> SELECT COUNT() FROM amazon_reviews;
+-----------+
| count(*)  |
+-----------+
| 135589433 |
+-----------+
```


### 查询

**首先在没有索引的时候运行查询，WHERE 条件中有 LIKE，耗时 7.60s**

```
SELECT
    product_id,
    any(product_title),
    AVG(star_rating) AS rating,
    COUNT() AS count
FROM
    amazon_reviews
WHERE
    review_body LIKE '%is super awesome%'
GROUP BY
    product_id
ORDER BY
    count DESC,
    rating DESC,
    product_id
LIMIT 5;


+------------+------------------------------------------+--------------------+-------+
| product_id | any_value(product_title)                 | rating             | count |
+------------+------------------------------------------+--------------------+-------+
| B00992CF6W | Minecraft                                | 4.8235294117647056 |    17 |
| B009UX2YAC | Subway Surfers                           | 4.7777777777777777 |     9 |
| B00DJFIMW6 | Minion Rush: Despicable Me Official Game |              4.875 |     8 |
| B0086700CM | Temple Run                               |                  5 |     6 |
| B00KWVZ750 | Angry Birds Epic RPG                     |                  5 |     6 |
+------------+------------------------------------------+--------------------+-------+
5 rows in set (7.60 sec)
```


**然后添加 NGram BloomFilter 索引，再次运行相同的查询耗时 0.93s，性能提升了 8 倍**

```
ALTER TABLE amazon_reviews ADD INDEX review_body_ngram_idx(review_body) USING NGRAM_BF PROPERTIES("gram_size"="10", "bf_size"="10240");
```

```
+------------+------------------------------------------+--------------------+-------+
| product_id | any_value(product_title)                 | rating             | count |
+------------+------------------------------------------+--------------------+-------+
| B00992CF6W | Minecraft                                | 4.8235294117647056 |    17 |
| B009UX2YAC | Subway Surfers                           | 4.7777777777777777 |     9 |
| B00DJFIMW6 | Minion Rush: Despicable Me Official Game |              4.875 |     8 |
| B0086700CM | Temple Run                               |                  5 |     6 |
| B00KWVZ750 | Angry Birds Epic RPG                     |                  5 |     6 |
+------------+------------------------------------------+--------------------+-------+
5 rows in set (0.93 sec)
```
