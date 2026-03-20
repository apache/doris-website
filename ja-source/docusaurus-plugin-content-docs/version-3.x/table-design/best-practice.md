---
{
  "title": "ベストプラクティス | table設計",
  "language": "ja",
  "description": "ソート列のみが指定された場合、同じキーを持つ行はマージされません。",
  "sidebar_label": "Best Practices"
}
---
# ベストプラクティス

## データモデル

> Dorisは、DUPLICATE KEYモデル、UNIQUE KEYモデル、AGGREGATE KEYモデルの3つのモデルでデータを整理します。

:::tip
**推奨事項**

データモデルはテーブル作成時に決定され、**不変**であるため、最も適切なデータモデルを選択することが重要です。

1. Duplicate Keyモデルは、任意の次元でのアドホッククエリに適しています。事前集計の利点を活用することはできませんが、集計モデルの制限にも制約されないため、列指向ストレージの利点（すべてのキー列を読み取る必要なく、関連する列のみを読み取る）を活用できます。
2. Aggregate Keyモデルは、事前集計により、集計クエリでスキャンするデータ量と計算負荷を大幅に削減できます。固定パターンのレポートクエリに特に適しています。ただし、このモデルはcount(*)クエリには適していません。また、Value列の集計方法が固定されているため、他のタイプの集計クエリを実行する際はセマンティック正確性に特別な注意を払う必要があります。
3. Unique Keyモデルは、一意の主キー制約が必要なシナリオ向けに設計されています。主キーの一意性を保証できます。欠点は、マテリアライゼーションと事前集計がもたらす利点を得られないことです。集計クエリで高いパフォーマンス要件があるユーザーには、Doris 1.2以降のUnique KeyモデルのMerge-on-Write機能の使用を推奨します。
4. 部分列更新要件があるユーザーは、以下のデータモデルから選択できます：
   1. Unique Keyモデル（Merge-on-Writeモード）
   2. Aggregate Keyモデル（REPLACE_IF_NOT_NULLで集計）
:::

### DUPLICATE KEYモデル

![duplicate-key-model-example](/images/duplicate-key-model-example.png)

ソート列のみを指定した場合、同じキーを持つ行はマージされません。

これは、データの事前集計を必要としない分析ビジネスシナリオに適用されます：

- 生データの分析
- 新しいデータのみが追加されるログや時系列データの分析

**ベストプラクティス**

```SQL
-- For example, log analysis that allows only appending new data with replicated KEYs.
CREATE TABLE session_data
(
    visitorid   SMALLINT,
    sessionid   BIGINT,
    visittime   DATETIME,
    city        CHAR(20),
    province    CHAR(20),
    ip          varchar(32),
    brower      CHAR(20),
    url         VARCHAR(1024)
)
DUPLICATE KEY(visitorid, sessionid) -- Used solely for specifying sorting columns, rows with the same KEY will not be merged.
DISTRIBUTED BY HASH(sessionid, visitorid) BUCKETS 10;
```
### AGGREGATE KEY model

![aggregate-key-model-example](/images/aggregate-key-model-example.png)

同じAGGREGATE KEYを持つ古いレコードと新しいレコードは集約されます。現在サポートされている集約方法は以下の通りです：

1. SUM: 複数行の値を累積して合計を計算します；
2. REPLACE: 以前にインポートされた行の値を次のデータバッチの値で置き換えます；
3. MAX: 最大値を保持します；
4. MIN: 最小値を保持します；
5. REPLACE_IF_NOT_NULL: null以外の値を置き換えます。REPLACEとは異なり、null値は置き換えません；
6. HLL_UNION: HyperLogLogアルゴリズムを使用してHLL型の列を集約します；
7. BITMAP_UNION: ビットマップ結合集約を使用してBITMAP型の列を集約します；

これは以下のようなレポーティングおよび多次元分析シナリオに適しています：

- Webサイトのトラフィック分析
- データレポートの多次元分析

**ベストプラクティス**

