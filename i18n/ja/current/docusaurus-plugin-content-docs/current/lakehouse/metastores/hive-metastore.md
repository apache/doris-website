---
{
  "title": "Hive Metastore",
  "language": "ja",
  "description": "このドキュメントでは、CREATE CATALOG文を通じてHive MetaStoreサービスに接続およびアクセスする際にサポートされるすべてのパラメータについて説明します。"
}
---
このドキュメントでは、`CREATE CATALOG`文を通じてHive MetaStoreサービスへの接続およびアクセス時にサポートされるすべてのパラメータについて説明します。

## サポートされているCatalogタイプ

| Catalogタイプ | タイプ識別子 (type) | 説明                      |
| ------------ | ---------------------- | -------------------------------- |
| Hive         | hms                    | Hive Metastoreに接続するためのCatalog |
| Iceberg      | iceberg                | Icebergテーブル形式用のCatalog |
| Paimon       | paimon                 | Apache Paimonテーブル形式用のCatalog |

## 共通パラメータの概要

以下のパラメータは、異なるCatalogタイプに共通です。

| パラメータ名                     | 旧名称                       | 必須 | デフォルト | 説明                                                                                                                                                                              |
| ---------------------------------- | --------------------------------- | -------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| hive.metastore.uris                |                                   | はい      | なし    | Hive MetastoreのURIアドレス。カンマで区切られた複数のURIをサポートします。例：'hive.metastore.uris' = 'thrift://127.0.0.1:9083'、'hive.metastore.uris' = 'thrift://127.0.0.1:9083,thrift://127.0.0.1:9084' |
| hive.metastore.authentication.type | hadoop.security.authentication    | いいえ       | simple  | Metastore認証方法：simple（デフォルト）またはkerberosをサポートします。バージョン3.0以前では、認証方法はhadoop.security.authenticationプロパティによって決定されました。バージョン3.1以降、Hive Metastore認証方法を個別に指定できます。例：'hive.metastore.authentication.type' = 'kerberos' |
| hive.metastore.service.principal   | hive.metastore.kerberos.principal | いいえ       | 空   | Hiveサーバープリンシパル、_HOSTプレースホルダーをサポートします。例：'hive.metastore.service.principal' = 'hive/_HOST@EXAMPLE.COM'                                                               |
| hive.metastore.client.principal    | hadoop.kerberos.principal         | いいえ       | 空   | DorisがHive MetaStoreサービスに接続する際に使用するKerberosプリンシパル。                                                                                                                  |
| hive.metastore.client.keytab       | hadoop.kerberos.keytab            | いいえ       | 空   | Kerberos keytabファイルパス                                                                                                                                                               |
| hive.metastore.username            | hadoop.username                   | いいえ       | hadoop  | Hive Metastoreユーザー名、非Kerberosモードで使用                                                                                                                                      |
| hive.conf.resources                |                                   | いいえ       | 空   | hive-site.xml設定ファイルパス、相対パスを使用                                                                                                                             |
| hive.metastore.client.socket.timeout                |                                   | いいえ    | デフォルト値はFE設定パラメータの`hive_metastore_client_timeout_second`で、デフォルトは10秒です。 | このパラメータはバージョン4.0.3以降でサポートされています。Hive Metastore Client接続を通じてメタデータにアクセスする際のタイムアウト。メタデータが大きい場合（例：パーティションが多い場合）、この値を増加できます。 |

> 注意：
>
> バージョン3.1.0より前では、旧名称を使用してください。

### 必須パラメータ

* `hive.metastore.uris`：Hive MetastoreのURIアドレスを指定する必要があります

### オプションパラメータ

* `hive.metastore.authentication.type`：認証方法、デフォルトは`simple`、オプションで`kerberos`

* `hive.metastore.service.principal`：Hive MetaStoreサービスのKerberosプリンシパル、Kerberos認証使用時に指定が必要です。

* `hive.metastore.client.principal`：DorisがHive MetaStoreサービスに接続する際に使用するKerberosプリンシパル、Kerberos認証使用時に指定が必要です。

