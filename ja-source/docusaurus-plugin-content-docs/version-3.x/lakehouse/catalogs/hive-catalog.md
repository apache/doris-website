---
{
  "title": "Hive カタログ",
  "description": "Hive MetastoreまたはHive Metastoreと互換性のあるメタデータサービスに接続することで、DorisはHiveデータベースとtable情報を自動的に取得できます...",
  "language": "ja"
}
---
# Hive カタログ

Hive MetastoreまたはHive Metastoreと互換性のあるメタデータサービスに接続することで、DorisはHiveデータベースとtable情報を自動的に取得し、データクエリを実行できます。

Hiveに加えて、多くの他のシステムがメタデータの保存にHive Metastoreを使用しています。そのため、Hive カタログを通じて、HiveTableだけでなく、IcebergやHudiなどのHive Metastoreをメタデータストレージに使用する他のtable形式にもアクセスできます。

## 適用シナリオ

| シナリオ | 説明 |
|----------|------|
| クエリ加速 | Dorisの分散コンピューティングエンジンを使用してHiveデータに直接アクセスし、クエリを高速化します。 |
| データ統合 | Hiveデータを読み取ってDoris内部tableに書き込むか、Dorisコンピューティングエンジンを使用してZeroETL操作を実行します。 |
| データ書き戻し | Dorisがサポートする任意のソースからデータを処理し、HiveTableに書き戻します。 |

## カタログの設定

### 構文

```sql
CREATE CATALOG [IF NOT EXISTS] catalog_name PROPERTIES (
    'type'='hms', -- required
    'hive.metastore.type' = '<hive_metastore_type>', -- optional
    'hive.version' = '<hive_version>', -- optional
    'fs.defaultFS' = '<fs_defaultfs>', -- optional
    {MetaStoreProperties},
    {StorageProperties},
    {CommonProperties},
    {OtherProperties}
);
```
* `<hive_metastore_type>`

  Hive Metastoreの種類を指定します。

  * `hms`: 標準的なHive Metastoreサービス。
  * `glue`: Hive Metastore互換インターフェースを使用してAWS Glueメタデータサービスにアクセス。
  * `dlf`: Hive Metastore互換インターフェースを使用してAlibaba Cloud DLFメタデータサービスにアクセス。

* `<fs_defaultfs>`

  このパラメータは、DorisからこのHive Catalog内のTableにデータを書き込む際に必須です。例：

  `'fs.defaultFS' = 'hdfs://namenode:port'`

* `{MetaStoreProperties}`

  MetaStorePropertiesセクションは、Metastoreメタデータサービスの接続と認証情報を入力するためのものです。詳細については「サポートされるメタデータサービス」セクションを参照してください。

* `{StorageProperties}`

  StoragePropertiesセクションは、ストレージシステムに関連する接続と認証情報を入力するためのものです。詳細については「サポートされるストレージシステム」セクションを参照してください。

* `{CommonProperties}`

  CommonPropertiesセクションは、共通の属性を入力するためのものです。[カタログ 概要](../catalog-overview.md)の「Common Properties」セクションを参照してください。

* `{OtherProperties}`

  OtherPropertiesセクションは、Hive Catalogに関連するプロパティを入力するためのものです。

  * `get_schema_from_table`：デフォルト値はfalseです。デフォルトでは、DorisはHive MetastoreからTableスキーマ情報を取得します。しかし、場合によっては互換性の問題が発生することがあり、例えば`Storage schema reading not supported`のようなエラーが発生することがあります。この場合、このパラメータをtrueに設定すると、TableスキーマはTableオブジェクトから直接取得されます。ただし、この方法では列のデフォルト値情報が無視されることにご注意ください。このプロパティはバージョン2.1.10および3.0.6以降でサポートされています。

### サポートされるHiveバージョン

Hive 1.x、2.x、3.x、および4.xをサポートします。

HiveトランザクショナルTableはバージョン3.x以降でサポートされます。詳細については「HiveトランザクショナルTable」セクションを参照してください。

### サポートされるメタデータサービス

* [Hive Metastore](../metastores/hive-metastore.md)
* [AWS Glue](../metastores/aws-glue.md)
* [Aliyun DLF](../metastores/aliyun-dlf.md)

### サポートされるストレージシステム

* [HDFS](../storages/hdfs.md)
* [AWS S3](../storages/s3.md)
* Google Cloud Storage
* [Alibaba Cloud OSS](../storages/aliyun-oss.md)
* [Tencent Cloud COS](../storages/tencent-cos.md)
* [Huawei Cloud OBS](../storages/huawei-obs.md)
* [MINIO](../storages/minio.md)