```SQL
-- Example of website traffic analysis
CREATE TABLE site_visit
(
    siteid      INT,
    city        SMALLINT,
    username    VARCHAR(32),
    pv BIGINT   SUM DEFAULT '0' -- PV caculation
)
AGGREGATE KEY(siteid, city, username) -- Rows with the same KEY will be merged, and non-key columns will be aggregated based on the specified aggregation function.
DISTRIBUTED BY HASH(siteid) BUCKETS 10;
```
### UNIQUE KEY モデル

新しいレコードは、同じUNIQUE KEYを持つ古いレコードを置き換えます。Doris 1.2以前では、UNIQUE KEYモデルはAGGREGATE KEYモデルのREPLACE集計と同じ方法で実装されていました。しかし、Doris 1.2以降、UNIQUE KEYモデルにMerge-on-Write実装を導入し、集計クエリのパフォーマンスを向上させています。

これは、以下のような更新を必要とする分析ビジネスシナリオに適しています：

- 重複除去された注文分析
- 挿入、更新、削除のリアルタイム同期

**ベストプラクティス**

```SQL
-- Example of deduplicated order analysis
CREATE TABLE sales_order
(
    orderid     BIGINT,
    status      TINYINT,
    username    VARCHAR(32),
    amount      BIGINT DEFAULT '0'
)
UNIQUE KEY(orderid) -- Rows of the same KEY will be merged
DISTRIBUTED BY HASH(orderid) BUCKETS 10;
```
## Index

> インデックスはデータの高速なフィルタリングと検索を促進できます。現在、Dorisは2種類のインデックスをサポートしています：
>
> 1. 内蔵スマートインデックス（prefix indexとZoneMap indexを含む）
> 2. ユーザー作成セカンダリインデックス（inverted index、BloomFilter index、Ngram BloomFilter index、Bitmap indexを含む）

### **Prefix index**

Prefix indexは、Aggregate、Unique、Duplicateデータモデルの内蔵インデックスです。基盤となるデータストレージは、それぞれのテーブル作成文でAGGREGATE KEY、UNIQUE KEY、またはDUPLICATE KEYとして指定された列に基づいてソートされて保存されます。ソートされたデータの上に構築されたPrefix indexにより、指定されたprefix列に基づいた高速なデータクエリが可能になります。

Prefix indexはスパースインデックスであり、キーが存在する正確な行を特定することはできません。代わりに、キーが存在する可能性のある範囲を大まかに特定し、その後二分探索アルゴリズムを使用してキーの位置を正確に特定します。

:::tip
**推奨事項**

1. テーブル作成時、**正しい列順序はクエリ効率を大幅に向上させることができます**。
   1. 列順序はテーブル作成時に指定されるため、テーブルは1つのタイプのprefix indexのみを持つことができます。しかし、これはprefix indexのない列に基づくクエリには十分効率的でない場合があります。そのような場合、ユーザーはマテリアライズドビューを作成することで列順序を調整できます。
2. prefix indexの最初のフィールドは、常に最長のクエリ条件のフィールドであるべきで、高カーディナリティフィールドであるべきです。
   1. Bucketingフィールド：比較的均等なデータ分布を持ち、頻繁に使用される、できれば高カーディナリティフィールドであるべきです。
   2. Int(4) + Int(4) + varchar(50)：prefix indexの長さは28のみです。
   3. Int(4) + varchar(50) + Int(4)：prefix indexの長さは24のみです。
   4. varchar(10) + varchar(50)：prefix indexの長さは30のみです。
   5. Prefix index（36文字）：最初のフィールドが最高のクエリパフォーマンスを提供します。varcharフィールドが検出された場合、prefix indexは自動的に最初の20文字で切り捨てます。
   6. 可能であれば、最も頻繁に使用されるクエリフィールドをprefix indexに含めてください。そうでなければ、それらをbucketingフィールドとして指定してください。
3. Dorisはprefix indexの最初の36バイトのみを利用できるため、prefix indexのフィールド長はできるだけ明示的であるべきです。
4. データ範囲に対してパーティショニング、bucketing、prefix indexストラテジーを設計することが困難な場合は、加速のためにinverted indexの導入を検討してください。
:::

### **ZoneMap index**

