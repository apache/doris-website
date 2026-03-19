---
{
  "title": "MaxCompute カタログ",
  "language": "ja",
  "description": "Apache Doris MaxCompute カタログは、Alibaba Cloud MaxComputeデータに対する連合クエリをサポートし、データ移行なしにクロスソース分析のためのデータ統合と書き戻しを可能にします。"
}
---
[MaxCompute](https://help.aliyun.com/zh/maxcompute/)は、Alibaba Cloud上のエンタープライズレベルSaaS（Software as a Service）クラウドデータウェアハウスです。MaxComputeが提供するオープンストレージSDKを通じて、DorisはMaxComputeテーブル情報を取得し、クエリや書き込みを実行できます。

## 適用シナリオ

| シナリオ | 説明 |
| ---- | ------------------------------------------------------ |
| データ統合 | MaxComputeデータを読み取り、Doris内部テーブルに書き込みます。 |
| データライトバック | INSERTコマンドを使用してMaxCompute tableにデータを書き込みます。（バージョン4.1.0以降でサポート） |

## 使用上の注意

1. バージョン2.1.7以降、MaxCompute カタログは[Open Storage SDK](https://help.aliyun.com/zh/maxcompute/user-guide/overview-1)に基づいて開発されています。このバージョン以前は、Tunnel APIに基づいて開発されていました。

2. Open Storage SDKを使用する際には一定の制限があります。この[文書](https://help.aliyun.com/zh/maxcompute/user-guide/overview-1)の`Usage Limitations`セクションを参照してください。

3. Dorisバージョン3.1.3以前では、MaxComputeのProjectはDorisのDatabaseに対応します。バージョン3.1.3では、`mc.enable.namespace.schema`パラメータを通じてMaxComputeスキーマ階層を導入できます。

## カタログの設定

### 構文

```sql
CREATE CATALOG [IF NOT EXISTS] catalog_name PROPERTIES (
    'type' = 'max_compute',
    {McRequiredProperties},
    {McOptionalProperties},
    {CommonProperties}
);
```
* `{McRequiredProperties}`

  | Property Name | Description | Supported Doris Version |
  | ------------------ | ------------------------------------------------------------------------------------------------------------------ | ------------ |
  | `mc.default.project` | アクセスするMaxComputeプロジェクトの名前。[MaxCompute Project List](https://maxcompute.console.aliyun.com/cn-beijing/project-list)でプロジェクトの作成と管理ができます。 | |
  | `mc.access_key` | AccessKey。[Alibaba Cloud Console](https://ram.console.aliyun.com/manage/ak)で作成と管理ができます。 | |
  | `mc.secret_key` | SecretKey。[Alibaba Cloud Console](https://ram.console.aliyun.com/manage/ak)で作成と管理ができます。 | |
  | `mc.region` | MaxComputeが有効化されているリージョン。EndpointからそれぞれのRegionを見つけることができます。 | Before 2.1.7 (exclusive) |
  | `mc.endpoint` | MaxComputeが有効化されているリージョン。設定については以下の「EndpointとQuotaを取得する方法」のセクションを参照してください。 | 2.1.7 (inclusive) and later |

* `{McOptionalProperties}`

  | Property Name | Default Value | Description | Supported Doris Version |
  | -------------------------- | ------------- | -------------------------------------------------------------------------- | ------------ |
  | `mc.tunnel_endpoint` | None | 付録の「カスタムサービスアドレス」を参照。 | Before 2.1.7 (exclusive) |
  | `mc.odps_endpoint` | None | 付録の「カスタムサービスアドレス」を参照。 | Before 2.1.7 (exclusive) |
  | `mc.quota` | `pay-as-you-go` | Quota名。設定については以下の「EndpointとQuotaを取得する方法」のセクションを参照してください。 | 2.1.7 (inclusive) and later |
  | `mc.split_strategy` | `byte_size` | splitのパーティショニング方法を設定。バイトサイズによるパーティション`byte_size`または行数による`row_count`に設定可能。 | 2.1.7 (inclusive) and later |
  | `mc.split_byte_size` | `268435456` | 各splitが読み取るファイルサイズ（バイト単位）。デフォルトは256MB。`"mc.split_strategy" = "byte_size"`の場合のみ有効。 | 2.1.7 (inclusive) and later |
  | `mc.split_row_count` | `1048576` | 各splitが読み取る行数。`"mc.split_strategy" = "row_count"`の場合のみ有効。 | 2.1.7 (inclusive) and later |
  | `mc.split_cross_partition` | `false` | 生成されたsplitがパーティションをまたぐかどうか。 | 2.1.8 (inclusive) and later |
  | `mc.connect_timeout` | `10s` | MaxComputeの接続タイムアウト。 | 2.1.8 (inclusive) and later |
  | `mc.read_timeout` | `120s` | MaxComputeの読み取りタイムアウト。 | 2.1.8 (inclusive) and later |
  | `mc.retry_count` | `4` | タイムアウト後のリトライ回数。 | 2.1.8 (inclusive) and later |
  | `mc.datetime_predicate_push_down` | `true` | `timestamp/timestamp_ntz`タイプのpredicate push-downを許可するかどうか。Dorisはこれら2つのタイプを同期する際に精度を失います（9 -> 6）。そのため、元のデータの精度が6桁よりも高い場合、predicate push-downは不正確な結果をもたらす可能性があります。 | 2.1.9/3.0.5 (inclusive) and later |
  | `mc.account_format` | `name` | Alibaba Cloud InternationalとChinaサイトのアカウントシステムは一貫していません。国際サイトユーザーで、`user 'RAM$xxxxxx:xxxxx' is not a valid aliyun account`のようなエラーが発生する場合、このパラメータを`id`に設定できます。 | 3.0.9/3.1.1 (inclusive) and later |
  | `mc.enable.namespace.schema` | `false` | MaxComputeスキーマ階層をサポートするかどうか。参照: https://help.aliyun.com/zh/maxcompute/user-guide/schema-related-operations | 3.1.3 (inclusive) and later |

* `{CommonProperties}`

    CommonPropertiesセクションは共通プロパティを記入するために使用されます。[Catalog Overview](../catalog-overview.md)の「Common Properties」セクションを参照してください。

### サポートされるMaxComputeバージョン

パブリッククラウド版のMaxComputeのみサポートしています。プライベートクラウド版のサポートについては、Dorisコミュニティサポートにお問い合わせください。

### サポートされるMaxComputeテーブル

* パーティションテーブル、クラスタテーブル、マテリアライズドビューの読み取りをサポート。

* MaxCompute外部テーブル、論理ビュー、Delta Tablesの読み取りはサポートしていません。

## 階層マッピング

- `mc.enable.namespace.schema`がfalseの場合

  | Doris | MaxCompute |
  | -------- | ---------- |
  | Catalog | N/A |
  | Database | Project |
  | Table | Table |

- `mc.enable.namespace.schema`がtrueの場合

  | Doris | MaxCompute |
  | -------- | ---------- |
  | Catalog | Project |
  | Database | Schema |
  | Table | Table |

## カラムタイプマッピング

| MaxCompute Type | Doris Type | Comment |
| ---------------- | ------------- | ---------------------------------------------------------------------------- |
| boolean | boolean | |
| tiny | tinyint | |
| tinyint | tinyint | |
| smallint | smallint | |
| int | int | |
| bigint | bigint | |
| float | float | |
| double | double | |
| decimal(P, S) | decimal(P, S) | 1 <= P <= 38, 0 <= scale <= 18 |
| char(N) | char(N) | |
| varchar(N) | varchar(N) | |
| string | string | |
| date | date | |
| datetime | datetime(3) | 精度3への固定マッピング。`SET [GLOBAL] time_zone = 'Asia/Shanghai'`によってタイムゾーンを指定できます。 |
| timestamp_ntz | datetime(6) | MaxComputeの`timestamp_ntz`の精度は9ですが、DorisのDATETIMEの最大精度は6のみのため、データ読み取り時に超過分は切り捨てられます。 |
| timestamp | datetime(6) | 2.1.9/3.0.5以降でサポート。MaxComputeの`timestamp`の精度は9ですが、DorisのDATETIMEの最大精度は6のみのため、データ読み取り時に超過分は切り捨てられます。 |
| array | array | |
| map | map | |
| struct | struct | |
| other | UNSUPPORTED | |

## 基本的な例

```sql
CREATE CATALOG mc_catalog PROPERTIES (
    'type' = 'max_compute',
    'mc.default.project' = 'project',
    'mc.access_key' = 'sk',
    'mc.secret_key' = 'ak',
    'mc.endpoint' = 'http://service.cn-beijing-vpc.MaxCompute.aliyun-inc.com/api'
);
```
2.1.7より前のバージョン（2.1.7を含まない）を使用している場合は、以下のステートメントを使用してください。（2.1.8以降へのアップグレードを推奨します）

```sql
CREATE CATALOG mc_catalog PROPERTIES (
    'type' = 'max_compute',
    'mc.region' = 'cn-beijing',
    'mc.default.project' = 'project',
    'mc.access_key' = 'ak',
    'mc.secret_key' = 'sk',
    'mc.odps_endpoint' = 'http://service.cn-beijing.maxcompute.aliyun-inc.com/api',
    'mc.tunnel_endpoint' = 'http://dt.cn-beijing.maxcompute.aliyun-inc.com'
);
```
Schema サポートを使用:

```sql
CREATE CATALOG mc_catalog PROPERTIES (
    'type' = 'max_compute',
    'mc.region' = 'cn-beijing',
    'mc.default.project' = 'project',
    'mc.access_key' = 'ak',
    'mc.secret_key' = 'sk',
    'mc.odps_endpoint' = 'http://service.cn-beijing.maxcompute.aliyun-inc.com/api',
    'mc.tunnel_endpoint' = 'http://dt.cn-beijing.maxcompute.aliyun-inc.com',
    'mc.enable.namespace.schema' = 'true'
);
```
## クエリ操作

### 基本クエリ

```sql
-- 1. switch to catalog, use database and query
SWITCH mc_ctl;
USE mc_ctl;
SELECT * FROM mc_tbl LIMIT 10;

-- 2. use mc database directly
USE mc_ctl.mc_db;
SELECT * FROM mc_tbl LIMIT 10;

-- 3. use full qualified name to query
SELECT * FROM mc_ctl.mc_db.mc_tbl LIMIT 10;
```
## Write操作

バージョン4.1.0以降、DorisはMaxComputeテーブルへのwrite操作をサポートしています。標準のINSERT文を使用して、他のデータソースからのデータをDoris経由でMaxComputeテーブルに直接書き込むことができます。

:::note
- これは実験的機能で、バージョン4.1.0以降でサポートされています。
- パーティション化されたテーブルと非パーティション化されたテーブルの両方への書き込みをサポートします。
- クラスター化されたテーブル、トランザクショナルテーブル、Delta Tables、または外部テーブルへの書き込みはサポートされていません。
:::

### INSERT INTO

INSERT操作は対象テーブルにデータを追加します。

例:

```sql
INSERT INTO mc_tbl values (val1, val2, val3, val4);
INSERT INTO mc_tbl SELECT col1, col2 FROM internal.db1.tbl1;

INSERT INTO mc_tbl(col1, col2) values (val1, val2);
INSERT INTO mc_tbl(col1, col2, partition_col1, partition_col2) values (1, 2, "beijing", "2023-12-12");

-- Write to specified partition (you can specify only some partition columns, with remaining partitions written dynamically)
INSERT INTO mc_tbl PARTITION(ds='20250201') SELECT id, name FROM source_tbl;
INSERT INTO mc_tbl PARTITION(ds='20250101', region='bj') VALUES (1, 'v1'), (2, 'v2');
```
### INSERT OVERWRITE

INSERT OVERWRITEは、テーブル内の既存データを新しいデータで完全に上書きします。

```sql
INSERT OVERWRITE TABLE mc_tbl VALUES(val1, val2, val3, val4);
INSERT OVERWRITE TABLE mc_tbl(col1, col2) SELECT col1, col2 FROM internal.db1.tbl1;

-- Write to specified partition
INSERT OVERWRITE TABLE mc_tbl PARTITION(ds='20250101') VALUES (10, 'new1');
```
### CTAS

`CTAS`文を使用してMaxComputeテーブルを作成し、データを書き込むことができます：

```sql
CREATE TABLE mc_tbl AS SELECT * FROM other_table;
```
## データベースとテーブル管理

バージョン4.1.0以降、DorisはMaxComputeデータベースとテーブルの作成と削除をサポートしています。

:::note
- これは実験的機能で、バージョン4.1.0以降でサポートされています。
- パーティション化されたテーブルとパーティション化されていないテーブルの作成と削除をサポートしています。
- クラスター化されたテーブル、トランザクショナルテーブル、Delta Tables、外部テーブルの作成はサポートしていません。
:::

> この機能は`mc.enable.namespace.schema`プロパティが`true`に設定されている場合のみ利用可能です。

### データベースの作成と削除

`SWITCH`文を使用して対応するCatalogに切り替え、`CREATE DATABASE`文を実行できます。

```sql
SWITCH mc;
CREATE DATABASE [IF NOT EXISTS] mc_schema;
```
完全修飾名を使用して作成することもできます：

```sql
CREATE DATABASE [IF NOT EXISTS] mc.mc_schema;
```
データベースを削除:

```sql
DROP DATABASE [IF EXISTS] mc.mc_schema;
```
:::caution
MaxCompute Databaseの場合、削除後、その下のすべてのテーブルも削除されます。
:::

### テーブルの作成と削除

* **作成**

  DorisはMaxComputeでパーティション分割されたテーブルまたはパーティション分割されていないテーブルの作成をサポートしています。

  例：

  ```sql
  CREATE TABLE mc_schema.mc_tbl1 (
      bool_col BOOLEAN,
      int_col INT,
      bigint_col BIGINT,
      float_col FLOAT,
      double_col DOUBLE,
      decimal_col DECIMAL(18,6),
      string_col STRING,
      varchar_col VARCHAR(200),
      char_col CHAR(50),
      date_col DATE,
      datetime_col DATETIME,
      arr_col ARRAY<STRING>,
      map_col MAP<STRING, STRING>,
      struct_col STRUCT<f1:STRING, f2:INT>
  );

  CREATE TABLE mc_schema.mc_tbl2 (
    id INT,
    val STRING,
    ds STRING,
    region STRING
  )
  PARTITION BY (ds, region)();
  ```
* **削除**

  `DROP TABLE`文を使用してMaxComputeテーブルを削除できます。現在、テーブルを削除すると、パーティションデータを含むデータも削除されます。

  例:

  ```sql
  DROP TABLE [IF EXISTS] mc_tbl;
  ```
## 付録

### エンドポイントとクォータの取得方法（Doris 2.1.7以降に適用）

1. データ転送サービス用の専用リソースグループを使用する場合

    この[ドキュメント](https://help.aliyun.com/zh/maxcompute/user-guide/purchase-and-use-exclusive-resource-groups-for-dts)の「専用データサービスリソースグループの使用」章の「2. 認証」セクションを参照して、対応する権限を有効にしてください。「クォータ管理」リストで、対応する`QuotaName`を確認してコピーし、`"mc.quota" = "QuotaName"`を指定してください。この時点で、VPCまたはパブリックネットワークのいずれかを選択してMaxComputeにアクセスできますが、VPCは帯域幅が保証される一方、パブリックネットワークの帯域幅リソースは制限されています。

2. 従量課金を使用する場合

    この[ドキュメント](https://help.aliyun.com/zh/maxcompute/user-guide/overview-1)の「オープンストレージの使用（従量課金）」セクションを参照して、オープンストレージ（Storage API）スイッチを有効にし、AKとSKに対応するユーザーに権限を付与してください。この場合、`mc.quota`はデフォルト値`pay-as-you-go`であり、この値を追加で指定する必要はありません。従量課金では、VPCを使用してのみMaxComputeにアクセスでき、パブリックネットワーク経由ではアクセスできません。前払いユーザーのみがパブリックネットワーク経由でMaxComputeにアクセスできます。

3. [Alibaba Cloud エンドポイントドキュメント](https://help.aliyun.com/zh/maxcompute/user-guide/endpoints)の「地域エンドポイント参照テーブル」に従って`mc.endpoint`を設定する

    VPC経由でアクセスするユーザーは、「地域エンドポイント参照テーブル（Alibaba Cloud VPCネットワーク接続方法）」テーブルの「VPCネットワークエンドポイント」列に従って`mc.endpoint`を設定する必要があります。パブリックネットワーク経由でアクセスするユーザーは、「地域エンドポイント参照テーブル（Alibaba Cloud クラシックネットワーク接続方法）」テーブルの「クラシックネットワークエンドポイント」列、または「地域エンドポイント参照テーブル（外部ネットワーク接続方法）」テーブルの「外部ネットワークエンドポイント」列から選択して`mc.endpoint`を設定できます。

### カスタムサービスアドレス（Doris 2.1.7より前のバージョンに適用）

Doris 2.1.7より前のバージョンでは、Tunnel SDKを使用してMaxComputeとやり取りするため、以下の2つのエンドポイントプロパティが必要です：

* `mc.odps_endpoint`：MaxCompute Endpoint、MaxComputeメタデータ（データベースとテーブル情報）の取得に使用されます。

* `mc.tunnel_endpoint`：Tunnel Endpoint、MaxComputeデータの読み取りに使用されます。

デフォルトでは、MaxCompute Catalogは`mc.region`と`mc.public_access`に基づいてエンドポイントを生成します。

生成される形式は以下の通りです：

| `mc.public_access` | `mc.odps_endpoint` | `mc.tunnel_endpoint` |
| ------------------- | -------------------------------------------------------- | ----------------------------------------------- |
| false | `http://service.{mc.region}.maxcompute.aliyun-inc.com/api` | `http://dt.{mc.region}.maxcompute.aliyun-inc.com` |
| true | `http://service.{mc.region}.maxcompute.aliyun.com/api` | `http://dt.{mc.region}.maxcompute.aliyun.com` |

ユーザーは`mc.odps_endpoint`と`mc.tunnel_endpoint`を個別に指定してサービスアドレスをカスタマイズすることもでき、これは一部のプライベートに展開されたMaxCompute環境に適しています。

MaxCompute EndpointとTunnel Endpointの設定については、[異なる地域とネットワーク接続方法のエンドポイント](https://help.aliyun.com/zh/maxcompute/user-guide/endpoints)を参照してください。

### リソース使用制御

ユーザーは2つのSession Variables `parallel_pipeline_task_num`と`num_scanner_threads`を調整することで[テーブルレベルのリクエスト並行性](https://help.aliyun.com/zh/maxcompute/user-guide/data-transfer-service-quota-manage?spm=a2c4g.11186623.help-menu-search-27797.d_2)を調整し、データ転送サービスでのリソース消費を制御できます。対応する並行性は`max(parallel_pipeline_task_num * be num * num_scanner_threads)`に等しくなります。

注意：

1. この方法は、単一のQuery内の単一テーブルの並行リクエスト数のみを制御でき、複数のSQL文間のリソース使用を制御することはできません。

2. 並行性を減らすということは、Queryの実行時間を増やすことを意味します。