> Dorisを通じてHiveTableを作成し、データを書き込むには、Catalog属性に`fs.defaultFS`プロパティを明示的に追加する必要があります。Catalogがクエリのためだけに作成される場合、このパラメータは省略できます。

### サポートされるデータフォーマット

* Hive

  * [ Parquet](../file-formats/parquet.md)

  * [ ORC](../file-formats/orc.md)

  * [ Text/CSV/JSON](../file-formats/text.md)

* Hudi

  * [ Parquet](../file-formats/parquet.md)

  * [ ORC](../file-formats/orc.md)

* Iceberg

  * [ Parquet](../file-formats/parquet.md)

  * [ ORC](../file-formats/orc.md)

## カラム型マッピング

| Hive タイプ     | Doris タイプ    | Comment                                        |
| ------------- | ------------- | ---------------------------------------------- |
| boolean       | boolean       |                                                |
| tinyint       | tinyint       |                                                |
| smallint      | smallint      |                                                |
| int           | int           |                                                |
| bigint        | bigint        |                                                |
| date          | date          |                                                |
| timestamp     | datetime(6)   | 精度6のdatetimeにマップされます                     |
| float         | float         |                                                |
| double        | double        |                                                |
| decimal(P, S) | decimal(P, S) | 精度が指定されていない場合、デフォルトでdecimal(9, 0)になります |
| char(N)       | char(N)       |                                                |
| varchar(N)    | varchar(N)    |                                                |
| string        | string        |                                                |
| binary        | string        |                                                |
| array         | array         |                                                |
| map           | map           |                                                |
| struct        | struct        |                                                |
| other         | unsupported   |                                                |


## 例

### Hive on HDFS

```sql
CREATE CATALOG hive_hdfs PROPERTIES (
    'type' = 'hms',
    'hive.metastore.uris' = 'thrift://172.0.0.1:9083'
);
```
### HAを使用したHDFS上のHive

```sql
CREATE CATALOG hive_hdfs_ha PROPERTIES (
    'type' = 'hms',
    'hive.metastore.uris' = 'thrift://172.0.0.1:9083',
    'dfs.nameservices' = 'your-nameservice',
    'dfs.ha.namenodes.your-nameservice' = 'nn1,nn2',
    'dfs.namenode.rpc-address.your-nameservice.nn1' = '172.21.0.2:8088',
    'dfs.namenode.rpc-address.your-nameservice.nn2' = '172.21.0.3:8088',
    'dfs.client.failover.proxy.provider.your-nameservice' = 'org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider'
);
```
### Hive on ViewFS

```sql
CREATE CATALOG hive_viewfs PROPERTIES (
    'type' = 'hms',
    'hive.metastore.uris' = 'thrift://172.0.0.1:9083',
    'dfs.nameservices' = 'your-nameservice',
    'dfs.ha.namenodes.your-nameservice' = 'nn1,nn2',
    'dfs.namenode.rpc-address.your-nameservice.nn1' = '172.21.0.2:8088',
    'dfs.namenode.rpc-address.your-nameservice.nn2' = '172.21.0.3:8088',
    'dfs.client.failover.proxy.provider.your-nameservice' = 'org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider',
    'fs.defaultFS' = 'viewfs://your-cluster',
    'fs.viewfs.mounttable.your-cluster.link./ns1' = 'hdfs://your-nameservice/',
    'fs.viewfs.mounttable.your-cluster.homedir' = '/ns1'
);
```
### Hive on S3

```sql
CREATE CATALOG hive_s3 PROPERTIES (
    'type' = 'hms',
    'hive.metastore.uris' = 'thrift://172.0.0.1:9083',
    's3.endpoint' = 's3.us-east-1.amazonaws.com',
    's3.region' = 'us-east-1',
    's3.access_key' = 'ak',
    's3.secret_key' = 'sk',
    'use_path_style' = 'true'
);
```
## Query 運用

### Basic Query

Catalogを設定した後、以下の方法を使用してCatalog内のTableデータをクエリできます：

```sql
-- 1. switch to catalog, use database and query
SWITCH hive_ctl;
USE hive_db;
SELECT * FROM hive_tbl LIMIT 10;

-- 2. use hive database directly
USE hive_ctl.hive_db;
SELECT * FROM hive_tbl LIMIT 10;

-- 3. use full qualified name to query
SELECT * FROM hive_ctl.hive_db.hive_tbl LIMIT 10;
```
### Hiveパーティションのクエリ