ZoneMap indexは、カラム型ストレージ形式で列ごとに自動的に維持されるインデックス情報です。Min/Max値やNull値の数などの情報が含まれます。データクエリ中、ZoneMap indexは範囲条件を使用してフィルタリングされたフィールドに基づいて、スキャンするデータ範囲を選択するために利用されます。

例えば、以下のクエリ文で「age」フィールドをフィルタリングする場合：

```Shell
SELECT * FROM table WHERE age > 0 and age < 51;
```
Short Key Indexがヒットしなかった場合、ZoneMapインデックスを使用して、"age"フィールドのクエリ条件に基づいてスキャンが必要なデータ範囲（"ordinary"範囲として知られる）を決定します。これにより、スキャンが必要なページ数が削減されます。

### **転置インデックス**

Dorisはバージョン2.0.0以降で転置インデックスをサポートしています。転置インデックスは、テキストデータの全文検索や、通常の数値型および日付型の範囲クエリに使用できます。大量のデータから条件を満たす行の高速フィルタリングを可能にします。

**ベストプラクティス**

```SQL
-- Inverted index can be specified during table creation or added later. This is an example of specifying it during table creation:
CREATE TABLE table_name
(
  columns_difinition,
  INDEX idx_name1(column_name1) USING INVERTED [PROPERTIES("parser" = "english|unicode|chinese")] [COMMENT 'your comment']
  INDEX idx_name2(column_name2) USING INVERTED [PROPERTIES("parser" = "english|unicode|chinese")] [COMMENT 'your comment']
  INDEX idx_name3(column_name3) USING INVERTED [PROPERTIES("parser" = "chinese", "parser_mode" = "fine_grained|coarse_grained")] [COMMENT 'your comment']
  INDEX idx_name4(column_name4) USING INVERTED [PROPERTIES("parser" = "english|unicode|chinese", "support_phrase" = "true|false")] [COMMENT 'your comment']
  INDEX idx_name5(column_name4) USING INVERTED [PROPERTIES("char_filter_type" = "char_replace", "char_filter_pattern" = "._"), "char_filter_replacement" = " "] [COMMENT 'your comment']
  INDEX idx_name5(column_name4) USING INVERTED [PROPERTIES("char_filter_type" = "char_replace", "char_filter_pattern" = "._")] [COMMENT 'your comment']
)
table_properties;

-- Example: keyword matching in full-text searches, implemented by MATCH_ANY MATCH_ALL
SELECT * FROM table_name WHERE column_name MATCH_ANY | MATCH_ALL 'keyword1 ...';
```
:::tip
**推奨事項**

1. データ範囲に対してパーティション分割、バケット化、プレフィックスインデックス戦略を設計することが困難な場合は、高速化のためにinverted indexの導入を検討してください。
:::


:::caution
**制限事項**

1. 異なるデータモデルでは、inverted indexに対して異なる制限があります。
   1. Aggregate KEYモデル: Keyカラムに対してのみinverted indexを許可
   2. Unique KEYモデル: Merge-on-Writeを有効にした後、任意のカラムに対してinverted indexを許可
   3. Duplicate KEYモデル: 任意のカラムに対してinverted indexを許可
:::

### **BloomFilter index**

Dorisは、値の区別性が高いフィールドにBloomFilter indexを追加することをサポートしており、高カーディナリティを持つカラムでの等価クエリを含むシナリオに適しています。

**ベストプラクティス**

```SQL
-- Example: add "bloom_filter_columns"="k1,k2,k3" in the PROPERTIES of the table creation statement.
-- To create BloomFilter index for saler_id and category_id in the table.
CREATE TABLE IF NOT EXISTS sale_detail_bloom  (
    sale_date date NOT NULL COMMENT "Sale data",
    customer_id int NOT NULL COMMENT "Customer ID",
    saler_id int NOT NULL COMMENT "Saler ID",
    sku_id int NOT NULL COMMENT "SKU ID",
    category_id int NOT NULL COMMENT "Category ID",
    sale_count int NOT NULL COMMENT "Sale count",
    sale_price DECIMAL(12,2) NOT NULL COMMENT "Sale price",
    sale_amt DECIMAL(20,2)  COMMENT "Sale amount"
)
Duplicate  KEY(sale_date, customer_id,saler_id,sku_id,category_id)
DISTRIBUTED BY HASH(saler_id) BUCKETS 10
PROPERTIES (
"bloom_filter_columns"="saler_id,category_id"
);
```
:::caution
**制限事項**

