---
{
  "title": "Aliyun DLF",
  "description": "この文書では、CREATE CATALOG文を使用してAlibaba Cloud Data Lake Formation (DLF)メタデータサービスに接続してアクセスする方法について説明します。",
  "language": "ja"
}
---
この文書では、`CREATE CATALOG`文を使用してAlibaba Cloud [Data Lake Formation (DLF)](https://www.alibabacloud.com/product/datalake-formation) メタデータサービスに接続し、アクセスする方法について説明します。

## DLFバージョンに関する注意事項

- DLF 1.0バージョンの場合、DorisはDLFのHive Metastore互換インターフェースを通じてDLFにアクセスします。Paimon カタログとHive カタログをサポートしています。
- DLFバージョン2.5以降の場合、DorisはDLFのRestインターフェースを通じてDLFにアクセスします。Paimon カタログのみサポートしています。

### DLF 1.0

| パラメータ名 | 従来の名前 | 説明 | デフォルト値 | 必須 |
|------------|------------|------|--------------|------|
| `dlf.endpoint` | - | DLFエンドポイント、参照: [Alibaba Cloud Documentation](https://www.alibabacloud.com/help/en/dlf/dlf-1-0/regions-and-endpoints) | None | Yes |
| `dlf.region` | - | DLFリージョン、参照: [Alibaba Cloud Documentation](https://www.alibabacloud.com/help/en/dlf/dlf-1-0/regions-and-endpoints) | None | Yes |
| `dlf.uid` | - | Alibaba CloudアカウントID。コンソール右上の個人情報で確認できます。 | None | Yes |
| `dlf.access_key` | - | DLFサービスにアクセスするためのAlibaba Cloud AccessKey。 | None | Yes |
| `dlf.secret_key` | - | DLFサービスにアクセスするためのAlibaba Cloud SecretKey。 | None | Yes |
| `dlf.catalog_id` | `dlf.catalog.id` | カタログ ID。メタデータカタログを指定するために使用されます。設定されていない場合は、デフォルトカタログが使用されます。 | None | No |
| `warehouse` | - | Warehouseのストレージパス、Paimon カタログでのみ必要です。オブジェクトストレージパスは`/`で終わる必要があることに注意してください。 | None | No |

> 注意:
>
> バージョン3.1.0以前では、従来の名前を使用してください。

### DLF 2.5+ (Rest カタログ)

> バージョン3.1.0以降でサポート

| パラメータ名 | 従来の名前 | 説明 | デフォルト値 | 必須 |
|------------|------------|------|--------------|------|
| `uri` | - | DLF REST URI。例: http://cn-beijing-vpc.dlf.aliyuncs.com | None | Yes |
| `warehouse` | - | Warehouse名。注意: 接続するカタログの名前を直接入力し、PaimonTableのストレージパスではありません | None | Yes |
| `paimon.rest.token.provider` | - | Token provider、固定値`dlf` | None | Yes |
| `paimon.rest.dlf.access-key-id` | - | DLFサービスにアクセスするためのAlibaba Cloud AccessKey。 | None | Yes |
| `paimon.rest.dlf.access-key-secret` | - | DLFサービスにアクセスするためのAlibaba Cloud SecretKey。 | None | Yes |

DLF Rest カタログでは、ストレージサービス(OSS)のEndpointとRegion情報を提供する必要がありません。DorisはDLF Rest カタログのVended Credentialを使用して、OSSにアクセスするための一時的な認証情報を取得します。

## 例

### DLF 1.0

DLFをメタデータサービスとしてHive カタログを作成:

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
### DLF 2.5+ (Rest カタログ)

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
