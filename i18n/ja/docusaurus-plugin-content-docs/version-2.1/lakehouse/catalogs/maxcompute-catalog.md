---
{
  "title": "MaxCompute カタログ",
  "language": "ja",
  "description": "MaxComputeは、Alibaba Cloud上のエンタープライズレベルのSaaS（Software as a Service）クラウドデータウェアハウスです。"
}
---
[MaxCompute](https://help.aliyun.com/zh/maxcompute/) は、Alibaba Cloud上のエンタープライズレベルのSaaS（Software as a Service）クラウドデータウェアハウスです。MaxComputeが提供するオープンストレージSDKを通じて、DorisはMaxComputeテーブル情報にアクセスし、クエリを実行できます。

## 適用シナリオ

| シナリオ | 説明                 |
| ---- | ------------------------------------------------------ |
| データ統合 | MaxComputeデータを読み取り、Doris内部テーブルに書き込む。 |
| データライトバック | サポートされていません。                           |

## 注意事項

1. バージョン2.1.7以降、MaxCompute Catalogは[オープンストレージSDK](https://help.aliyun.com/zh/maxcompute/user-guide/overview-1)をベースに開発されています。これ以前は、Tunnel APIをベースに開発されていました。

2. オープンストレージSDKの使用には一定の制限があります。この[ドキュメント](https://help.aliyun.com/zh/maxcompute/user-guide/overview-1)の`利用制限`セクションを参照してください。

3. Dorisバージョン3.1.3以前では、MaxComputeの`Project`はDorisの`Database`と同等です。3.1.3以降では、`mc.enable.namespace.schema`パラメータを使用してMaxComputeスキーマレベルを導入できます。

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

  | Property Name        | Description                                                                                                         | Supported Doris Version |
  | ------------------ | ------------------------------------------------------------------------------------------------------------------ | ----------------------- |
  | `mc.default.project` | アクセスしたいMaxComputeプロジェクトの名前。[MaxComputeプロジェクトリスト](https://maxcompute.console.aliyun.com/cn-beijing/project-list)で作成・管理できます。 |                         |
  | `mc.access_key`     | AccessKey。[Alibaba Cloud Console](https://ram.console.aliyun.com/manage/ak)で作成・管理できます。                                          |                         |
  | `mc.secret_key`     | SecretKey。[Alibaba Cloud Console](https://ram.console.aliyun.com/manage/ak)で作成・管理できます。                                          |                         |
  | `mc.region`          | MaxComputeが有効化されているリージョン。Endpointから対応するリージョンを確認できます。                                                        | Before 2.1.7            |
  | `mc.endpoint`       | MaxComputeが有効化されているリージョン。EndpointとQuotaの取得方法については下記のセクションを参照してください。                         | 2.1.7 and later         |

* `{McOptionalProperties}`

  | Property Name              | Default Value   | Description                                                                 | Supported Doris Version |
  | -------------------------- | --------------- | --------------------------------------------------------------------------- | ----------------------- |
  | `mc.tunnel_endpoint`        | None            | `カスタムサービスアドレス`の付録を参照してください。                          | Before 2.1.7            |
  | `mc.odps_endpoint`          | None            | `カスタムサービスアドレス`の付録を参照してください。                          | Before 2.1.7            |
  | `mc.quota`                  | `pay-as-you-go` | Quota名。EndpointとQuotaの取得方法についてのセクションを参照してください。 | 2.1.7 and later         |
  | `mc.split_strategy`         | `byte_size`     | 分割戦略を設定します。`byte_size`（バイトサイズで分割）または`row_count`（行数で分割）に設定できます。 | 2.1.7 and later         |
  | `mc.split_byte_size`        | `268435456`     | 各分割で読み取るファイルサイズ（バイト単位）。デフォルトは256 MB。`"mc.split_strategy" = "byte_size"`の場合にのみ有効。 | 2.1.7 and later         |
  | `mc.split_row_count`        | `1048576`       | 各分割で読み取る行数。`"mc.split_strategy" = "row_count"`の場合にのみ有効。 | 2.1.7 and later         |
  | `mc.split_cross_partition`  | `false`         | 生成された分割がパーティションを跨ぐかどうか。                             | 2.1.8 and later         |
  | `mc.connect_timeout`        | `10s`           | MaxComputeへの接続タイムアウト。                                       | 2.1.8 and later         |
  | `mc.read_timeout`           | `120s`          | MaxComputeからの読み取りタイムアウト。                                        | 2.1.8 and later         |
  | `mc.retry_count`            | `4`             | タイムアウト後のリトライ回数。                                          | 2.1.8 and later         |
  | `mc.datetime_predicate_push_down` | `true`  | `timestamp/timestamp_ntz`型の述語条件のプッシュダウンを許可するかどうか。Dorisはこれら2つの型を同期する際に精度を失います（9 -> 6）。そのため、元のデータが6桁より高い精度を持つ場合、条件プッシュダウンは不正確な結果につながる可能性があります。 | 2.1.9/3.0.5 and later  |
  | `mc.account_format` | `name`             | Alibaba Cloud国際版と中国版のアカウントシステムは異なります。国際版サイトのユーザーで、`user 'RAM$xxxxxx:xxxxx' is not a valid aliyun account`のようなエラーが発生した場合、このパラメータを`id`として指定できます。 | 3.0.9/3.1.1 later  |
  | `mc.enable.namespace.schema` | `false`             | MaxComputeのschemaレベルをサポートするかどうか。詳細については、https://help.aliyun.com/zh/maxcompute/user-guide/schema-related-operationsを参照してください。 | 3.1.3 and later  |
  
* `[CommonProperties]`

CommonPropertiesセクションは共通プロパティを記入するために使用されます。Catalogオーバービューセクションの[共通プロパティ](../catalog-overview.md)を参照してください。

### サポートされるMaxComputeバージョン

パブリッククラウド版のMaxComputeのみサポートされます。プライベートクラウド版でのサポートについては、Dorisコミュニティにお問い合わせください。

### サポートされるMaxComputeフォーマット

* パーティションテーブル、クラスタテーブル、マテリアライズドビューの読み取りをサポートします。

* MaxCompute外部テーブル、論理ビュー、Delta Tablesの読み取りはサポートしません。

## 階層マッピング

- `mc.enable.namespace.schema`がfalseの場合

  | Doris    | MaxCompute |
  | -------- | ---------- |
  | Catalog  | N/A        |
  | Database | Project    |
  | Table    | Table      |

- `mc.enable.namespace.schema`がtrueの場合

  | Doris    | MaxCompute |
  | -------- | ---------- |
  | Catalog  | Project    |
  | Database | Schema     |
  | Table    | Table      |

## カラム型マッピング

| MaxCompute Type  | Doris Type    | Comment                                                                      |
| ---------------- | ------------- | ---------------------------------------------------------------------------- |
| bolean           | boolean       |                                                                              |
| tiny             | tinyint       |                                                                              |
| tinyint          | tinyint       |                                                                              |
| smallint         | smallint      |                                                                              |
| int              | int           |                                                                              |
| bigint           | bigint        |                                                                              |
| float            | float         |                                                                              |
| double           | double        |                                                                              |
| decimal(P, S)    | decimal(P, S) | 1 <= P <= 38 ,0 <= scale <= 18                                               |
| char(N)          | char(N)       |                                                                              |
| varchar(N)       | varchar(N)    |                                                                              |
| string           | string        |                                                                              |
| date             | date          |                                                                              |
| datetime         | datetime(3)   | 精度3への固定マッピング。`SET [GLOBAL] time_zone = 'Asia/Shanghai'`を使用してタイムゾーンを指定できます。 |
| timestamp_ntz    | datetime(6)   | MaxComputeの`timestamp_ntz`の精度は9ですが、DorisのDATETIMEは最大精度6をサポートします。そのため、データ読み取り時に余分な部分は直接切り捨てられます。 |
| timestamp        | datetime(6)   | 2.1.9 & 3.0.5以降。MaxComputeの`timestamp`の精度は9ですが、DorisのDATETIMEは最大精度6をサポートします。そのため、データ読み取り時に余分な部分は直接切り捨てられます。 |
| array            | array         |                                                                              |
| map              | map           |                                                                              |
| struct           | struct        |                                                                              |
| other            | UNSUPPORTED   |                                                                              |

## 例

```sql
CREATE CATALOG mc_catalog PROPERTIES (
    'type' = 'max_compute',
    'mc.default.project' = 'project',
    'mc.access_key' = 'sk',
    'mc.secret_key' = 'ak',
    'mc.endpoint' = 'http://service.cn-beijing-vpc.MaxCompute.aliyun-inc.com/api'
);
```
2.1.7より前のバージョン（2.1.7は含まない）を使用している場合は、以下のステートメントを使用してください。（使用については2.1.8以降へのアップグレードを推奨します）

```sql
CREATE CATALOG mc_catalog PROPERTIES (
    'type' = 'max_compute',
    'mc.region' = 'cn-beijing',
    'mc.default.project' = 'project',
    'mc.access_key' = 'ak',
    'mc.secret_key' = 'sk'
    'mc.odps_endpoint' = 'http://service.cn-beijing.maxcompute.aliyun-inc.com/api',
    'mc.tunnel_endpoint' = 'http://dt.cn-beijing.maxcompute.aliyun-inc.com'
);
```
Support Schema:

```sql
CREATE CATALOG mc_catalog PROPERTIES (
    'type' = 'max_compute',
    'mc.region' = 'cn-beijing',
    'mc.default.project' = 'project',
    'mc.access_key' = 'ak',
    'mc.secret_key' = 'sk'
    'mc.odps_endpoint' = 'http://service.cn-beijing.maxcompute.aliyun-inc.com/api',
    'mc.tunnel_endpoint' = 'http://dt.cn-beijing.maxcompute.aliyun-inc.com',
    'mc.enable.namespace.schema' = 'true'
);
```
## Query操作

### 基本Query

```sql
-- 1. Switch to catalog, use database, and query
SWITCH mc_ctl;
USE mc_ctl;
SELECT * FROM mc_tbl LIMIT 10;

-- 2. Use mc database directly
USE mc_ctl.mc_db;
SELECT * FROM mc_tbl LIMIT 10;

-- 3. Use fully qualified name to query
SELECT * FROM mc_ctl.mc_db.mc_tbl LIMIT 10;
```
## 付録

### エンドポイントとクォータの取得方法（Doris 2.1.7以降）

1. Data Transmission Service (DTS)専用リソースグループを使用する場合

	**「専用データサービスリソースグループの使用」**の**「2. 認可」**セクションにある[ドキュメント](https://help.aliyun.com/zh/maxcompute/user-guide/purchase-and-use-exclusive-resource-groups-for-dts)を参照して、必要な権限を有効にしてください。その後、**「クォータ管理」**リストに移動して対応する`QuotaName`を表示およびコピーし、`"mc.quota" = "QuotaName"`を使用して指定してください。この時点で、VPCまたはパブリックネットワーク経由でMaxComputeにアクセスできます。ただし、VPCは帯域幅が保証されますが、パブリックネットワークの帯域幅は制限されます。

2. `pay-as-you-go`を使用する場合

   **「オープンストレージ（従量課金）の使用」**セクションにある[ドキュメント](https://help.aliyun.com/zh/maxcompute/user-guide/overview-1)を参照して、オープンストレージ（Storage API）スイッチを有効にし、AkとSKに対応するユーザーに権限を付与してください。この場合、`mc.quota`はデフォルトで`pay-as-you-go`となり、追加の値を指定する必要はありません。従量課金モデルを使用する場合、MaxComputeはVPC経由でのみアクセス可能で、パブリックネットワークアクセスは利用できません。プリペイドユーザーのみがパブリックネットワーク経由でMaxComputeにアクセスできます。

3. [Alibaba Cloud Endpoints Documentation](https://help.aliyun.com/zh/maxcompute/user-guide/endpoints)に基づいて`mc.endpoint`を設定する

   VPC経由でアクセスするユーザーは、**「地域エンドポイントテーブル（Alibaba Cloud VPCネットワーク接続方法）」**の**「VPCネットワークエンドポイント」**列を参照して`mc.endpoint`を設定してください。

   パブリックネットワーク経由でアクセスするユーザーは、**「地域エンドポイントテーブル（Alibaba Cloudクラシックネットワーク接続方法）」**の**「クラシックネットワークエンドポイント」**列、または**「地域エンドポイントテーブル（外部ネットワーク接続方法）」**の**「外部ネットワークエンドポイント」**列から選択して`mc.endpoint`を設定できます。

### カスタムサービスアドレス（Doris 2.1.7以前のバージョン）

Doris 2.1.7以前のバージョンでは、**Tunnel SDK**を使用してMaxComputeと相互作用します。そのため、以下の2つのエンドポイントプロパティを設定する必要があります：

- `mc.odps_endpoint`：MaxCompute Endpoint、MaxComputeメタデータ（例：データベースとテーブル情報）の取得に使用されます。
- `mc.tunnel_endpoint`：Tunnel Endpoint、MaxComputeデータの読み取りに使用されます。

デフォルトでは、MaxCompute Catalogは`mc.region`と`mc.public_access`の値に基づいてエンドポイントを生成します。

生成されるエンドポイント形式は以下の通りです：

| `mc.public_access`  | `mc.odps_endpoint`                                       | `mc.tunnel_endpoint`                            |
| ------------------- | -------------------------------------------------------- | ----------------------------------------------- |
| `false`             | `http://service.{mc.region}.maxcompute.aliyun-inc.com/api` | `http://dt.{mc.region}.maxcompute.aliyun-inc.com` |
| `true`              | `http://service.{mc.region}.maxcompute.aliyun.com/api`     | `http://dt.{mc.region}.maxcompute.aliyun.com`     |

ユーザーは`mc.odps_endpoint`と`mc.tunnel_endpoint`を手動で指定して、サービスアドレスをカスタマイズすることもできます。これは、MaxCompute環境のプライベート配置に特に有用です。

MaxCompute EndpointとTunnel Endpointの設定の詳細については、[異なる地域とネットワーク接続方法のエンドポイント](https://help.aliyun.com/zh/maxcompute/user-guide/endpoints)に関するドキュメントを参照してください。

### リソース使用量制御

ユーザーは`parallel_pipeline_task_num`と`num_scanner_threads`セッション変数を調整して、[テーブルレベルのリクエスト並行性](https://help.aliyun.com/zh/maxcompute/user-guide/data-transfer-service-quota-manage?spm=a2c4g.11186623.help-menu-search-27797.d_2)を制御し、データ転送サービスでのリソース消費を管理できます。対応する並行性は`max(parallel_pipeline_task_num * be num * num_scanner_threads)`と等しくなります。

注意：

1. この方法は、単一クエリ内の単一テーブルの並行リクエスト数のみを制御でき、複数のSQL文間でのリソース使用量は制御できません。

2. 並行性を減らすとクエリ時間が増加します。
