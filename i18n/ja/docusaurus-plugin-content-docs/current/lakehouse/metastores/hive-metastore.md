---
{
    "title": "Hive Metastore",
    "language": "ja",
    "description": "CREATE CATALOG 文で Hive Metastore サービスに接続してアクセスする際に使用できるすべてのパラメータを説明します。"
}
---

このドキュメントでは、`CREATE CATALOG` 文で Hive Metastore サービスに接続してアクセスする際に使用できるすべてのパラメータを説明します。

## サポートされる Catalog タイプ

| Catalog タイプ | タイプ識別子 (type) | 説明 |
| ------------ | ---------------------- | -------------------------------- |
| Hive | hms | Hive Metastore に接続するための Catalog |
| Iceberg | iceberg | Iceberg テーブル形式の Catalog |
| Paimon | paimon | Apache Paimon テーブル形式の Catalog |

## 共通パラメータの概要

以下のパラメータは、各 Catalog タイプに共通です。

| パラメータ名 | 旧名称 | 必須 | デフォルト | 説明 |
| ---------------------------------- | --------------------------------- | -------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| hive.metastore.uris |  | はい | なし | Hive Metastore の URI アドレスです。複数の URI をカンマで区切って指定できます。例: 'hive.metastore.uris' = 'thrift://127.0.0.1:9083','hive.metastore.uris' = 'thrift://127.0.0.1:9083,thrift://127.0.0.1:9084' |
| hive.metastore.authentication.type | hadoop.security.authentication | いいえ | simple | Metastore の認証方式です。simple (デフォルト) または kerberos を指定できます。バージョン 3.0 以前では、認証方式は hadoop.security.authentication プロパティによって決まりました。バージョン 3.1 以降では、Hive Metastore の認証方式を個別に指定できます。例: 'hive.metastore.authentication.type' = 'kerberos' |
| hive.metastore.service.principal | hive.metastore.kerberos.principal | いいえ | 空 | Hive サーバーのプリンシパルです。_HOST プレースホルダーを使用できます。例: 'hive.metastore.service.principal' = 'hive/_HOST@EXAMPLE.COM' |
| hive.metastore.client.principal | hadoop.kerberos.principal | いいえ | 空 | Doris が Hive Metastore サービスへの接続に使用する Kerberos プリンシパルです。 |
| hive.metastore.client.keytab | hadoop.kerberos.keytab | いいえ | 空 | Kerberos keytab ファイルのパスです。 |
| hive.metastore.username | hadoop.username | いいえ | hadoop | Hive Metastore のユーザー名です。Kerberos を使用しないモードで使用します。 |
| hive.conf.resources |  | いいえ | 空 | hive-site.xml 設定ファイルのパスです。相対パスを使用します。 |
| hive.metastore.client.socket.timeout |  | いいえ | FE 設定パラメータ `hive_metastore_client_timeout_second` の値を使用します。この FE 設定のデフォルトは 10 秒です。 | このパラメータはバージョン 4.0.3 以降でサポートされます。Hive Metastore Client 接続を介したメタデータへのアクセスのタイムアウトです。メタデータが大きい場合 (パーティションが多い場合など) は、この値を増やせます。 |

> 注:
>
> 3.1.0 より前のバージョンでは、旧名称を使用してください。

### 必須パラメータ

* `hive.metastore.uris`: Hive Metastore の URI アドレスを指定する必要があります。

### オプションパラメータ

* `hive.metastore.authentication.type`: 認証方式です。デフォルトは `simple` で、`kerberos` も指定できます。

* `hive.metastore.service.principal`: Hive Metastore サービスの Kerberos プリンシパルです。Kerberos 認証を使用する場合は指定する必要があります。

* `hive.metastore.client.principal`: Doris が Hive Metastore サービスへの接続に使用する Kerberos プリンシパルです。Kerberos 認証を使用する場合は指定する必要があります。

* `hive.metastore.client.keytab`: Kerberos keytab ファイルのパスです。Kerberos 認証を使用する場合は指定する必要があります。

* `hive.metastore.username`: Hive Metastore サービスに接続する際のユーザー名です。Kerberos を使用しないモードで使用し、デフォルトは `hadoop` です。

