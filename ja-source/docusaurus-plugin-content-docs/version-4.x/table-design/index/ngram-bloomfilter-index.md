---
{
  "title": "N-Gram BloomFilter インデックス",
  "language": "ja",
  "description": "n-gramトークン化は、文章やテキストの一部を複数の隣接する単語グループに分割する手法です。NGram BloomFilterインデックスは、"
}
---
## インデックス化の原理

n-gramトークン化は、文や文章を複数の隣接する単語グループに分割する手法です。NGram BloomFilterインデックスは、BloomFilterインデックスと同様に、BloomFilterに基づくスキップインデックスです。

BloomFilterインデックスとは異なり、NGram BloomFilterインデックスはテキストLIKEクエリを高速化するために使用されます。元のテキスト値を保存する代わりに、NGramを使用してテキストをトークン化し、各トークンをBloomFilterに保存します。LIKEクエリの場合、LIKE '%pattern%'のパターンもNGramを使用してトークン化されます。各トークンはBloomFilterに対してチェックされ、いずれかのトークンが見つからない場合、対応するデータブロックはLIKE条件を満たさないためスキップでき、IOを削減してクエリを高速化します。

## 使用ケース

NGram BloomFilterインデックスは文字列LIKEクエリのみを高速化でき、LIKEパターン内の連続文字数はNGramインデックスで定義されたN以上である必要があります。

:::tip

- NGram BloomFilterは文字列カラムのみをサポートし、LIKEクエリのみを高速化できます。
- NGram BloomFilterインデックスとBloomFilterインデックスは相互排他的で、カラムはどちらか一方のみを持つことができます。
- NGram BloomFilterインデックスのパフォーマンス分析は、BloomFilterインデックスのものと同様です。

:::

## インデックスの管理

### NGram BloomFilterインデックスの作成

インデックス定義はCREATE TABLE文のCOLUMN定義に従います：

```sql
INDEX `idx_column_name` (`column_name`) USING NGRAM_BF PROPERTIES("gram_size"="3", "bf_size"="1024") COMMENT 'username ngram_bf index'
```
構文の説明:

1. **`idx_column_name(column_name)`** は必須です。`column_name` はインデックスを作成する列で、上記の列定義に含まれている必要があります。`idx_column_name` はインデックス名で、テーブルレベルで一意である必要があります。プレフィックス `idx_` の後に列名を続けて命名することを推奨します。
2. **`USING NGRAM_BF`** は必須で、インデックスタイプがNGram BloomFilterインデックスであることを指定します。
3. **`PROPERTIES`** はオプションで、NGram BloomFilterインデックスの追加プロパティを指定するために使用されます。サポートされているプロパティは次のとおりです:
   - **gram_size**: NgramのNで、トークンを形成する連続文字数を指定します。例えば、'This is a simple ngram example' でN = 3の場合、'This is a'、'is a simple'、'a simple ngram'、'simple ngram example' (4つのトークン) にトークン化されます。
   - **bf_size**: BloomFilterのサイズ（ビット単位）。bf_sizeは各データブロックに対応するインデックスのサイズを決定します。この値が大きいほど、より多くのストレージ領域を占有しますが、ハッシュ衝突の確率は低くなります。

   **gram_size** はLIKEクエリの文字列の最小長に設定することを推奨しますが、2未満にはしないでください。一般的に、"gram_size"="3"、"bf_size"="1024" を推奨し、その後Query Profileに基づいて調整してください。

4. **`COMMENT`** はオプションで、インデックスコメントを指定します。

### NGram BloomFilterインデックスの表示

-- 構文1: USING NGRAM_BFを使用したテーブルスキーマのINDEXセクションは転置インデックスを示します

```sql
SHOW CREATE TABLE table_name;
```
-- 構文 2: IndexType が NGRAM_BF の場合は転置インデックスを示す

```sql
SHOW INDEX FROM idx_name;
```
### NGram BloomFilter インデックスの削除

```sql
ALTER TABLE table_ngrambf DROP INDEX idx_ngrambf;
```
### NGram BloomFilter インデックスの変更

```sql
CREATE INDEX idx_column_name2(column_name2) ON table_ngrambf USING NGRAM_BF PROPERTIES("gram_size"="3", "bf_size"="1024") COMMENT 'username ngram_bf index';

ALTER TABLE table_ngrambf ADD INDEX idx_column_name2(column_name2) USING NGRAM_BF PROPERTIES("gram_size"="3", "bf_size"="1024") COMMENT 'username ngram_bf index';
```
## インデックスの使用