1. BloomFilterインデックスは、Tinyint、Float、Double型のカラムではサポートされていません。
2. BloomFilterインデックスは、「in」および「=」演算子を使用したフィルタリングのみを高速化できます。
3. BloomFilterインデックスは、「in」または「=」演算子を含むクエリ条件において、高カーディナリティのカラム（5000以上）に構築する必要があります。
   1. BloomFilterインデックスは、非プレフィックスフィルタリングに適しています。
   2. クエリはカラム内の高頻度値に基づいてフィルタリングを行い、フィルタリング条件は主に「in」と「=」です。
   3. Bitmapインデックスとは異なり、BloomFilterインデックスはUserIDなどの高カーディナリティカラムに適しています。「性別」のような低カーディナリティカラムに作成した場合、各ブロックにはほぼすべての値が含まれ、BloomFilterインデックスは無意味になります。
   4. データカーディナリティが全範囲の約半分程度のケースに適しています。
   5. ID番号など、等価（=）クエリを行う高カーディナリティカラムの場合、BloomFilterインデックスを使用することでパフォーマンスを大幅に向上させることができます。
:::

### **Ngram BloomFilterインデックス**

2.0.0以降、Dorisは「**LIKE**」クエリのパフォーマンスを向上させるためにNGram BloomFilterインデックスを導入しました。

**ベストプラクティス**

```SQL
-- Example of creating NGram BloomFilter index in table creation statement
CREATE TABLE `nb_table` (
  `siteid` int(11) NULL DEFAULT "10" COMMENT "",
  `citycode` smallint(6) NULL COMMENT "",
  `username` varchar(32) NULL DEFAULT "" COMMENT "",
  INDEX idx_ngrambf (`username`) USING NGRAM_BF PROPERTIES("gram_size"="3", "bf_size"="256") COMMENT 'username ngram_bf index'
) ENGINE=OLAP
AGGREGATE KEY(`siteid`, `citycode`, `username`) COMMENT "OLAP"
DISTRIBUTED BY HASH(`siteid`) BUCKETS 10;

-- PROPERTIES("gram_size"="3", "bf_size"="256"), representing the number of grams and the byte size of the BloomFilter
-- The number of grams is determined according to the query cases and is typically set to the length of the majority of query strings. The number of bytes in the BloomFilter can be determined after testing. Generally, a larger number of bytes leads to better filtering results, and it is recommended to start with a value of 256 for testing and evaluating the effectiveness. However, it's important to note that a larger number of bytes also increases the storage cost of the index.
-- With high data cardinality, there is no need to set a large BloomFilter size. Conversely, with low data cardinality, increase the BloomFilter size to enhance filtering efficiency.
```
:::caution
**制限事項**

1. NGram BloomFilter インデックスは文字列カラムのみをサポートします。
2. NGram BloomFilter インデックスと BloomFilter インデックスは相互排他的であり、同一カラムに対してはどちらか一方のみを設定できます。
3. NGram と BloomFilter のサイズは、実際の状況に基づいて最適化できます。NGram サイズが比較的小さい場合は、BloomFilter サイズを増やすことができます。
4. 数十億以上の規模のデータで、あいまい検索が必要な場合は、転置インデックスまたは NGram BloomFilter の使用を推奨します。
:::

### **Bitmap インデックス**

データクエリを高速化するため、Doris では特定のフィールドに Bitmap インデックスを追加することをサポートしています。これは、カーディナリティが低いカラムに対する等価または範囲クエリを含むシナリオに適しています。

**ベストプラクティス**

```SQL
-- Example: create Bitmap index for siteid on bitmap_table
CREATE INDEX [IF NOT EXISTS] bitmap_index_name ON
bitmap_table (siteid)
USING BITMAP COMMENT 'bitmap_siteid';
```
:::caution
**制限事項**

