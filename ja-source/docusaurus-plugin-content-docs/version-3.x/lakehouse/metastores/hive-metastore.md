---
{
  "title": "Hive Metastore",
  "description": "このドキュメントでは、CREATE CATALOG文を通じてHive MetaStoreサービスに接続およびアクセスする際にサポートされるすべてのパラメータについて説明します。",
  "language": "ja"
}
---
この文書では、`CREATE CATALOG`文を通じてHive MetaStoreサービスに接続してアクセスする際のサポートされているすべてのパラメータについて説明します。

## サポートされているカタログタイプ

| カタログ タイプ | タイプ Identifier (type) | デスクリプション                      |
| ------------ | ---------------------- | -------------------------------- |
| Hive         | hms                    | Hive Metastoreに接続するためのカタログ |
| Iceberg      | iceberg                | IcebergTable形式のためのカタログ |
| Paimon       | paimon                 | Apache PaimonTable形式のためのカタログ |

## 共通パラメータ概要

以下のパラメータは異なるカタログタイプに共通です。

| パラメータ名                     | 旧称                       | Required | Default | デスクリプション                                                                                                                                                                              |
| ---------------------------------- | --------------------------------- | -------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| hive.metastore.uris                |                                   | Yes      | None    | Hive MetastoreのURIアドレス、カンマで区切られた複数のURIをサポート。例：'hive.metastore.uris' = 'thrift://127.0.0.1:9083','hive.metastore.uris' = 'thrift://127.0.0.1:9083,thrift://127.0.0.1:9084' |
| hive.metastore.authentication.type | hadoop.security.authentication    | No       | simple  | Metastore認証方式：simple（デフォルト）またはkerberosをサポート。バージョン3.0以前では、認証方式はhadoop.security.authenticationプロパティによって決定されていました。バージョン3.1から、Hive Metastore認証方式を個別に指定できます。例：'hive.metastore.authentication.type' = 'kerberos' |
| hive.metastore.service.principal   | hive.metastore.kerberos.principal | No       | Empty   | Hiveサーバープリンシパル、_HOSTプレースホルダーをサポート。例：'hive.metastore.service.principal' = 'hive/_HOST@EXAMPLE.COM'                                                               |
| hive.metastore.client.principal    | hadoop.kerberos.principal         | No       | Empty   | DorisがHive MetaStoreサービスに接続するために使用するKerberosプリンシパル。                                                                                                                  |
| hive.metastore.client.keytab       | hadoop.kerberos.keytab            | No       | Empty   | Kerberosキータブファイルパス                                                                                                                                                               |
| hive.metastore.username            | hadoop.username                   | No       | hadoop  | Hive Metastoreユーザー名、非Kerberosモードで使用                                                                                                                                      |
| hive.conf.resources                |                                   | No       | Empty   | hive-site.xml設定ファイルパス、相対パスを使用                                                                                                                             |
| hive.metastore.client.socket.timeout                |                                   | No    | デフォルト値はFE設定パラメータの`hive_metastore_client_timeout_second`で、デフォルトは10秒です。 | このパラメータはバージョン4.0.3からサポートされています。Hive Metastore Client接続を通じてメタデータにアクセスする際のタイムアウト。メタデータが大きい場合（例：パーティション数が多い場合）、この値を増やすことができます。 |

> 注意:
>
> バージョン3.1.0以前については、旧名を使用してください。

### 必須パラメータ

* `hive.metastore.uris`: Hive MetastoreのURIアドレスを指定する必要があります

### オプションパラメータ

* `hive.metastore.authentication.type`: 認証方式、デフォルトは`simple`、`kerberos`がオプション

* `hive.metastore.service.principal`: Hive MetaStoreサービスのKerberosプリンシパル、Kerberos認証を使用する場合に指定する必要があります。

* `hive.metastore.client.principal`: DorisがHive MetaStoreサービスに接続するために使用するKerberosプリンシパル、Kerberos認証を使用する場合に指定する必要があります。

* `hive.metastore.client.keytab`: Kerberosキータブファイルパス、Kerberos認証を使用する場合に指定する必要があります。

* `hive.metastore.username`: Hive MetaStoreサービスに接続するためのユーザー名、非Kerberosモードで使用、デフォルトは`hadoop`。

* `hive.conf.resources`: hive-site.xml設定ファイルパス、Hive Metastoreサービスに接続するための設定を設定ファイルから読み込む必要がある場合に使用。

### 認証方式

#### Simple認証

* `simple`: 非Kerberosモード、Hive Metastoreサービスに直接接続。

#### Kerberos認証

Hive Metastoreサービスに接続するためにKerberos認証を使用するには、以下のパラメータを設定します：

* `hive.metastore.authentication.type`: `kerberos`に設定

* `hive.metastore.service.principal`: Hive MetaStoreサービスのKerberosプリンシパル

* `hive.metastore.client.principal`: DorisがHive MetaStoreサービスに接続するために使用するKerberosプリンシパル

* `hive.metastore.client.keytab`: Kerberosキータブファイルパス

```sql
'hive.metastore.authentication.type' = 'kerberos',
'hive.metastore.service.principal' = 'hive/_HOST@EXAMPLE.COM',
'hive.metastore.client.principal' = 'hive/doris.cluster@EXAMPLE.COM',
'hive.metastore.client.keytab' = '/etc/security/keytabs/hive.keytab'
```
Kerberos認証が有効なHive MetaStoreサービスを使用する場合は、同じkeytabファイルがすべてのFEノードに存在すること、Dorisプロセスを実行するユーザーがkeytabファイルに対する読み取り権限を持っていること、およびkrb5設定ファイルが適切に設定されていることを確認してください。