* `hive.metastore.client.keytab`：Kerberos keytabファイルパス、Kerberos認証使用時に指定が必要です。

* `hive.metastore.username`：Hive MetaStoreサービスに接続するためのユーザー名、非Kerberosモードで使用、デフォルトは`hadoop`です。

* `hive.conf.resources`：hive-site.xml設定ファイルパス、Hive Metastoreサービスへの接続設定を設定ファイルから読み込む必要がある場合に使用します。

### 認証方法

#### Simple認証

* `simple`：非Kerberosモード、Hive Metastoreサービスに直接接続します。

#### Kerberos認証

Kerberos認証を使用してHive Metastoreサービスに接続するには、以下のパラメータを設定してください：

* `hive.metastore.authentication.type`：`kerberos`に設定

* `hive.metastore.service.principal`：Hive MetaStoreサービスのKerberosプリンシパル

* `hive.metastore.client.principal`：DorisがHive MetaStoreサービスに接続する際に使用するKerberosプリンシパル

* `hive.metastore.client.keytab`：Kerberos keytabファイルパス

```sql
'hive.metastore.authentication.type' = 'kerberos',
'hive.metastore.service.principal' = 'hive/_HOST@EXAMPLE.COM',
'hive.metastore.client.principal' = 'hive/doris.cluster@EXAMPLE.COM',
'hive.metastore.client.keytab' = '/etc/security/keytabs/hive.keytab'
```
Kerberos認証を有効にしたHive MetaStoreサービスを使用する場合、すべてのFEノードに同じkeytabファイルが存在すること、Dorisプロセスを実行するユーザーがkeytabファイルに対する読み取り権限を持つこと、およびkrb5設定ファイルが適切に設定されていることを確認してください。

一般的なKerberos設定の問題とベストプラクティスについては、[Kerberos](../best-practices/kerberos.md)を参照してください。

### 設定ファイルパラメータ

#### `hive.conf.resources`

設定ファイルを通じてHive Metastoreサービスへの接続設定を読み取る必要がある場合、`hive.conf.resources`パラメータを設定してconfファイルのパスを設定できます。

> 注意：`hive.conf.resources`パラメータは相対パスのみをサポートしており、絶対パスは使用しないでください。デフォルトパスは`${DORIS_HOME}/plugins/hadoop_conf/`ディレクトリ下にあります。fe.confのhadoop_config_dirを変更することで、他のディレクトリを指定できます。

例：`'hive.conf.resources' = 'hms-1/hive-site.xml'`

## Catalogタイプ固有データ

以下のパラメータは、共通パラメータに加えて各Catalogタイプ固有のものです。

### Hive Catalog

| パラメータ名        | 旧名        | 必須     | デフォルト | 説明                                                          |
| ------------------- | ----------- | -------- | ------- | -------------------------------------------------------------------- |
| type                |             | Yes      | None    | Catalogタイプ、Hive Catalogの場合はhmsに固定                         |
| hive.metastore.type |             | No       | 'hms'   | Metadata Catalogタイプ、Hive Metastoreの場合はhmsに固定、HiveMetaStoreを使用する際はhmsである必要があります |

#### 例

1. 認証なしのHive Metastoreをメタデータサービスとして使用し、S3ストレージサービスを使用するHive Catalogを作成する。

   ```sql
   CREATE CATALOG hive_hms_s3_test_catalog PROPERTIES (
       'type' = 'hms',
       'hive.metastore.uris' = 'thrift://127.0.0.1:9383',
       's3.access_key' = 'S3_ACCESS_KEY',
       's3.secret_key' = 'S3_SECRET_KEY',
       's3.region' = 's3.ap-east-1.amazonaws.com'
   );
   ```
