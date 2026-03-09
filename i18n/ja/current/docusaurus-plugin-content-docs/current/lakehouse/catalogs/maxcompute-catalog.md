---
{
  "title": "MaxCompute カタログ",
  "language": "ja",
  "description": "Apache Doris MaxCompute Catalogは、Alibaba Cloud MaxComputeデータに対するフェデレーション クエリをサポートし、データ移行なしでクロスソース分析のためのデータ統合と書き戻しを可能にします。"
}
---
[MaxCompute](https://help.aliyun.com/zh/maxcompute/)は、Alibaba Cloud上のエンタープライズレベルのSaaS（Software as a Service）クラウドデータウェアハウスです。MaxComputeが提供するオープンストレージSDKを通じて、DorisはMaxComputeテーブル情報を取得し、クエリと書き込みを実行できます。

## 適用シナリオ

| シナリオ | 説明 |
| ---- | ------------------------------------------------------ |
| データ統合 | MaxComputeデータを読み取り、Doris内部テーブルに書き込む。 |
| データ書き戻し | INSERTコマンドを使用してMaxCompute Tableにデータを書き込む。（バージョン4.1.0以降でサポート） |

## 使用上の注意事項

1. バージョン2.1.7以降、MaxCompute Catalogは[Open Storage SDK](https://help.aliyun.com/zh/maxcompute/user-guide/overview-1)をベースに開発されています。このバージョン以前は、Tunnel APIをベースに開発されていました。

2. Open Storage SDKを使用する際にはいくつかの制限があります。この[ドキュメント](https://help.aliyun.com/zh/maxcompute/user-guide/overview-1)の`Usage Limitations`セクションを参照してください。

3. Dorisバージョン3.1.3以前では、MaxComputeのProjectがDorisのDatabaseに対応していました。バージョン3.1.3では、`mc.enable.namespace.schema`パラメータを通じてMaxComputeスキーマ階層を導入できます。

## Catalogの設定

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
  | `mc.default.project` | アクセスするMaxComputeプロジェクトの名前。プロジェクトは[MaxCompute Project List](https://maxcompute.console.aliyun.com/cn-beijing/project-list)で作成および管理できます。 | |
  | `mc.access_key` | AccessKey。[Alibaba Cloud Console](https://ram.console.aliyun.com/manage/ak)で作成および管理できます。 | |
  | `mc.secret_key` | SecretKey。[Alibaba Cloud Console](https://ram.console.aliyun.com/manage/ak)で作成および管理できます。 | |
  | `mc.region` | MaxComputeがアクティベートされているリージョン。EndpointからRegionの対応を確認できます。 | 2.1.7未満 |
  | `mc.endpoint` | MaxComputeがアクティベートされているリージョン。設定については以下の「EndpointとQuotaの取得方法」のセクションを参照してください。 | 2.1.7以上 |

* `{McOptionalProperties}`

  | Property Name | Default Value | Description | Supported Doris Version |
  | -------------------------- | ------------- | -------------------------------------------------------------------------- | ------------ |
  | `mc.tunnel_endpoint` | None | 付録の「Custom Service Address」を参照してください。 | 2.1.7未満 |
  | `mc.odps_endpoint` | None | 付録の「Custom Service Address」を参照してください。 | 2.1.7未満 |
  | `mc.quota` | `pay-as-you-go` | Quota名。設定については以下の「EndpointとQuotaの取得方法」のセクションを参照してください。 | 2.1.7以上 |
  | `mc.split_strategy` | `byte_size` | split分割方法を設定します。バイトサイズによる分割`byte_size`または行数による分割`row_count`に設定できます。 | 2.1.7以上 |
  | `mc.split_byte_size` | `268435456` | 各splitが読み込むファイルサイズ（バイト単位）。デフォルトは256MB。`"mc.split_strategy" = "byte_size"`の場合のみ有効。 | 2.1.7以上 |
  | `mc.split_row_count` | `1048576` | 各splitが読み込む行数。`"mc.split_strategy" = "row_count"`の場合のみ有効。 | 2.1.7以上 |
  | `mc.split_cross_partition` | `false` | 生成されたsplitがパーティションをまたぐかどうか。 | 2.1.8以上 |
  | `mc.connect_timeout` | `10s` | MaxComputeの接続タイムアウト。 | 2.1.8以上 |
  | `mc.read_timeout` | `120s` | MaxComputeの読み込みタイムアウト。 | 2.1.8以上 |
  | `mc.retry_count` | `4` | タイムアウト後の再試行回数。 | 2.1.8以上 |
  | `mc.datetime_predicate_push_down` | `true` | `timestamp/timestamp_ntz`タイプに対するpredicate push-downを許可するかどうか。Dorisはこれら2つのタイプを同期する際に精度が低下します（9 -> 6）。そのため、元のデータの精度が6桁より高い場合、predicate push-downは不正確な結果をもたらす可能性があります。 | 2.1.9/3.0.5以上 |
  | `mc.account_format` | `name` | Alibaba Cloud国際サイトと中国サイトのアカウントシステムは一致していません。国際サイトユーザーで`user 'RAM$xxxxxx:xxxxx' is not a valid aliyun account`などのエラーが発生した場合、このパラメーターを`id`に設定できます。 | 3.0.9/3.1.1以上 |
  | `mc.enable.namespace.schema` | `false` | MaxComputeスキーマ階層をサポートするかどうか。参照: https://help.aliyun.com/zh/maxcompute/user-guide/schema-related-operations | 3.1.3以上 |

* `{CommonProperties}`

    CommonPropertiesセクションは共通プロパティの入力に使用されます。[Catalog Overview](../catalog-overview.md)の「Common Properties」セクションを参照してください。

### サポートされているMaxComputeバージョン

MaxComputeのパブリッククラウドバージョンのみをサポートしています。プライベートクラウドバージョンのサポートについては、Dorisコミュニティサポートにお問い合わせください。

### サポートされているMaxComputeテーブル

* パーティションテーブル、クラスタテーブル、マテリアライズドビューの読み込みをサポートします。

* MaxCompute外部テーブル、論理ビュー、Delta Tablesの読み込みはサポートしていません。

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
| datetime | datetime(3) | 精度3への固定マッピング。タイムゾーンは`SET [GLOBAL] time_zone = 'Asia/Shanghai'`で指定できます。 |
| timestamp_ntz | datetime(6) | MaxComputeの`timestamp_ntz`精度は9ですが、DorisのDATETIME最大精度は6のみのため、データ読み込み時に余分な部分が切り捨てられます。 |
| timestamp | datetime(6) | 2.1.9/3.0.5以降でサポート。MaxComputeの`timestamp`精度は9ですが、DorisのDATETIME最大精度は6のみのため、データ読み込み時に余分な部分が切り捨てられます。 |
| array | array | |
| map | map | |
| struct | struct | |
| other | UNSUPPORTED | |

## 基本例

```sql
CREATE CATALOG mc_catalog PROPERTIES (
    'type' = 'max_compute',
    'mc.default.project' = 'project',
    'mc.access_key' = 'sk',
    'mc.secret_key' = 'ak',
    'mc.endpoint' = 'http://service.cn-beijing-vpc.MaxCompute.aliyun-inc.com/api'
);
```
2.1.7より前のバージョン（2.1.7は含まない）を使用している場合は、以下のステートメントを使用してください。（2.1.8以降にアップグレードすることを推奨します）

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
スキーマサポートあり:

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
## Query操作

### 基本Query

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
## 書き込み操作

バージョン4.1.0から、DorisはMaxComputeテーブルへの書き込み操作をサポートしています。標準のINSERT文を使用して、他のデータソースからDoris経由でMaxComputeテーブルに直接データを書き込むことができます。

:::note
- これは実験的機能で、バージョン4.1.0からサポートされています。
- パーティション化されたテーブルと非パーティション化されたテーブルの両方への書き込みをサポートします。
- クラスター化されたテーブル、トランザクショナルテーブル、Delta Tables、または外部テーブルへの書き込みはサポートしていません。
:::

### INSERT INTO

INSERT操作は、対象テーブルにデータを追加します。

例：

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
- パーティション化テーブルと非パーティション化テーブルの作成と削除をサポートしています。
- クラスター化テーブル、トランザクションテーブル、Delta Tables、または外部テーブルの作成はサポートしていません。
:::

> この機能は`mc.enable.namespace.schema`プロパティが`true`に設定されている場合にのみ利用可能です。

### データベースの作成と削除

`SWITCH`文を使用して対応するCatalogに切り替え、`CREATE DATABASE`文を実行できます：

```sql
SWITCH mc;
CREATE DATABASE [IF NOT EXISTS] mc_schema;
```
完全修飾名を使用して作成することもできます:

```sql
CREATE DATABASE [IF NOT EXISTS] mc.mc_schema;
```
データベースを削除:

```sql
DROP DATABASE [IF EXISTS] mc.mc_schema;
```
:::caution
MaxCompute Databaseの場合、削除後、その下にあるすべてのテーブルも削除されます。
:::

### テーブルの作成と削除

* **作成**

  DorisはMaxComputeでパーティション化されたテーブルまたはパーティション化されていないテーブルの作成をサポートしています。

  例:

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
* **Drop**

  `DROP TABLE`文を使用してMaxComputeテーブルを削除できます。現在、テーブルを削除すると、パーティションデータを含むデータも削除されます。

  例：

  ```sql
  DROP TABLE [IF EXISTS] mc_tbl;
  ```
## 付録

### エンドポイントとQuotaの取得方法（Doris 2.1.7以降に適用）

1. データ転送サービス専用リソースグループを使用する場合

    この[ドキュメント](https://help.aliyun.com/zh/maxcompute/user-guide/purchase-and-use-exclusive-resource-groups-for-dts)の「専用データサービスリソースグループの使用」章の「2. 認証」セクションを参照して、対応する権限を有効にしてください。「Quota Management」リストで対応する`QuotaName`を表示・コピーし、`"mc.quota" = "QuotaName"`を指定してください。この時点で、VPCまたはパブリックネットワークのいずれかを選択してMaxComputeにアクセスできますが、VPCは帯域幅が保証されている一方、パブリックネットワークの帯域幅リソースは制限されています。

2. 従量課金を使用する場合

    この[ドキュメント](https://help.aliyun.com/zh/maxcompute/user-guide/overview-1)の「Open Storage（従量課金）の使用」セクションを参照して、Open Storage（Storage API）スイッチを有効にし、AKとSKに対応するユーザーに権限を付与してください。この場合、`mc.quota`はデフォルト値`pay-as-you-go`であり、この値を追加で指定する必要はありません。従量課金では、VPCのみを使用してMaxComputeにアクセスでき、パブリックネットワーク経由ではアクセスできません。プリペイドユーザーのみがパブリックネットワーク経由でMaxComputeにアクセスできます。

3. [Alibaba Cloud Endpointsドキュメント](https://help.aliyun.com/zh/maxcompute/user-guide/endpoints)の「リージョンエンドポイント参照テーブル」に従って`mc.endpoint`を設定

    VPC経由でアクセスするユーザーは、「リージョナルエンドポイント参照テーブル（Alibaba Cloud VPCネットワーク接続方法）」テーブルの「VPCネットワークエンドポイント」列に従って`mc.endpoint`を設定する必要があります。パブリックネットワーク経由でアクセスするユーザーは、「リージョナルエンドポイント参照テーブル（Alibaba Cloudクラシックネットワーク接続方法）」テーブルの「クラシックネットワークエンドポイント」列、または「リージョナルエンドポイント参照テーブル（外部ネットワーク接続方法）」テーブルの「外部ネットワークエンドポイント」列から選択して`mc.endpoint`を設定できます。

### カスタムサービスアドレス（Doris 2.1.7より前のバージョンに適用）

Doris 2.1.7より前のバージョンでは、Tunnel SDKがMaxComputeとの対話に使用されるため、以下の2つのエンドポイントプロパティが必要です：

* `mc.odps_endpoint`：MaxCompute Endpoint、MaxComputeメタデータ（データベースとテーブル情報）の取得に使用されます。

* `mc.tunnel_endpoint`：Tunnel Endpoint、MaxComputeデータの読み取りに使用されます。

デフォルトでは、MaxCompute Catalogは`mc.region`と`mc.public_access`に基づいてエンドポイントを生成します。

生成される形式は以下の通りです：

| `mc.public_access` | `mc.odps_endpoint` | `mc.tunnel_endpoint` |
| ------------------- | -------------------------------------------------------- | ----------------------------------------------- |
| false | `http://service.{mc.region}.maxcompute.aliyun-inc.com/api` | `http://dt.{mc.region}.maxcompute.aliyun-inc.com` |
| true | `http://service.{mc.region}.maxcompute.aliyun.com/api` | `http://dt.{mc.region}.maxcompute.aliyun.com` |

ユーザーは`mc.odps_endpoint`と`mc.tunnel_endpoint`を個別に指定してサービスアドレスをカスタマイズすることもでき、これは一部のプライベートデプロイされたMaxCompute環境に適しています。

MaxCompute EndpointとTunnel Endpointの設定については、[異なるリージョンとネットワーク接続方法のエンドポイント](https://help.aliyun.com/zh/maxcompute/user-guide/endpoints)を参照してください。

### リソース使用量制御

ユーザーは2つのSession Variables `parallel_pipeline_task_num`と`num_scanner_threads`を調整することで[テーブルレベルのリクエスト並行性](https://help.aliyun.com/zh/maxcompute/user-guide/data-transfer-service-quota-manage?spm=a2c4g.11186623.help-menu-search-27797.d_2)を調整し、データ転送サービスでのリソース消費を制御できます。対応する並行性は`max(parallel_pipeline_task_num * be num * num_scanner_threads)`と等しくなります。

注意：

1. この方法は単一Query内の単一テーブルの並行リクエスト数のみを制御でき、複数のSQL文間のリソース使用量は制御できません。

2. 並行性を下げることは、Query実行時間が増加することを意味します。
