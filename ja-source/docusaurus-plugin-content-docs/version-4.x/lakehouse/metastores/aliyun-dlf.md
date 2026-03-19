---
{
  "title": "Aliyun DLF",
  "language": "ja",
  "description": "この文書では、CREATE CATALOG文を使用してAlibaba Cloud Data Lake Formation（DLF）メタデータサービスに接続しアクセスする方法について説明します。"
}
---
このドキュメントでは、`CREATE CATALOG`文を使用してAlibaba Cloud [Data Lake Formation (DLF)](https://www.alibabacloud.com/product/datalake-formation) メタデータサービスに接続しアクセスする方法について説明します。

## DLFバージョンに関する注意事項

- DLF 1.0バージョンの場合、DorisはDLFのHive Metastore互換インターフェース経由でDLFにアクセスします。Paimon CatalogとHive Catalogをサポートします。
- DLFバージョン2.5以降の場合、DorisはDLFのRestインターフェース経由でDLFにアクセスします。Paimon Catalogのみサポートします。

### DLF 1.0

| パラメータ名 | 旧名 | 説明 | デフォルト値 | 必須 |
|-------------|------|------|-------------|------|
| `dlf.endpoint` | - | DLFエンドポイント。参照: [Alibaba Cloudドキュメント](https://www.alibabacloud.com/help/en/dlf/dlf-1-0/regions-and-endpoints) | なし | はい |
| `dlf.region` | - | DLFリージョン。参照: [Alibaba Cloudドキュメント](https://www.alibabacloud.com/help/en/dlf/dlf-1-0/regions-and-endpoints) | なし | はい |
| `dlf.uid` | - | Alibaba CloudアカウントID。コンソール右上の個人情報で確認可能。 | なし | はい |
| `dlf.access_key` | - | DLFサービスにアクセスするためのAlibaba Cloud AccessKey。 | なし | はい |
| `dlf.secret_key` | - | DLFサービスにアクセスするためのAlibaba Cloud SecretKey。 | なし | はい |
| `dlf.catalog_id` | `dlf.catalog.id` | Catalog ID。メタデータカタログを指定するために使用。設定されていない場合、デフォルトカタログが使用されます。 | なし | いいえ |
| `warehouse` | - | Warehouseのストレージパス。Paimon Catalogでのみ必要。オブジェクトストレージパスは`/`で終わる必要があることに注意。 | なし | いいえ |

> 注意:
>
> バージョン3.1.0より前では、旧名を使用してください。

### DLF 2.5+ (Rest Catalog)

> バージョン3.1.0以降でサポート

| パラメータ名 | 旧名 | 説明 | デフォルト値 | 必須 |
|-------------|------|------|-------------|------|
| `uri` | - | DLF REST URI。例: http://cn-beijing-vpc.dlf.aliyuncs.com | なし | はい |
| `warehouse` | - | Warehouse名。注意: 接続するCatalogの名前を直接入力し、Paimonテーブルのストレージパスではない | なし | はい |
| `paimon.rest.token.provider` | - | トークンプロバイダー、固定値`dlf` | なし | はい |
| `paimon.rest.dlf.access-key-id` | - | DLFサービスにアクセスするためのAlibaba Cloud AccessKey。 | なし | はい |
| `paimon.rest.dlf.access-key-secret` | - | DLFサービスにアクセスするためのAlibaba Cloud SecretKey。 | なし | はい |

DLF Rest Catalogでは、ストレージサービス（OSS）のEndpointとRegion情報を提供する必要はありません。DorisはDLF Rest CatalogのVended CredentialでOSSにアクセスするための一時的な認証情報を取得します。

## 例

### DLF 1.0

DLFをメタデータサービスとしてHive Catalogを作成:

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
