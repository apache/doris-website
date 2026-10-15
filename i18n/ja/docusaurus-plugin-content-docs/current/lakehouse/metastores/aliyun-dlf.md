---
{
    "title": "Aliyun DLF",
    "language": "ja",
    "description": "CREATE CATALOG ステートメントを使用して、Alibaba Cloud Data Lake Formation（DLF）のメタデータサービスに接続し、アクセスする方法を説明します。"
}
---

このドキュメントでは、`CREATE CATALOG` ステートメントを使用して Alibaba Cloud の [Data Lake Formation（DLF）](https://www.alibabacloud.com/product/datalake-formation) メタデータサービスに接続し、アクセスする方法を説明します。

## DLF のバージョン別の注意事項

- DLF 1.0 では、Doris は DLF の Hive Metastore 互換インターフェースを介して DLF にアクセスします。Paimon Catalog と Hive Catalog をサポートします。
- DLF 2.5 以降では、Doris は DLF の REST インターフェースを介して DLF にアクセスします。Paimon Catalog のみをサポートします。

### DLF 1.0

| パラメータ名 | 旧名称 | 説明 | デフォルト値 | 必須 |
|----------------|-------------|-------------|---------------|----------|
| `dlf.endpoint` | - | DLF のエンドポイント。[Alibaba Cloud のドキュメント](https://www.alibabacloud.com/help/en/dlf/dlf-1-0/regions-and-endpoints)を参照してください。 | なし | はい |
| `dlf.region` | - | DLF のリージョン。[Alibaba Cloud のドキュメント](https://www.alibabacloud.com/help/en/dlf/dlf-1-0/regions-and-endpoints)を参照してください。 | なし | はい |
| `dlf.uid` | - | Alibaba Cloud アカウント ID。コンソール右上の個人情報で確認できます。 | なし | はい |
| `dlf.access_key` | - | DLF サービスへのアクセスに使用する Alibaba Cloud の AccessKey。 | なし | はい |
| `dlf.secret_key` | - | DLF サービスへのアクセスに使用する Alibaba Cloud の SecretKey。 | なし | はい |
| `dlf.catalog_id` | `dlf.catalog.id` | Catalog ID。メタデータカタログを指定します。設定しない場合はデフォルトのカタログが使用されます。 | なし | いいえ |
| `warehouse` | - | Warehouse のストレージパス。Paimon Catalog の場合にのみ必要です。オブジェクトストレージのパスは `/` で終わる必要があります。 | なし | いいえ |

> 注:
>
> 3.1.0 より前のバージョンでは、旧名称を使用してください。

### DLF 2.5+（REST Catalog）

> バージョン 3.1.0 以降でサポートされます。

| パラメータ名 | 旧名称 | 説明 | デフォルト値 | 必須 |
|----------------|-------------|-------------|---------------|----------|
| `uri` | - | DLF REST の URI。例: http://cn-beijing-vpc.dlf.aliyuncs.com | なし | はい |
| `warehouse` | - | Warehouse 名。接続先の Catalog 名を直接入力します。Paimon テーブルのストレージパスではありません。 | なし | はい |
| `paimon.rest.token.provider` | - | トークンプロバイダー。固定値は `dlf` です。 | なし | はい |
| `paimon.rest.dlf.access-key-id` | - | DLF サービスへのアクセスに使用する Alibaba Cloud の AccessKey。 | なし | はい |
| `paimon.rest.dlf.access-key-secret` | - | DLF サービスへのアクセスに使用する Alibaba Cloud の SecretKey。 | なし | はい |

DLF REST Catalog では、ストレージサービス（OSS）のエンドポイントとリージョンの情報を指定する必要はありません。Doris は DLF REST Catalog の Vended Credential を使用して、OSS にアクセスするための一時的な認証情報を取得します。

## 例

### DLF 1.0

DLF をメタデータサービスとして使用する Hive Catalog を作成します。

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

DLF をメタデータサービスとして使用する Paimon Catalog を作成します。

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

### DLF 2.5+（REST Catalog）

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