以下の2つの方法を使用してHiveパーティション情報をクエリできます：

* `SHOW PARTITIONS FROM [catalog.][db.]hive_table`

  このステートメントは、指定されたHiveTableのすべてのパーティションとその値を一覧表示します。

  ```sql
  SHOW PARTITIONS FROM hive_table;

  +--------------------------------+
  | パーティション                      |
  +--------------------------------+
  | pt1=2024-10-10/pt2=beijing     |
  | pt1=2024-10-10/pt2=shanghai    |
  | pt1=2024-10-11/pt2=beijing     |
  | pt1=2024-10-11/pt2=shanghai    |
  | pt1=2024-10-12/pt2=nanjing     |
  +--------------------------------+
  ```
* `table$partitions` Metadata Table の使用

  バージョン2.1.7および3.0.3以降では、`table$partitions` metadata tableを通じてHiveパーティション情報をクエリできます。このTableは本質的にリレーショナルであり、各パーティションカラムが1つのカラムとして表現されるため、任意のSELECT文で使用できます。

  ```sql
  SELECT * FROM hive_table$partitions;

  +------------+-------------+
  | pt1        | pt2         |
  +------------+-------------+
  | 2024-10-10 | beijing     |
  | 2024-10-10 | shanghai    |
  | 2024-10-12 | nanjing     |
  | 2024-10-11 | beijing     |
  | 2024-10-11 | shanghai    |
  +------------+-------------+
  ```
### Hive Transactional Tablesのクエリ

