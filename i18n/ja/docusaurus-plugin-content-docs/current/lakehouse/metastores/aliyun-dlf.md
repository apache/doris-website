---
{
  "title": "Aliyun DLF",
  "language": "ja",
  "description": "この文書では、CREATE CATALOG文を使用してAlibaba Cloud Data Lake Formation（DLF）メタデータサービスに接続し、アクセスする方法について説明します。"
}
---
このドキュメントでは、`CREATE CATALOG`文を使用してAlibaba Cloud [Data Lake Formation (DLF)](https://www.alibabacloud.com/product/datalake-formation) メタデータサービスに接続およびアクセスする方法について説明します。

## DLFバージョンに関する注意事項

- DLF 1.0バージョンでは、DorisはDLFのHive Metastore互換インターフェイス経由でDLFにアクセスします。Paimon カタログおよびHive カタログをサポートしています。
- DLFバージョン2.5以降では、DorisはDLFのRestインターフェイス経由でDLFにアクセスします。Paimon カタログのみをサポートしています。

### DLF 1.0

| パラメータ名 | 旧名 | 説明 | デフォルト値 | 必須 |
|-------------|------|------|-------------|------|
| `dlf.endpoint` | - | DLFエンドポイント、参照: [Alibaba Cloudドキュメント](https://www.alibabacloud.com/help/en/dlf/dlf-1-0/regions-and-endpoints) | None | Yes |
| `dlf.region` | - | DLFリージョン、参照: [Alibaba Cloudドキュメント](https://www.alibabacloud.com/help/en/dlf/dlf-1-0/regions-and-endpoints) | None | Yes |
| `dlf.uid` | - | Alibaba CloudアカウントID。コンソール右上の個人情報で確認できます。 | None | Yes |
| `dlf.access_key` | - | DLFサービスにアクセスするためのAlibaba Cloud AccessKey。 | None | Yes |
| `dlf.secret_key` | - | DLFサービスにアクセスするためのAlibaba Cloud SecretKey。 | None | Yes |
| `dlf.catalog_id` | `dlf.catalog.id` | カタログ ID。メタデータカタログを指定するために使用されます。設定されていない場合、デフォルトカタログが使用されます。 | None | No |
| `warehouse` | - | Warehouseのストレージパス、Paimon カタログでのみ必要です。オブジェクトストレージパスは`/`で終わる必要があることに注意してください。 | None | No |

> 注意:
>
> バージョン3.1.0より前では、旧名を使用してください。

### DLF 2.5+ (Rest カタログ)

> バージョン3.1.0以降でサポート

| パラメータ名 | 旧名 | 説明 | デフォルト値 | 必須 |
|-------------|------|------|-------------|------|
| `uri` | - | DLF REST URI。例: http://cn-beijing-vpc.dlf.aliyuncs.com | None | Yes |
| `warehouse` | - | Warehouse名。注意: 接続するカタログの名前を直接入力し、Paimonテーブルのストレージパスではありません | None | Yes |
| `paimon.rest.token.provider` | - | トークンプロバイダ、固定値`dlf` | None | Yes |
| `paimon.rest.dlf.access-key-id` | - | DLFサービスにアクセスするためのAlibaba Cloud AccessKey。 | None | Yes |
| `paimon.rest.dlf.access-key-secret` | - | DLFサービスにアクセスするためのAlibaba Cloud SecretKey。 | None | Yes |

DLF Rest カタログでは、ストレージサービス（OSS）のEndpointおよびRegion情報を提供する必要はありません。DorisはDLF Rest カタログのVended Credentialを使用してOSSにアクセスするための一時的な認証情報を取得します。

## 例

### DLF 1.0

DLFをメタデータサービスとするHive カタログを作成します:

```sql
CREATE CATALOG hive_dlf_catalog WITH (
  'type' = 'hms',
  'hive.metastore.type' = 'dlf',
  'dlf.endpoint' = '<DLF_ENDPOINT>',
  'dlf.region' = '<DLF_REGION>',
  'dlf.uid' = '<YOUR_ALICLOUD_UID>',
  'dlf.access_key' = '<YOUR_ACCESS_KEY>',
  'dlf.secret_key' = '<YOUR_SECRET_KEY>'
);
```
DLFをメタデータサービスとしてPaimon Catalogを作成する：

```sql
CREATE CATALOG paimon_dlf PROPERTIES (
    'type' = 'paimon',
    'paimon.catalog.type' = 'dlf',
    'warehouse' = 'oss://xx/yy/',
    'dlf.proxy.mode' = 'DLF_ONLY',
    'dlf.endpoint' = '<DLF_ENDPOINT>',
    'dlf.region' = '<DLF_REGION>',
    'dlf.uid' = '<YOUR_ALICLOUD_UID>',
    'dlf.access_key' = '<YOUR_ACCESS_KEY>',
    'dlf.secret_key' = '<YOUR_SECRET_KEY>'
);
```
### DLF 2.5+ (Rest Catalog)

```sql
CREATE CATALOG paimon_dlf_test PROPERTIES (
    'type' = 'paimon',
    'paimon.catalog.type' = 'rest',
    'uri' = 'http://cn-beijing-vpc.dlf.aliyuncs.com',
    'warehouse' = 'my_catalog_name',
    'paimon.rest.token.provider' = 'dlf',
    'paimon.rest.dlf.access-key-id' = '<YOUR_ACCESS_KEY>',
    'paimon.rest.dlf.access-key-secret' = '<YOUR_SECRET_KEY>'
);
```