NGram BloomFilter インデックスを使用するには、以下のパラメータを設定する必要があります（enable_function_pushdown はデフォルトで false です）：

```sql
SET enable_function_pushdown = true;
```
NGram BloomFilterインデックスは、次のようなLIKEクエリの高速化に使用されます：
SELECT count() FROM table1 WHERE message LIKE '%error%';

BloomFilterインデックス（NGramを含む）の高速化効果は、Query Profileの以下のメトリクスを使用して分析できます：
- RowsBloomFilterFiltered：BloomFilterインデックスによってフィルタされた行数。他のRows値と比較してインデックスのフィルタ効果を分析できます。
- BlockConditionsFilteredBloomFilterTime：BloomFilter転置インデックスによって消費された時間。

## 使用例

このセクションでは、Amazonの製品レビューデータセット`amazon_reviews`を使用して、NGram BloomFilterインデックスの使用方法と効果を実演します。

### テーブル作成

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
### データインポート

**以下のURLからwgetまたは他のツールを使用してデータセットをダウンロードしてください:**

```
https://datasets-documentation.s3.eu-west-3.amazonaws.com/amazon_reviews/amazon_reviews_2010.snappy.parquet
https://datasets-documentation.s3.eu-west-3.amazonaws.com/amazon_reviews/amazon_reviews_2011.snappy.parquet
https://datasets-documentation.s3.eu-west-3.amazonaws.com/amazon_reviews/amazon_reviews_2012.snappy.parquet
https://datasets-documentation.s3.eu-west-3.amazonaws.com/amazon_reviews/amazon_reviews_2013.snappy.parquet
https://datasets-documentation.s3.eu-west-3.amazonaws.com/amazon_reviews/amazon_reviews_2014.snappy.parquet
https://datasets-documentation.s3.eu-west-3.amazonaws.com/amazon_reviews/amazon_reviews_2015.snappy.parquet
```
**stream loadを使用してデータをインポートする:**

```shell
curl --location-trusted -u root: -T amazon_reviews_2010.snappy.parquet -H "format:parquet" http://127.0.0.1:8030/api/${DB}/amazon_reviews/_stream_load
curl --location-trusted -u root: -T amazon_reviews_2011.snappy.parquet -H "format:parquet" http://127.0.0.1:8030/api/${DB}/amazon_reviews/_stream_load
curl --location-trusted -u root: -T amazon_reviews_2012.snappy.parquet -H "format:parquet" http://127.0.0.1:8030/api/${DB}/amazon_reviews/_stream_load
curl --location-trusted -u root: -T amazon_reviews_2013.snappy.parquet -H "format:parquet" http://127.0.0.1:8030/api/${DB}/amazon_reviews/_stream_load
curl --location-trusted -u root: -T amazon_reviews_2014.snappy.parquet -H "format:parquet" http://127.0.0.1:8030/api/${DB}/amazon_reviews/_stream_load
curl --location-trusted -u root: -T amazon_reviews_2015.snappy.parquet -H "format:parquet" http://127.0.0.1:8030/api/${DB}/amazon_reviews/_stream_load
```
:::info
データファイルが10GBを超える場合があり、stream loadのアップロードサイズ制限を超えないようにbe.confのstreaming_road_max_mbを調整する必要がある可能性があります。以下の手順に従って動的に調整することができます：

```bash
curl -X POST http://{be_ip}:{be_http_port}/api/update_config?streaming_load_max_mb=32768
```
すべてのBEは上記のコマンドを実行する必要があります。
:::

**データインポートが正常に完了したことを確認するためにカウントクエリを実行する:**

```sql
mysql> SELECT COUNT(*) FROM amazon_reviews;
+-----------+
| count(*)  |
+-----------+
| 135589433 |
+-----------+
```
### クエリの実行

**まず、インデックスなしでクエリを実行します。WHERE句にLIKE条件が含まれており、クエリの実行には7.60秒かかります:**

```sql
SELECT
    product_id,
    any(product_title),
    AVG(star_rating) AS rating,
    COUNT(*) AS count
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
```
**結果:**

```sql
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
**次に、NGram BloomFilter インデックスを追加し、同じクエリを再度実行します。クエリは0.93秒で完了し、8倍のパフォーマンス向上が得られました：**

```sql
ALTER TABLE amazon_reviews ADD INDEX review_body_ngram_idx(review_body) USING NGRAM_BF PROPERTIES("gram_size"="10", "bf_size"="10240");
```
```sql
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
