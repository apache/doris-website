---
{
  "title": "Aliyun DLF",
  "language": "ja",
  "description": "この文書では、CREATE CATALOG文を使用してAlibaba Cloud Data Lake Formation (DLF) メタデータサービスに接続およびアクセスする方法について説明します。"
}
---
このドキュメントでは、`CREATE CATALOG`文を使用してAlibaba Cloud [Data Lake Formation (DLF)](https://www.alibabacloud.com/product/datalake-formation) メタデータサービスに接続し、アクセスする方法について説明します。

## DLFバージョン注記

- DLF 1.0バージョンの場合、DorisはDLFのHive Metastore互換インターフェースを通じてDLFにアクセスします。Paimon CatalogとHive Catalogをサポートします。
- DLFバージョン2.5以降の場合、DorisはDLFのRestインターフェースを通じてDLFにアクセスします。Paimon Catalogのみをサポートします。

### DLF 1.0

| パラメータ名 | 旧名称 | 説明 | デフォルト値 | 必須 |
|------------|--------|------|--------------|------|
| `dlf.endpoint` | - | DLFエンドポイント、参照：[Alibaba Cloud Documentation](https://www.alibabacloud.com/help/en/dlf/dlf-1-0/regions-and-endpoints) | None | Yes |
| `dlf.region` | - | DLFリージョン、参照：[Alibaba Cloud Documentation](https://www.alibabacloud.com/help/en/dlf/dlf-1-0/regions-and-endpoints) | None | Yes |
| `dlf.uid` | - | Alibaba CloudアカウントID。コンソールの右上角の個人情報で確認できます。 | None | Yes |
| `dlf.access_key` | - | DLFサービスにアクセスするためのAlibaba Cloud AccessKey。 | None | Yes |
| `dlf.secret_key` | - | DLFサービスにアクセスするためのAlibaba Cloud SecretKey。 | None | Yes |
| `dlf.catalog_id` | `dlf.catalog.id` | Catalog ID。メタデータカタログを指定するために使用されます。設定されていない場合、デフォルトのカタログが使用されます。 | None | No |
| `warehouse` | - | Warehouseのストレージパス、Paimon Catalogでのみ必要です。オブジェクトストレージパスは`/`で終わる必要があります。 | None | No |

> 注記：
>
> バージョン3.1.0より前のバージョンでは、旧名称を使用してください。

### DLF 2.5+ (Rest Catalog)

> バージョン3.1.0以降でサポート

| パラメータ名 | 旧名称 | 説明 | デフォルト値 | 必須 |
|------------|--------|------|--------------|------|
| `uri` | - | DLF REST URI。例：http://cn-beijing-vpc.dlf.aliyuncs.com | None | Yes |
| `warehouse` | - | Warehouse名。注記：接続するCatalogの名前を直接入力し、Paimonテーブルのストレージパスではありません | None | Yes |
| `paimon.rest.token.provider` | - | トークンプロバイダー、固定値`dlf` | None | Yes |
| `paimon.rest.dlf.access-key-id` | - | DLFサービスにアクセスするためのAlibaba Cloud AccessKey。 | None | Yes |
| `paimon.rest.dlf.access-key-secret` | - | DLFサービスにアクセスするためのAlibaba Cloud SecretKey。 | None | Yes |

DLF Rest Catalogでは、ストレージサービス（OSS）のEndpointとRegion情報を提供する必要はありません。DorisはDLF Rest CatalogのVended Credentialを使用してOSSにアクセスするための一時的な認証情報を取得します。

## 例

### DLF 1.0

DLFをメタデータサービスとしてHive Catalogを作成：

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
DLFをメタデータサービスとして使用してPaimon Catalogを作成する：

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