一般的なKerberos設定の問題とベストプラクティスについては、[Kerberos](../best-practices/kerberos.md)を参照してください。

### 設定ファイルパラメータ

#### `hive.conf.resources`

設定ファイルを通じてHive Metastoreサービスへの接続設定を読み取る必要がある場合は、`hive.conf.resources`パラメータを設定してconfファイルパスを設定できます。

> 注意：`hive.conf.resources`パラメータは相対パスのみをサポートしており、絶対パスは使用しないでください。デフォルトパスは`${DORIS_HOME}/plugins/hadoop_conf/`ディレクトリ下にあります。fe.confでhadoop_config_dirを変更することで、他のディレクトリを指定できます。

例：`'hive.conf.resources' = 'hms-1/hive-site.xml'`

## Catalogタイプ固有のデータ

以下のパラメータは、共通パラメータに加えて、各Catalogタイプに固有のものです。

### Hive カタログ

| パラメータ名        | 旧名称      | 必須     | デフォルト | 説明                                                                 |
| ------------------- | ----------- | -------- | ------- | -------------------------------------------------------------------- |
| type                |             | Yes      | None    | Catalogタイプ、Hive Catalogの場合はhmsに固定                         |
| hive.metastore.type |             | No       | 'hms'   | メタデータCatalogタイプ、Hive Metastoreの場合はhmsに固定、HiveMetaStoreを使用する場合はhmsである必要があります |

#### 例

1. 認証なしのHive Metastoreをメタデータサービスとして使用し、S3ストレージサービスを使用してHive Catalogを作成する。

   ```sql
   CREATE CATALOG hive_hms_s3_test_catalog PROPERTIES (
       'type' = 'hms',
       'hive.metastore.uris' = 'thrift://127.0.0.1:9383',
       's3.access_key' = 'S3_ACCESS_KEY',
       's3.secret_key' = 'S3_SECRET_KEY',
       's3.region' = 's3.ap-east-1.amazonaws.com'
   );
   ```
2. Kerberos認証が有効になったHive Metastoreをメタデータサービスとして使用し、S3ストレージサービスを使ったHive Catalogを作成します。

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
### Iceberg カタログ

| パラメータ名       | 旧称 | Required | Default | デスクリプション                                                          |
| -------------------- | ----------- | -------- | ------- | -------------------------------------------------------------------- |
| type                 |             | Yes      | None    | カタログタイプ、Icebergの場合はicebergで固定                          |
| iceberg.catalog.type |             | No       | None    | メタデータカタログタイプ、Hive Metastoreの場合はhmsで固定、HiveMetaStore使用時はhmsである必要があります |
| warehouse            |             | No       | None    | Icebergウェアハウスパス                                               |

#### Examples

1. Hive Metastoreをメタデータサービス、S3をストレージサービスとして使用したIceberg Catalogを作成する。

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
2. マルチKerberos環境において、S3ストレージサービスを使用し、Kerberos認証が有効化されたHive Metastoreをメタデータサービスとして使用するIceberg Catalogを作成する。

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
### Paimon カタログ

| パラメータ名      | 旧称 | Required | Default    | デスクリプション                                                         |
| ------------------- | ----------- | -------- | ---------- | ------------------------------------------------------------------- |
| type                |             | Yes      | None       | カタログタイプ。Paimon用にpaimonに固定                                |
| paimon.catalog.type |             | No       | filesystem | HiveMetaStoreを使用する場合はhmsである必要があります。デフォルトはfilesystemでメタデータをファイルシステムに保存します |
| warehouse           |             | Yes      | None       | Paimonウェアハウスパス                                              |

#### Examples

1. Hive Metastoreをメタデータサービスとして使用し、S3ストレージサービスを使用するPaimon Catalogを作成します。

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
2. マルチKerberos環境において、S3ストレージサービスを使用し、Kerberos認証を有効にしたHive Metastoreをメタデータサービスとして使用するPaimon Catalogを作成します。

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
## HMS Access Port要件

DorisがHMSにアクセスするには、少なくとも以下のポートを開放する必要があります：

| Service        | Port Purpose          | Default Port | Protocol |
|----------------|-----------------------|--------------|----------|
| Hive Metastore | Thrift (metadata access) | 9083         | TCP      |

注意事項：
- ポートは`hive-site.xml`でカスタマイズ可能です。常に実際の設定に従ってください。
- Kerberos認証が有効な場合、DorisからKerberos KDCへのネットワーク接続性を確保してください。KDCは、KDC設定でカスタマイズされていない限り、デフォルトでTCPポート88をリッスンします。

## よくある質問（FAQ）

- Q1: hive-site.xmlは必須ですか？

    いいえ、設定を読み取る必要がある場合にのみ使用されます。

- Q2: keytabファイルは全ノードに存在する必要がありますか？

    はい、すべてのFEノードが指定されたパスにアクセスできる必要があります。

- Q3: ライトバック機能を使用する際、つまりDorisでHive/Icebergデータベース/Tableを作成する際に注意すべき点は何ですか？

    Table作成にはストレージ側でのメタデータ操作、つまりストレージシステムへのアクセスが含まれるため、Hive MetaStoreサービスのサーバー側でS3、OSSなどのストレージサービスへのアクセスパラメータといった対応するストレージパラメータを設定する必要があります。オブジェクトストレージを基盤となるストレージシステムとして使用する場合、書き込み先のバケットが設定されたRegionと一致することを確認してください。