* `hive.conf.resources`: hive-site.xml 設定ファイルのパスです。Hive Metastore サービスへの接続設定を設定ファイルから読み込む必要がある場合に使用します。

### 認証方式

#### Simple 認証

* `simple`: Kerberos を使用せずに Hive Metastore サービスへ直接接続します。

#### Kerberos 認証

Kerberos 認証を使用して Hive Metastore サービスに接続するには、以下のパラメータを設定します。

* `hive.metastore.authentication.type`: `kerberos` に設定します。

* `hive.metastore.service.principal`: Hive Metastore サービスの Kerberos プリンシパル

* `hive.metastore.client.principal`: Doris が Hive Metastore サービスへの接続に使用する Kerberos プリンシパル

* `hive.metastore.client.keytab`: Kerberos keytab ファイルのパス

```sql
'hive.metastore.authentication.type' = 'kerberos',
'hive.metastore.service.principal' = 'hive/_HOST@EXAMPLE.COM',
'hive.metastore.client.principal' = 'hive/doris.cluster@EXAMPLE.COM',
'hive.metastore.client.keytab' = '/etc/security/keytabs/hive.keytab'
```

Kerberos 認証が有効な Hive Metastore サービスを使用する場合は、すべての FE ノードに同じ keytab ファイルを配置し、Doris プロセスの実行ユーザーにそのファイルの読み取り権限を付与し、krb5 設定ファイルを正しく設定してください。

Kerberos 設定でよくある問題とベストプラクティスについては、[Kerberos](../best-practices/kerberos.md) を参照してください。

### 設定ファイルのパラメータ

#### `hive.conf.resources`

Hive Metastore サービスへの接続設定を設定ファイルから読み込む必要がある場合は、`hive.conf.resources` パラメータで設定ファイルのパスを指定できます。

> 注: `hive.conf.resources` パラメータでは相対パスのみを使用できます。絶対パスは使用しないでください。デフォルトの配置先は `${DORIS_HOME}/plugins/hadoop_conf/` ディレクトリです。fe.conf の hadoop_config_dir を変更すると、別のディレクトリを指定できます。

例: `'hive.conf.resources' = 'hms-1/hive-site.xml'`

## Catalog タイプ固有の設定

以下は、共通パラメータに加えて各 Catalog タイプで使用する固有のパラメータです。

### Hive Catalog

| パラメータ名 | 旧名称 | 必須 | デフォルト | 説明 |
| ------------------- | ----------- | -------- | ------- | -------------------------------------------------------------------- |
| type |  | はい | なし | Catalog タイプです。Hive Catalog では hms 固定です。 |
| hive.metastore.type |  | いいえ | 'hms' | メタデータ Catalog のタイプです。Hive Metastore を使用する場合は hms を指定する必要があります。 |

#### 例

1. 認証なしの Hive Metastore をメタデータサービスとし、S3 をストレージサービスとして使用する Hive Catalog を作成します。

   ```sql
   CREATE CATALOG hive_hms_s3_test_catalog PROPERTIES (
       'type' = 'hms',
       'hive.metastore.uris' = 'thrift://127.0.0.1:9383',
       's3.access_key' = 'S3_ACCESS_KEY',
       's3.secret_key' = 'S3_SECRET_KEY',
       's3.region' = 's3.ap-east-1.amazonaws.com'
   );
   ```