2. Kerberos認証が有効化されたHive Metastoreをメタデータサービスとして使用し、S3ストレージサービスを使用してHive Catalogを作成する。

   ```sql
    CREATE CATALOG hive_hms_on_oss_kerberos_new_catalog PROPERTIES (
       'type' = 'hms',
       'hive.metastore.uris' = 'thrift://127.0.0.1:9583',
       'hive.metastore.client.principal'='hive/presto-master.docker.cluster@LABS.TERADATA.COM',
       'hive.metastore.client.keytab' = '/mnt/keytabs/keytabs/hive-presto-master.keytab',
       'hive.metastore.service.principal' = 'hive/hadoop-master@LABS.TERADATA.COM',
       'hive.metastore.authentication.type'='kerberos',
       'hadoop.security.auth_to_local' = 'RULE:[2:\$1@\$0](.*@LABS.TERADATA.COM)s/@.*//
                          RULE:[2:\$1@\$0](.*@OTHERLABS.TERADATA.COM)s/@.*//
                          RULE:[2:\$1@\$0](.*@OTHERREALM.COM)s/@.*//
                          DEFAULT',
       'oss.access_key' = 'OSS_ACCESS_KEY',
       'oss.secret_key' = 'OSS_SECRET_KEY',
       'oss.endpoint' = 'oss-cn-beijing.aliyuncs.com'
   );
   ```
### Iceberg Catalog

| Parameter Name       | Former Name | Required | Default | Description                                                          |
| -------------------- | ----------- | -------- | ------- | -------------------------------------------------------------------- |
| type                 |             | Yes      | None    | Catalogタイプ、Icebergの場合はicebergに固定                          |
| iceberg.catalog.type |             | No       | None    | Metadata Catalogタイプ、Hive Metastoreの場合はhmsに固定、HiveMetaStore使用時はhmsである必要があります |
| warehouse            |             | No       | None    | Iceberg warehouseパス                                               |

#### 例

1. Hive Metastoreをメタデータサービスとして使用し、S3ストレージサービスを使ったIceberg Catalogを作成する。

    ```sql
     CREATE CATALOG iceberg_hms_s3_test_catalog PROPERTIES (
        'type' = 'iceberg',
        'iceberg.catalog.type' = 'hms',
        'hive.metastore.uris' = 'thrift://127.0.0.1:9383',
        'warehouse' = 's3://doris/iceberg_warehouse/',
        's3.access_key' = 'S3_ACCESS_KEY',
        's3.secret_key' = 'S3_SECRET_KEY',
        's3.region' = 's3.ap-east-1.amazonaws.com'
    );
    ```
2. マルチKerberos環境において、S3ストレージサービスを使用し、Kerberos認証を有効にしたHive Metastoreをメタデータサービスとして使用するIceberg Catalogを作成します。

    ```sql
    CREATE CATALOG IF NOT EXISTS iceberg_hms_on_oss_kerberos_new_catalog PROPERTIES (
        'type' = 'iceberg',
        'iceberg.catalog.type' = 'hms',
        'hive.metastore.uris' = 'thrift://127.0.0.1:9583',
        'warehouse' = 'oss://doris/iceberg_warehouse/',
        'hive.metastore.client.principal'='hive/presto-master.docker.cluster@LABS.TERADATA.COM',
        'hive.metastore.client.keytab' = '/mnt/keytabs/keytabs/hive-presto-master.keytab',
        'hive.metastore.service.principal' = 'hive/hadoop-master@LABS.TERADATA.COM',
        'hive.metastore.authentication.type'='kerberos',
        'hadoop.security.auth_to_local' = 'RULE:[2:\$1@\$0](.*@LABS.TERADATA.COM)s/@.*//
                           RULE:[2:\$1@\$0](.*@OTHERLABS.TERADATA.COM)s/@.*//
                           RULE:[2:\$1@\$0](.*@OTHERREALM.COM)s/@.*//
                           DEFAULT',
        'oss.access_key' = 'OSS_ACCESS_KEY',
        'oss.secret_key' = 'OSS_SECRET_KEY',
        'oss.endpoint' = 'oss-cn-beijing.aliyuncs.com'
    );
    ```
### Paimon Catalog