1. Bitmapインデックスは単一のカラムにのみ作成できます。
2. Bitmapインデックスは、`Duplicate`および`Unique` Keyモデルのすべてのカラム、ならびに`Aggregate` Keyモデルのキーカラムに適用できます。
3. Bitmapインデックスは以下のデータ型をサポートします：
   1. `TINYINT`
   2. `SMALLINT`
   3. `INT`
   4. `BIGINT`
   5. `CHAR`
   6. `VARCHAR`
   7. `DATE`
   8. `DATETIME`
   9. `LARGEINT`
   10. `DECIMAL`
   11. `BOOL`
4. BitmapインデックスはSegment V2でのみ有効です。Bitmapインデックスを持つテーブルのストレージ形式は、デフォルトでV2形式に自動的に変換されます。
5. Bitmapインデックスは一定のカーディナリティ範囲内で構築すべきです。極端に高いまたは低いカーディナリティのケースには適していません。
   1. 職業フィールドや都市フィールドなど、カーディナリティが100から100,000の間のカラムに推奨されます。重複率が高すぎる場合、他のタイプのインデックスと比較してBitmapインデックスを構築する大きな利点はありません。重複率が低すぎる場合、Bitmapインデックスは空間効率とパフォーマンスを大幅に低下させる可能性があります。count、OR、AND操作などの特定のタイプのクエリは、ビット演算のみを必要とします。
   2. Bitmapインデックスは直交クエリにより適しています。
:::

## フィールドタイプ

DorisはBITMAPによる精密重複除去、HLLによるファジー重複除去、ARRAY/MAP/JSONなどの半構造化データ型、および一般的な数値、文字列、時間型など、さまざまなフィールドタイプをサポートします。

:::tip
**推奨事項**

1. VARCHAR 
   1. 長さ範囲が1-65533バイトの可変長文字列です。UTF-8エンコーディングで格納され、英字は通常1バイトを占有します。
   2. varchar(255)とvarchar(65533)のパフォーマンス差について誤解がよくあります。両方のケースで格納されるデータが同じであれば、パフォーマンスも同じです。テーブル作成時にフィールドの最大長が不明な場合は、過度に長い文字列によるインポートエラーを防ぐためにvarchar(65533)の使用を推奨します。
2. STRING 
   1. デフォルトサイズが1048576バイト（1MB）の可変長文字列で、2147483643バイト（2GB）まで増加可能です。UTF-8エンコーディングで格納され、英字は通常1バイトを占有します。
   2. 値カラムでのみ使用でき、キーカラムやパーティショニングカラムでは使用できません。
   3. 大きなテキストコンテンツの格納に適しています。ただし、そのような要件が存在しない場合は、VARCHARの使用を推奨します。STRINGカラムはキーカラムやパーティショニングカラムで使用できないという制限があります。
3. 数値フィールド：必要な精度に基づいて適切なデータ型を選択してください。これに関する特別な制限はありません。
4. 時間フィールド：高精度要件（ミリ秒精度のタイムスタンプ）がある場合は、datetime(6)の使用を指定する必要があることに注意してください。そうでなければ、そのようなタイムスタンプはデフォルトでサポートされません。
5. JSONデータの格納には、string型ではなくJSONデータ型の使用を推奨します。
:::

## テーブル作成

![create-table-example](/images/create-table-example.png)

テーブル作成時の考慮事項には、データモデル、インデックス、フィールドタイプに加えて、データパーティションとバケットの設定が含まれます。

**ベストプラクティス**