2. Kerberos 認証が有効な Hive Metastore をメタデータサービスとし、S3 をストレージサービスとして使用する Hive Catalog を作成します。

   ```sql
    CREATE CATALOG hive_hms_on_oss_kerberos_new_catalog PROPERTIES (
       'type' = 'hms',
       'hive.metastore.uris' = 'thrift://127.0.0.1:9583',
       'hive.metastore.client.principal'='hive/presto-master.docker.cluster@LABS.TERADATA.COM',
       'hive.metastore.client.keytab' = '/mnt/keytabs/hive-presto-master.keytab',
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

| パラメータ名 | 旧名称 | 必須 | デフォルト | 説明 |
| -------------------- | ----------- | -------- | ------- | -------------------------------------------------------------------- |
| type |  | はい | なし | Catalog タイプです。Iceberg では iceberg 固定です。 |
| iceberg.catalog.type |  | いいえ | なし | メタデータ Catalog のタイプです。Hive Metastore を使用する場合は hms を指定する必要があります。 |
| warehouse |  | いいえ | なし | Iceberg の warehouse パスです。 |

#### 例

1. Hive Metastore をメタデータサービスとし、S3 をストレージサービスとして使用する Iceberg Catalog を作成します。

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

2. 複数の Kerberos 環境で、Kerberos 認証が有効な Hive Metastore をメタデータサービスとし、S3 をストレージサービスとして使用する Iceberg Catalog を作成します。

    ```sql
    CREATE CATALOG IF NOT EXISTS iceberg_hms_on_oss_kerberos_new_catalog PROPERTIES (
        'type' = 'iceberg',
        'iceberg.catalog.type' = 'hms',
        'hive.metastore.uris' = 'thrift://127.0.0.1:9583',
        'warehouse' = 'oss://doris/iceberg_warehouse/',
        'hive.metastore.client.principal'='hive/presto-master.docker.cluster@LABS.TERADATA.COM',
        'hive.metastore.client.keytab' = '/mnt/keytabs/hive-presto-master.keytab',
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

| パラメータ名 | 旧名称 | 必須 | デフォルト | 説明 |
| ------------------- | ----------- | -------- | ---------- | ------------------------------------------------------------------- |
| type |  | はい | なし | Catalog タイプです。Paimon では paimon 固定です。 |
| paimon.catalog.type |  | いいえ | filesystem | Hive Metastore を使用する場合は hms を指定する必要があります。デフォルトは filesystem で、メタデータをファイルシステムに保存します。 |
| warehouse |  | はい | なし | Paimon の warehouse パスです。 |

#### 例

1. Hive Metastore をメタデータサービスとし、S3 をストレージサービスとして使用する Paimon Catalog を作成します。

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

2. 複数の Kerberos 環境で、Kerberos 認証が有効な Hive Metastore をメタデータサービスとし、S3 をストレージサービスとして使用する Paimon Catalog を作成します。

    ```sql
     CREATE CATALOG IF NOT EXISTS paimon_hms_on_oss_kerberos_new_catalog PROPERTIES (
        'type' = 'paimon',
        'paimon.catalog.type' = 'hms',
        'hive.metastore.uris' = 'thrift://127.0.0.1:9583',
        'warehouse' = 's3://doris/iceberg_warehouse/',
        'hive.metastore.client.principal'='hive/presto-master.docker.cluster@LABS.TERADATA.COM',
        'hive.metastore.client.keytab' = '/mnt/keytabs/hive-presto-master.keytab',
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
## HMS へのアクセスに必要なポート

Doris から HMS にアクセスするには、少なくとも以下のポートを開放する必要があります。

| サービス | ポートの用途 | デフォルトポート | プロトコル |
|----------------|-----------------------|--------------|----------|
| Hive Metastore | Thrift (メタデータへのアクセス) | 9083 | TCP |

注:
- ポートは `hive-site.xml` で変更できます。実際の設定に従ってください。
- Kerberos 認証が有効な場合は、Doris から Kerberos KDC にネットワーク接続できることを確認してください。KDC の設定で変更していなければ、KDC はデフォルトで TCP ポート 88 を使用します。

## よくある質問 (FAQ)

- Q1: hive-site.xml は必須ですか？

    いいえ。設定を hive-site.xml から読み込む必要がある場合にのみ使用します。

- Q2: keytab ファイルはすべてのノードに必要ですか？

    はい。すべての FE ノードから指定されたパスにアクセスできる必要があります。

- Q3: Doris で Hive/Iceberg のデータベースやテーブルを作成するなど、書き戻し機能を使用する際の注意点は何ですか？

    テーブルの作成にはストレージ側のメタデータ操作、つまりストレージシステムへのアクセスが伴います。そのため、Hive Metastore サービスのサーバー側で、S3 や OSS などのストレージサービスへのアクセスパラメータを設定する必要があります。基盤となるストレージにオブジェクトストレージを使用する場合は、書き込み先のバケットが設定済みの Region と一致していることを確認してください。