| Parameter Name      | Former Name | Required | Default    | Description                                                         |
| ------------------- | ----------- | -------- | ---------- | ------------------------------------------------------------------- |
| type                |             | Yes      | None       | カタログタイプ、Paimonの場合はpaimonに固定                                    |
| paimon.catalog.type |             | No       | filesystem | HiveMetaStoreを使用する場合はhmsである必要があります。デフォルトはfilesystemでメタデータをファイルシステムに保存します |
| warehouse           |             | Yes      | None       | Paimonウェアハウスパス                                                   |

#### 例

1. Hive Metastoreをメタデータサービスとして、S3をストレージサービスとして使用するPaimon Catalogを作成する。

    ```sql
     CREATE CATALOG IF NOT EXISTS paimon_hms_s3_test_catalog PROPERTIES (
        'type' = 'paimon',
        'paimon.catalog.type' = 'hms',
        'hive.metastore.uris' = 'thrift://127.0.0.1:9383',
        'warehouse' = 's3://doris/paimon_warehouse/',
        's3.access_key' = 'S3_ACCESS_KEY',
        's3.secret_key' = 'S3_SECRET_KEY',
        's3.region' = 's3.ap-east-1.amazonaws.com'
    );
    ```
2. マルチKerberos環境において、S3ストレージサービスを使用し、Kerberos認証が有効化されたHive Metastoreをメタデータサービスとして使用するPaimon Catalogを作成します。

    ```sql
     CREATE CATALOG IF NOT EXISTS paimon_hms_on_oss_kerberos_new_catalog PROPERTIES (
        'type' = 'paimon',
        'paimon.catalog.type' = 'hms',
        'hive.metastore.uris' = 'thrift://127.0.0.1:9583',
        'warehouse' = 's3://doris/iceberg_warehouse/',
        'hive.metastore.client.principal'='hive/presto-master.docker.cluster@LABS.TERADATA.COM',
        'hive.metastore.client.keytab' = '/mnt/keytabs/keytabs/hive-presto-master.keytab',
        'hive.metastore.service.principal' = 'hive/hadoop-master@LABS.TERADATA.COM',
        'hive.metastore.authentication.type'='kerberos',
        'hadoop.security.auth_to_local' = 'RULE:[2:\$1@\$0](.*@LABS.TERADATA.COM)s/@.*//
                           RULE:[2:\$1@\$0](.*@OTHERLABS.TERADATA.COM)s/@.*//
                           RULE:[2:\$1@\$0](.*@OTHERREALM.COM)s/@.*//
                           DEFAULT',
        'oss.access_key' = 'OSS_ACCESS_KEY',
        'oss.secret_key' = 'OSS_SECRET_KEY',
        'oss.endpoint' = 'oss-cn-beijing.aliyuncs.com'
    );
    ```
## HMS アクセスポート要件

DorisがHMSにアクセスするには、最低でも以下のポートが開いている必要があります：

| Service        | Port Purpose          | Default Port | Protocol |
|----------------|-----------------------|--------------|----------|
| Hive Metastore | Thrift (metadata access) | 9083         | TCP      |

注意事項：
- ポートは`hive-site.xml`でカスタマイズできます。常に実際の設定に従ってください。
- Kerberos認証が有効になっている場合、DorisからKerberos KDCへのネットワーク接続を確保してください。KDCは、KDC設定でカスタマイズされていない限り、デフォルトでTCPポート88でリッスンします。

## よくある質問（FAQ）

- Q1: hive-site.xmlは必須ですか？

    いいえ、設定を読み取る必要がある場合にのみ使用されます。

- Q2: keytabファイルはすべてのノードに存在する必要がありますか？

    はい、すべてのFEノードが指定されたパスにアクセスできる必要があります。

- Q3: 書き戻し機能を使用する際、つまりDorisでHive/Icebergデータベース/テーブルを作成する際に注意すべき点は何ですか？

    テーブル作成にはストレージ側でのメタデータ操作、つまりストレージシステムへのアクセスが伴うため、Hive MetaStoreサービスのサーバー側では、S3、OSSなどのストレージサービスのアクセスパラメータなどの対応するストレージパラメータを設定する必要があります。オブジェクトストレージを基盤ストレージシステムとして使用する場合は、書き込み先のバケットが設定されたRegionと一致することを確認してください。