Hive Transactional tablesはACIDセマンティクスをサポートします。詳細については、[Hive Transactions](https://cwiki.apache.org/confluence/display/Hive/Hive+Transactions)を参照してください。

* Hive Transactional Tablesのサポート

  | Table タイプ                      | Supported 運用 in Hive        | Hive Table Properties                                                | サポート対象のHiveバージョン                                          |
  | ------------------------------- | ----------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------- |
  | Full-ACID Transactional Table   | Supports Insert, アップデート, Delete     | `'transactional'='true'`                                            | 4.x, 3.x, 2.x (2.x requires Major コンパクション in Hive to read)    |
  | Insert-Only Transactional Table | Supports Insert only                | `'transactional'='true'`, `'transactional_properties'='insert_only'` | 4.x, 3.x, 2.x (specify `hive.version` when creating the catalog) |

* 現在の制限事項

  Original Filesシナリオはサポートされていません。TableがTransactional tableに変換された場合、新しいデータファイルはHive Transactional tableスキーマを使用しますが、既存のデータファイルは変換されません。これらのファイルはOriginal Filesと呼ばれます。

### Hive Viewsのクエリ

Hive Viewsをクエリできますが、いくつかの制限があります：

* Hive Viewの定義（HiveQL）は、DorisでサポートされているSQL文と互換性がある必要があります。そうでない場合、解析エラーが発生します。

* HiveQLでサポートされている一部の関数は、Dorisの関数と同じ名前でも動作が異なる場合があります。これにより、HiveとDorisから得られる結果に相違が生じる可能性があります。このような問題に遭遇した場合は、コミュニティに報告してください。

## 書き込み操作

INSERT文を使用してHiveTableにデータを書き込むことができます。これは、Dorisで作成されたHiveTableまたは互換性のある形式の既存のHiveTableでサポートされます。

パーティション化されたTableの場合、データは自動的に対応するパーティションに書き込まれるか、データに基づいて新しいパーティションが作成されます。現在、書き込み用のパーティションを指定することはサポートされていません。

### INSERT INTO

INSERT操作は、対象Tableにデータを追加します。現在、書き込み用のパーティションを指定することはサポートされていません。

```sql
INSERT INTO hive_tbl VALUES (val1, val2, val3, val4);
INSERT INTO hive_ctl.hive_db.hive_tbl SELECT col1, col2 FROM internal.db1.tbl1;

INSERT INTO hive_tbl(col1, col2) VALUES (val1, val2);
INSERT INTO hive_tbl(col1, col2, partition_col1, partition_col2) VALUES (1, 2, "beijing", "2023-12-12");
```
### INSERT OVERWRITE

INSERT OVERWRITEは、Table内の既存データを新しいデータで完全に置き換えます。現在、書き込み用のパーティションの指定はサポートされていません。

```sql
INSERT OVERWRITE TABLE hive_tbl VALUES (val1, val2, val3, val4);
INSERT OVERWRITE TABLE hive_ctl.hive_db.hive_tbl(col1, col2) SELECT col1, col2 FROM internal.db1.tbl1;
```
INSERT OVERWRITEのセマンティクスはHiveと一貫しており、以下の動作を示します：

* ターゲットTableがパーティション化されており、ソースTableが空の場合、操作は効果がありません。ターゲットTableは変更されません。

* ターゲットTableがパーティション化されておらず、ソースTableが空の場合、ターゲットTableはクリアされます。

* 書き込み用のパーティション指定はサポートされていないため、INSERT OVERWRITEはソースTableの値に基づいて、ターゲットTable内の関連するパーティションを自動的に処理します。ターゲットTableがパーティション化されている場合、影響を受けるパーティションのみが上書きされ、影響を受けないパーティションは変更されません。

### CTAS

`CTAS (CREATE TABLE AS SELECT)`ステートメントを使用してHiveTableを作成し、データを挿入できます：

```sql
CREATE TABLE hive_ctas ENGINE=hive AS SELECT * FROM other_table;
```
CTASは、以下に示すように、ファイル形式、パーティション分割方法などの指定をサポートしています。

```sql
CREATE TABLE hive_ctas ENGINE=hive
PARTITION BY LIST (pt1, pt2) ()
AS SELECT col1, pt1, pt2 FROM part_ctas_src WHERE col1 > 0;
    
CREATE TABLE hive_ctl.hive_db.hive_ctas (col1, col2, pt1) ENGINE=hive
PARTITION BY LIST (pt1) ()
PROPERTIES (
    "file_format"="parquet",
    "compression"="zstd"
)
AS SELECT col1, pt1 AS col2, pt2 AS pt1 FROM test_ctas.part_ctas_src WHERE col1 > 0;
```
### 関連パラメータ

* セッション変数

| パラメータ名 | デフォルト値 | 説明 | バージョン |
| ----------| ---- | ---- | --- |
| `hive_parquet_use_column_names` | `true` | DorisがHiveTableのParquetデータ型を読み取る際、デフォルトではHiveTableのカラム名に基づいて、Parquetファイルから同じ名前のカラムを見つけてデータを読み取ります。この変数が`false`の場合、DorisはHiveTableのカラム順序に従ってParquetファイルからデータを読み取り、カラム名は無視されます。HiveにおけるHiveの`parquet.column.index.access`変数と同様です。このパラメータはトップレベルのカラム名にのみ適用され、Struct内では無効です。 | 2.1.6+, 3.0.3+ |
| `hive_orc_use_column_names` | `true` | `hive_parquet_use_column_names`と同様で、HiveTableのORCデータ型に対応します。Hiveにおける`orc.force.positional.evolution`変数と同様です。 | 2.1.6+, 3.0.3+ |

* BE

  | パラメータ名                                                                | デフォルト値                                                                                                     | 説明 |
  | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ----------- |
  | `hive_sink_max_file_size`                                                     | 1GB                                                                                                               | 最大データファイルサイズ。データサイズがこの制限を超えると、現在のファイルが閉じられ、新しいファイルが作成されて書き込みが続行されます。 |
  | `table_sink_partition_write_max_partition_nums_per_writer`                    | 128                                                                                                               | BEノード上で各インスタンスが書き込み可能なパーティションの最大数。 |
  | `table_sink_non_partition_write_scaling_data_processed_threshold`             | 25MB                                                                                                              | 非パーティションTableに対してscaling-writeを開始するためのデータ量のしきい値。`table_sink_non_partition_write_scaling_data_processed_threshold`のデータが追加されるごとに新しいwriter（インスタンス）が使用されます。このメカニズムはデータ量に基づいてwriter（インスタンス）の数を調整し、並行書き込みのスループットを向上させ、小さなデータ量に対してはリソースを節約し、ファイル数を最小化します。 |
  | `table_sink_partition_write_min_data_processed_rebalance_threshold`           | 25MB                                                                                                              | パーティションTableのリバランシングをトリガーする最小データ量のしきい値。`現在の累積データ量` - `前回のリバランシングまたは初期累積からのデータ量` >= `table_sink_partition_write_min_data_processed_rebalance_threshold`の場合、リバランシングがトリガーされます。最終的なファイルサイズが大幅に異なる場合は、このしきい値を下げてバランスを改善してください。ただし、しきい値を低くするとリバランシングのコストが増加し、パフォーマンスに影響する可能性があります。 |
  | `table_sink_partition_write_min_partition_data_processed_rebalance_threshold` | 15MB                                                                                                              | リバランシングをトリガーする最小パーティションデータ量のしきい値。`現在のパーティションデータ量` >= `しきい値` \* `パーティションに既に割り当てられたタスク数`の場合、リバランシングが発生します。最終的なファイルサイズが大幅に異なる場合は、このしきい値を下げてバランスを改善してください。ただし、しきい値を低くするとリバランシングのコストが増加し、パフォーマンスに影響する可能性があります。 |

## データベースとTableの管理

ユーザーはDorisを通じてHive MetastoreでデータベースとTableを作成および削除できます。Dorisはこれらの操作においてHive Metastore APIを呼び出すのみで、Hiveメタデータ自体を保存または永続化することはありません。

### データベースの作成と削除

`SWITCH`文を使用して適切なCatalogに切り替え、`CREATE DATABASE`文を実行できます：

```sql
SWITCH hive_ctl;
CREATE DATABASE [IF NOT EXISTS] hive_db;
```
完全修飾名を使用してデータベースを作成したり、次のような場所を指定したりすることもできます：

```sql
CREATE DATABASE [IF NOT EXISTS] hive_ctl.hive_db;

CREATE DATABASE [IF NOT EXISTS] hive_ctl.hive_db
PROPERTIES ('location'='hdfs://172.21.16.47:4007/path/to/db/');
```
Databaseの場所情報は`SHOW CREATE DATABASE`コマンドを使用して確認できます：

```sql
mysql> SHOW CREATE DATABASE hive_db;
+----------+---------------------------------------------------------------------------------------------+
| Database | Create Database                                                                             |
+----------+---------------------------------------------------------------------------------------------+
| hive_db  | CREATE DATABASE hive_db LOCATION 'hdfs://172.21.16.47:4007/usr/hive/warehouse/hive_db.db'   |
+----------+---------------------------------------------------------------------------------------------+
```
データベースを削除するには：

```sql
DROP DATABASE [IF EXISTS] hive_ctl.hive_db;
```
:::caution
Hive Databaseの場合、そのDatabase自体を削除する前に、まずそのDatabase配下のすべてのTableを削除する必要があります。そうしなければエラーが発生します。この操作により、Hive内の対応するDatabaseも削除されます。
:::

### Tableの作成と削除

- **Tableの作成**

  DorisはHiveでパーティション化されたTableとパーティション化されていないTableの両方の作成をサポートしています。

  ```sql
  -- Create unpartitioned hive table
  CREATE TABLE unpartitioned_table (
    `col1` BOOLEAN COMMENT 'col1',
    `col2` INT COMMENT 'col2',
    `col3` BIGINT COMMENT 'col3',
    `col4` CHAR(10) COMMENT 'col4',
    `col5` FLOAT COMMENT 'col5',
    `col6` DOUBLE COMMENT 'col6',
    `col7` DECIMAL(9,4) COMMENT 'col7',
    `col8` VARCHAR(11) COMMENT 'col8',
    `col9` STRING COMMENT 'col9'
  )  ENGINE=hive
  PROPERTIES (
    'file_format'='parquet'
  );
  
  -- Create partitioned hive table
  -- The partition columns must be in table's column definition list
  CREATE TABLE partition_table (
    `col1` BOOLEAN COMMENT 'col1',
    `col2` INT COMMENT 'col2',
    `col3` BIGINT COMMENT 'col3',
    `col4` DECIMAL(2,1) COMMENT 'col4',
    `pt1` VARCHAR COMMENT 'pt1',
    `pt2` VARCHAR COMMENT 'pt2'
  )  ENGINE=hive
  PARTITION BY LIST (pt1, pt2) ()
  PROPERTIES (
    'file_format'='orc',
    'compression'='zlib'
  );
  
  -- Create text format table(Since 2.1.7 & 3.0.3)
  CREATE TABLE text_table (
      `id` INT,
      `name` STRING
  ) PROPERTIES (
      'file_format'='text',
      'compression'='gzip',
      'field.delim'='\t',
      'line.delim'='\n',
      'collection.delim'=';',
      'mapkey.delim'=':',
      'serialization.null.format'='\\N',
      'escape.delim'='\\'
  );
  ```
Tableを作成した後、`SHOW CREATE TABLE`コマンドを使用してHiveTable作成文を表示できます。

HiveのTable作成構文とは異なり、DorisでパーティションTableを作成する際は、パーティションカラムをTableスキーマに含める必要があることに注意してください。また、パーティションカラムはスキーマの最後に配置し、同じ順序を維持する必要があります。

:::tip
ACIDトランザクション機能がデフォルトで有効になっているHiveクラスターでは、Dorisによって作成されたTableの`transactional`プロパティが`true`に設定されます。DorisはHiveトランザクションTableの特定の機能のみをサポートしているため、Dorisが作成したHiveTableを読み取れない問題が発生する可能性があります。これを回避するには、Tableプロパティで`"transactional" = "false"`を明示的に設定して、非トランザクションHiveTableを作成してください：

  ```sql
  CREATE TABLE non_acid_table(
    `col1` BOOLEAN COMMENT 'col1',
    `col2` INT COMMENT 'col2',
    `col3` BIGINT COMMENT 'col3'
  ) ENGINE=hive
  PROPERTIES (
    'transactional'='false'
  );
  ```
:::

- **Tableの削除**

  `DROP TABLE`文を使用してHiveTableを削除できます。Tableが削除されると、パーティションデータを含むすべてのデータも削除されます。

- **カラム型のマッピング**

  詳細については[Column タイプ Mapping]セクションを参照してください。以下の制限事項にご注意ください：

  - カラムはデフォルトのnullable型である必要があります。`NOT NULL`はサポートされていません。
  - Hive 3.0はデフォルト値の設定をサポートしています。デフォルト値を設定するには、カタログプロパティに明示的に`"hive.version" = "3.0.0"`を追加してください。
  - 挿入されたデータ型に互換性がない場合（例：数値型に`'abc'`を挿入）、値は`null`に変換されます。

- **パーティショニング**

  Hiveでは、パーティション型はDorisのListパーティションに対応します。そのため、DorisでHiveパーティションTableを作成する際は、Listパーティション構文を使用しますが、各パーティションを明示的に列挙する必要はありません。Dorisは、データ挿入時にデータ値に基づいて対応するHiveパーティションを自動的に作成します。単一カラムまたは複数カラムのパーティションTableがサポートされています。

- **ファイル形式**

  - ORC（デフォルト）
  - Parquet

    DATETIME型がParquetファイルに書き込まれる際、使用される物理型はINT64ではなくINT96であることに注意してください。これは、Hive 4.0以前のバージョンのロジックと互換性を保つためです。

  - Text（バージョン2.1.7および3.0.3以降でサポート）

      Text形式では以下のTableプロパティがサポートされています：

		  - `field.delim`：カラム区切り文字。デフォルトは`\1`です。
		  - `line.delim`：行区切り文字。デフォルトは`\n`です。
		  - `collection.delim`：複合型の要素区切り文字。デフォルトは`\2`です。
		  - `mapkey.delim`：mapキー値ペアの区切り文字。デフォルトは`\3`です。
		  - `serialization.null.format`：`NULL`値の格納形式。デフォルトは`\N`です。
		  - `escape.delim`：エスケープ文字。デフォルトは`\`です。

- **圧縮形式**

  - Parquet：snappy（デフォルト）、zstd、plain（圧縮なし）
  - ORC：snappy、zlib（デフォルト）、zstd、plain（圧縮なし）
  - Text：gzip、deflate、bzip2、zstd、lz4、lzo、snappy、plain（デフォルト、圧縮なし）

- **ストレージ媒体**

  - HDFS
  - Object Storage

## Hive Metastoreイベントの購読

FEノードがHMSからNotification Eventsを定期的に読み取ることにより、DorisはHiveTableメタデータのリアルタイムな変更を検出し、メタデータの適時性を向上させることができます。現在、以下のイベントがサポートされています：

| Event            | アクションおよび対応する動作                                         |
| ---------------- | ------------------------------------------------------------------------- |
| CREATE DATABASE  | 対応するデータディレクトリにデータベースを作成します。                   |
| DROP DATABASE    | 対応するデータディレクトリのデータベースを削除します。                   |
| ALTER DATABASE   | 主にデータベースプロパティ、コメント、デフォルトストレージ場所の変更に影響します。これらの変更はDorisの外部データディレクトリクエリ機能に影響しないため、このイベントは現在無視されます。 |
| CREATE TABLE     | 対応するデータベースにTableを作成します。                            |
| DROP TABLE       | 対応するデータベースのTableを削除し、Tableキャッシュを無効化します。 |
| ALTER TABLE      | 名前が変更された場合、古いTableを削除し、新しい名前で新しいTableを作成します。そうでなければ、Tableキャッシュを無効化します。 |
| ADD PARTITION    | 対応するTableのキャッシュされたパーティションリストにパーティションを追加します。 |
| DROP PARTITION   | キャッシュされたパーティションリストからパーティションを削除し、パーティションキャッシュを無効化します。 |
| ALTER PARTITION  | 名前が変更された場合、古いパーティションを削除し、新しい名前で新しいパーティションを作成します。そうでなければ、パーティションキャッシュを無効化します。 |

:::tip
1. データインポートによってファイルが変更される場合、パーティションTableは`ALTER PARTITION`イベントをトリガーし、非パーティションTableは`ALTER TABLE`イベントをトリガーします。

2. HMSをバイパスして直接ファイルシステムを操作した場合、HMSは対応するイベントを生成せず、Dorisはメタデータの変更を検出しません。
:::

`fe.conf`の以下のパラメータがこの機能に関連しています：

1. `enable_hms_events_incremental_sync`：自動増分メタデータ同期を有効にします。デフォルトでは無効です。

2. `hms_events_polling_interval_ms`：イベント読み取りの間隔、デフォルトは10000ミリ秒です。

3. `hms_events_batch_size_per_rpc`：RPCあたりに読み取るイベントの最大数、デフォルトは500です。

この機能を使用するには（Huawei Cloud MRSを除く）、HMSの`hive-site.xml`を変更し、HMSとHiveServer2の両方を再起動する必要があります。

```xml
<property>
    <name>hive.metastore.event.db.notification.api.auth</name>
    <value>false</value>
</property>
<property>
    <name>hive.metastore.dml.events</name>
    <value>true</value>
</property>
<property>
    <name>hive.metastore.transactional.event.listeners</name>
    <value>org.apache.hive.hcatalog.listener.DbNotificationListener</value>
</property>
```
Huawei Cloud MRSの場合、`hivemetastore-site.xml`を変更し、HMSとHiveServer2の両方を再起動する必要があります。

```xml
<property>
    <name>metastore.transactional.event.listeners</name>
    <value>org.apache.hive.hcatalog.listener.DbNotificationListener</value>
</property>
```
## 付録

### 取引メカニズム

Hiveへの書き込み操作は独立したトランザクション内で実行されます。トランザクションがコミットされる前は、データは外部から見えません。トランザクションがコミットされて初めて、関連するTable操作が他から見えるようになります。

トランザクションは操作の原子性を保証します。つまり、トランザクション内のすべての操作は一緒に成功するか、一緒に失敗するかのどちらかです。

トランザクションは操作の分離を完全に保証することはできませんが、ファイルシステム操作をHive Metastoreのメタデータ操作から分離することで、不整合を最小限に抑えるよう努力しています。

例えば、HiveTableの複数のパーティションを変更する必要があるトランザクションにおいて、タスクが2つのバッチに分割される場合、最初のバッチは2番目のバッチが完了する前に外部から見えるようになる可能性があります。これは、最初のバッチのパーティションは読み取れるが、2番目のバッチは読み取れないことを意味します。

トランザクションのコミット処理中に例外が発生した場合、HDFSファイルとHive Metastoreメタデータの変更を含めて、トランザクション全体が完全にロールバックされ、ユーザーによる追加の操作は必要ありません。

### 並行書き込みメカニズム

Apache Dorisは現在、複数のinsert文を使用した並行書き込みをサポートしています。しかし、ユーザーは並行書き込みが潜在的な競合を引き起こさないことを保証する必要があります。

通常の非トランザクショナルHiveTableには完全なトランザクション機能がないため、Apache Dorisのトランザクション機能は不整合ウィンドウを最小化することを目的としていますが、真のACID特性を保証することはできません。したがって、Apache DorisでのHiveTableへの並行書き込みは、データ一貫性の問題を引き起こす可能性があります。

1. **並行`INSERT`操作**

2. `INSERT`操作はデータを追加し、並行実行時に競合せず、期待される結果を生成します。

3. **並行`INSERT OVERWRITE`操作**

4. 同一のTableまたはパーティションに対する並行`INSERT OVERWRITE`操作は、データの損失や破損を引き起こし、予測不可能な結果をもたらす可能性があります。

5. 一般的な解決策は以下の通りです：

   * パーティションTableの場合、異なるパーティションにデータを書き込む。異なるパーティションでの並行操作は競合しません。

   * 非パーティションTableの場合、競合を避けるために`INSERT OVERWRITE`の代わりに`INSERT`を使用する。

   * 競合する可能性がある操作については、ビジネス側で一度に一つの書き込み操作のみが実行されることを保証する。

### HDFS File 運用

HDFS上のHiveTableデータについては、データは通常最初に一時ディレクトリに書き込まれ、その後`rename`などのファイルシステム操作を使用して確定されます。以下は、異なるデータ操作に対するHDFS上での具体的なファイル操作の詳細な説明です。

データの一時ディレクトリの形式は：`/tmp/.doris_staging/<username>/<uuid>`

書き込まれるデータファイル名の形式は：`<query-id>_<uuid>-<index>.<compress-type>.<file-type>`

様々なシナリオでのファイル操作の例は以下の通りです：

1. **非パーティションTable**

   * **Append（データ追加）**

     * ターゲットTableディレクトリ：`hdfs://ns/usr/hive/warehouse/example.db/table1`

     * 一時ファイル：`hdfs://ns/tmp/.doris_staging/root/f02247cb662846038baae272af5eeb05/b35fdbcea3a4e39-86d1f36987ef1492_7e3985bf-9de9-4fc7-b84e-adf11aa08756-0.orc`

     * コミット段階では、すべての一時ファイルがターゲットTableディレクトリに移動されます。

   * **Overwrite（データ置換）**

     * ターゲットTableディレクトリ：`hdfs://ns/usr/hive/warehouse/example.db/table1`

     * 一時ファイル：`hdfs://ns/tmp/.doris_staging/root/f02247cb662846038baae272af5eeb05/b35fdbcea3a4e39-86d1f36987ef1492_7e3985bf-9de9-4fc7-b84e-adf11aa08756-0.orc`

     * コミット段階のステップ：

       1. ターゲットTableディレクトリを一時ディレクトリにリネーム：`hdfs://ns/usr/hive/warehouse/example.db/_temp_b35fdbcea3a4e39-86d1f36987ef1492_table1`

       2. 一時ディレクトリをターゲットTableディレクトリにリネーム。

       3. 一時ターゲットTableディレクトリを削除。

2. **パーティションTable**

   * **Add（新しいパーティションへの追加）**

     * ターゲットTableディレクトリ：`hdfs://ns/usr/hive/warehouse/example.db/table2/part_col=2024-01-01`

     * 一時ファイル：`hdfs://ns/tmp/.doris_staging/root/a7eac7505d7a42fdb06cb9ef1ea3e912/par1=a/d678a74d232345e0-b659e2fb58e86ffd_549ad677-ee75-4fa1-b8a6-3e821e1dae61-0.orc`

     * コミット段階では、一時ディレクトリがターゲットTableディレクトリにリネームされます。

   * **Append（既存パーティションへのデータ追加）**

     * ターゲットTableディレクトリ：`hdfs://ns/usr/hive/warehouse/example.db/table2/part_col=2024-01-01`

     * 一時ファイル：`hdfs://ns/tmp/.doris_staging/root/a7eac7505d7a42fdb06cb9ef1ea3e912/par1=a/d678a74d232345e0-b659e2fb58e86ffd_549ad677-ee75-4fa1-b8a6-3e821e1dae61-0.orc`

     * コミット段階では、一時ディレクトリからのファイルがターゲットTableディレクトリに移動されます。

   * **Overwrite（既存パーティションの置換）**

     * ターゲットTableディレクトリ：`hdfs://ns/usr/hive/warehouse/example.db/table2/part_col=2024-01-01`

     * 一時ファイル：`hdfs://ns/tmp/.doris_staging/root/a7eac7505d7a42fdb06cb9ef1ea3e912/par1=a/d678a74d232345e0-b659e2fb58e86ffd_549ad677-ee75-4fa1-b8a6-3e821e1dae61-0.orc`

     * コミット段階のステップ：

       1. ターゲットパーティションディレクトリを一時パーティションディレクトリにリネーム：`hdfs://ns/usr/hive/warehouse/example.db/table2/_temp_d678a74d232345e0-b659e2fb58e86ffd_part_col=2024-01-01`

       2. 一時パーティションディレクトリをターゲットパーティションディレクトリにリネーム。

       3. 一時ターゲットパーティションディレクトリを削除。

### Change ログ

| Dorisバージョン | 機能サポート                              |
| ------------- | --------------------------------------------- |
| 2.1.6         | HiveTableへの書き戻しサポート       |
| 3.0.4         | JsonSerDe形式のHiveTableサポート。Hive4でのトランザクショナルTableサポート。 |