```SQL
-- Take Merge-on-Write tables in the Unique Key model as an example:
-- Merge-on-Write in the Unique Key model is implemented in a different way from the Aggregate Key model. The performance of it is similar to that on the Duplicate Key model.
-- In use cases requiring primary key constraints, the Aggregate Key model can deliver much better query performance compared to the Duplicate Key model, especially in aggregate queries and queries that involve filtering a large amount of data using indexes.

-- For non-partitioned tables
CREATE TABLE IF NOT EXISTS tbl_unique_merge_on_write
(
    `user_id` LARGEINT NOT NULL COMMENT "Use ID",
    `username` VARCHAR(50) NOT NULL COMMENT "Username",
    `register_time` DATE COMMENT "User registration time",
    `city` VARCHAR(20) COMMENT "User city",
    `age` SMALLINT COMMENT "User age",
    `sex` TINYINT COMMENT "User gender",
    `phone` LARGEINT COMMENT "User phone number",
    `address` VARCHAR(500) COMMENT "User address"
)
UNIQUE KEY(`user_id`, `username`)
-- Data volume of 3~5G
DISTRIBUTED BY HASH(`user_id`) BUCKETS 10 
PROPERTIES (
-- In Doris 1.2.0, as a new feature, Merge-on-Write is disabled by default. Users can enable it by adding the following property.
"enable_unique_key_merge_on_write" = "true" 
);

-- For partitioned tables
CREATE TABLE IF NOT EXISTS tbl_unique_merge_on_write_p
(
    `user_id` LARGEINT NOT NULL COMMENT "Use ID",
    `username` VARCHAR(50) NOT NULL COMMENT "Username",
    `register_time` DATE COMMENT "User registration time",
    `city` VARCHAR(20) COMMENT "User city",
    `age` SMALLINT COMMENT "User age",
    `sex` TINYINT COMMENT "User gender",
    `phone` LARGEINT COMMENT "User phone number",
    `address` VARCHAR(500) COMMENT "User address"
)
UNIQUE KEY(`user_id`, `username`, `register_time`)
PARTITION BY RANGE(`register_time`) (
    PARTITION p00010101_1899 VALUES [('0001-01-01'), ('1900-01-01')), 
    PARTITION p19000101 VALUES [('1900-01-01'), ('1900-01-02')), 
    PARTITION p19000102 VALUES [('1900-01-02'), ('1900-01-03')),
    PARTITION p19000103 VALUES [('1900-01-03'), ('1900-01-04')),
    PARTITION p19000104_1999 VALUES [('1900-01-04'), ('2000-01-01')),
    FROM ("2000-01-01") TO ("2022-01-01") INTERVAL 1 YEAR, 
    PARTITION p30001231 VALUES [('3000-12-31'), ('3001-01-01')), 
    PARTITION p99991231 VALUES [('9999-12-31'), (MAXVALUE)) 
) 
-- Data volume of 3~5G
DISTRIBUTED BY HASH(`user_id`) BUCKETS 10 
PROPERTIES ( 
-- In Doris 1.2.0, as a new feature, Merge-on-Write is disabled by default. Users can enable it by adding the following property.
"enable_unique_key_merge_on_write" = "true", 
-- The unit for dynamic partition scheduling can be specified as HOUR, DAY, WEEK, MONTH, or YEAR.
"dynamic_partition.time_unit" = "MONTH",
-- The starting offset for dynamic partitioning is specified as a negative number. Depending on the value of the time_unit, it uses the current day (week/month) as the reference point, partitions prior to this offset will be deleted (TTL). If not specified, the default value is -2147483648, indicating that historical partitions will not be deleted.
"dynamic_partition.start" = "-3000",
-- The ending offset for dynamic partitioning is specified as a positive number. Depending on the value of the time_unit, it uses the current day (week/month) as the reference point. Create the corresponding partitions of the specified range in advance.
"dynamic_partition.end" = "10",
-- The prefix for names of the dynamically created partitions (required).
"dynamic_partition.prefix" = "p",
-- The number of buckets corresponding to the dynamically created partitions.
"dynamic_partition.buckets" = "10", 
"dynamic_partition.enable" = "true", 
-- The following is the number of replicas corresponding to dynamically created partitions. If not specified, the default value will be the replication factor specified when creating the table, which is typically 3.
"dynamic_partition.replication_num" = "3",
"replication_num" = "3"
);  

-- View existing partitions
-- The actual number of created partitions is determined by a combination of dynamic_partition.start, dynamic_partition.end, and the settings of PARTITION BY RANGE.
show partitions from tbl_unique_merge_on_write_p;
```
:::caution
**制約事項**

1. UTF-8のみサポートされているため、データベース文字セットはUTF-8として指定する必要があります。
2. テーブルのレプリケーション係数は3である必要があります（指定されていない場合、デフォルトは3です）。
3. 個々のtabletのデータ量（**Tablet Count = Partition Count \* Bucket Count \* Replication Factor**）は理論的には上限や下限はありませんが、小さなテーブル（数百メガバイトから1ギガバイトの範囲）を除いて、1GBから10GBの範囲内に収めることを確実にする必要があります：
   1. 個々のtabletのデータ量が小さすぎると、データ集約パフォーマンスが悪化し、メタデータ管理のオーバーヘッドが増加する可能性があります。
   2. データ量が大きすぎると、レプリカの移行や同期が妨げられ、スキーマ変更やマテリアライゼーション操作のコストが増加します（これらの操作はtabletの粒度で再試行されます）。
4. 5億レコードを超えるデータの場合、**パーティショニングとバケッティング**戦略を実装する必要があります：
   
   1. **バケッティングの推奨事項：**
      1. 大きなテーブルの場合、各tabletは1GBから10GBの範囲にして、小さなファイルが大量に生成されることを防ぐ必要があります。
      2. 約100メガバイトのディメンションテーブルの場合、tabletの数は3から5の範囲内に制御する必要があります。これにより、過度に小さなファイルを生成することなく、一定レベルの同時実行性が確保されます。
   2. パーティショニングが不可能で、動的な時間ベースのパーティショニングの可能性なしにデータが急速に成長する場合、データ保持期間（180日）に基づいてデータ量に対応するためにバケット数を増やすことをお勧めします。各バケットのサイズは1GBから10GBの間に保つことを引き続き推奨します。
   3. バケッティングフィールドにsaltingを適用し、bucket pruning機能を活用するためにクエリに同じsalting戦略を使用してください。
   4. ランダムバケッティング：
      1. OLAPテーブルに更新が必要なフィールドがない場合、データバケッティングモードをRANDOMに設定することで、深刻なデータスキューを回避できます。データ取り込み中に、各バッチのデータはランダムにtabletに割り当てられて書き込まれます。
      2. テーブルのバケッティングモードがRANDOMに設定されている場合、バケッティングカラムがないため、テーブルのクエリはバケッティングカラムの値に基づいて特定のバケットをクエリする代わりに、ヒットしたパーティション内のすべてのバケットをスキャンします。この設定は、高同時実行ポイントクエリではなく、全体的な集約および分析クエリに適しています。
      3. OLAPテーブルのデータがランダム分布している場合、データ取り込み中に`load_to_single_tablet`パラメータをtrueに設定することで、各タスクが単一のtabletに書き込むことができます。これにより、大規模データ取り込み中の同時実行性とスループットが向上します。また、データ取り込みとcompactionによって引き起こされる書き込み増幅を削減し、クラスターの安定性を確保することもできます。
   5. 成長が遅いディメンションテーブルは、単一のパーティションを使用し、一般的に使用されるクエリ条件（バケッティングフィールドのデータ分布が比較的均等である場合）に基づいてバケッティングを適用できます。
   6. ファクトテーブル。


5. 大量の履歴パーティションデータがあるが、履歴データが比較的小さい、不均衡である、またはクエリ頻度が低いシナリオでは、データを特別なパーティションに配置する以下のアプローチを使用できます。小さなサイズの履歴データに対して履歴パーティションを作成できます（例：年次パーティション、月次パーティション）。例えば、データ`FROM ("2000-01-01") TO ("2022-01-01") INTERVAL 1 YEAR`に対して履歴パーティションを作成できます：

   ```sql

   PARTITION p00010101_1899 VALUES [('0001-01-01'), ('1900-01-01')), 

   PARTITION p19000101 VALUES [('1900-01-01'), ('1900-01-02')), 

   ...

   PARTITION p19000104_1999 VALUES [('1900-01-04'), ('2000-01-01')),

   FROM ("2000-01-01") TO ("2022-01-01") INTERVAL 1 YEAR, 

   PARTITION p30001231 VALUES [('3000-12-31'), ('3001-01-01')), 

   PARTITION p99991231 VALUES [('9999-12-31'), (MAXVALUE)) 

   ```
:::
