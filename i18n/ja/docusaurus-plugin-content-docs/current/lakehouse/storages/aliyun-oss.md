---
{
    "title": "Aliyun OSS",
    "language": "ja",
    "description": "このドキュメントでは、Alibaba Cloud OSS にアクセスするために必要なパラメータについて説明します。これらのパラメータは、次のシナリオに適用されます。"
}
---

このドキュメントでは、Alibaba Cloud OSS にアクセスするために必要なパラメータについて説明します。これらのパラメータは、次のシナリオに適用されます。

- Catalog のプロパティ
- Table Valued Function のプロパティ
- Broker Load のプロパティ
- Export のプロパティ
- Outfile のプロパティ

## OSS アクセスを設定するタイミング {#when-to-configure-oss-access}

これらのプロパティは、OSS 内のファイルにアクセスするためのものです。ファイルを読み書きする操作に設定してください。

| シナリオ | アクセス設定の場所 | 例 |
| --- | --- | --- |
| CSV、Parquet、ORC ファイルを直接クエリする | `S3(...)` テーブル値関数内 | 以下のクエリ例 |
| OSS ファイルを既存の Doris テーブルにインポートする | `INSERT INTO ... SELECT` で使用する `S3(...)` 内、または Broker Load の `WITH S3` 句内 | [OSS データのインポート](../../data-operate/import/data-source/aliyun-oss.md) |
| データが OSS に保存されている Hive テーブルをクエリする | `CREATE CATALOG` 実行時の Catalog プロパティ内 | [Hive Catalog](../catalogs/hive-catalog) |
| クエリ結果を OSS にエクスポートする | エクスポートコマンドのプロパティ内 | [SELECT INTO OUTFILE](../../data-operate/export/outfile.md) |

たとえば、ヘッダー行のない UTF-8 ファイル `users.csv` を OSS バケットにアップロードします。

```text
1,Alice
2,Bob
```

Doris の FE ノードと BE ノードが OSS エンドポイントにアクセスでき、指定した認証情報でオブジェクトを読み取れることを確認してください。以下のバケット名、オブジェクトのパス、認証情報を置き換えてください。このクエリはファイルを直接読み取るため、Doris テーブルを作成する必要はありません。S3 互換の `s3.*` プロパティ名を使用します。

```sql
SELECT id, name
FROM S3(
    "uri" = "s3://your-bucket/users.csv",
    "format" = "csv",
    "s3.endpoint" = "oss-cn-beijing.aliyuncs.com",
    "s3.region" = "cn-beijing",
    "s3.access_key" = "<your-access-key>",
    "s3.secret_key" = "<your-secret-key>",
    "column_separator" = ",",
    "csv_schema" = "id:int;name:string"
)
ORDER BY id;
```

上記のファイルに対する想定結果は次のとおりです。

```text
+------+-------+
| id   | name  |
+------+-------+
|    1 | Alice |
|    2 | Bob   |
+------+-------+
```

データを Doris に保存するには、対象のテーブルを作成し、上記の OSS データインポートガイドに従って `INSERT INTO ... SELECT` を使用してください。その他の操作では、対応する Catalog、データロード、またはエクスポートのステートメントに接続プロパティを設定してください。

## OSS {#oss}

Doris は S3 Client を使用し、S3 互換プロトコルを通じて Alibaba Cloud OSS にアクセスします。

### パラメータ一覧 {#parameter-overview}

| プロパティ名 | 旧名称 | 説明 | デフォルト値 |
| --- | --- | --- | --- |
| oss.endpoint | s3.endpoint | OSS エンドポイント。Alibaba Cloud OSS へのアクセス先を指定します。OSS と OSS HDFS ではエンドポイントが異なることに注意してください。 | なし |
| oss.access_key | s3.access_key | 認証に使用する OSS Access Key | なし |
| oss.secret_key | s3.secret_key | Access Key と組み合わせて使用する OSS Secret Key | なし |
| oss.region | s3.region | Alibaba Cloud OSS のリージョンを指定する OSS region | なし |
| oss.use_path_style | s3.use_path_style | パス形式のアクセスを使用するかどうか。MinIO などの AWS 以外の S3 サービスとの互換性を確保するには、true に設定することを推奨します。 | FALSE |
| oss.connection.maximum | s3.connection.maximum | OSS サービスとの間に確立する接続の最大数 | 50 |
| oss.connection.request.timeout | s3.connection.request.timeout | OSS サービスへの接続時のリクエストタイムアウト（ミリ秒） | 3000 |
| oss.connection.timeout | s3.connection.timeout | OSS サービスとの接続を確立する際のタイムアウト（ミリ秒） | 1000 |

> バージョン 3.1 より前では、旧名称を使用してください。

## 設定例 {#example-configuration}

```properties
"oss.access_key" = "your-access-key",
"oss.secret_key" = "your-secret-key",
"oss.endpoint" = "oss-cn-beijing.aliyuncs.com",
"oss.region" = "cn-beijing"
```

バージョン 3.1 より前の場合：

```
"s3.access_key" = "your-access-key",
"s3.secret_key" = "your-secret-key",
"s3.endpoint" = "oss-cn-beijing.aliyuncs.com",
"s3.region" = "cn-beijing"
```

### 使用上の推奨事項 {#usage-recommendations}

* Alibaba Cloud OSS との対応を明確にし、設定の一貫性を保つため、設定パラメータには `oss.` プレフィックスを使用することを推奨します。
* バージョン 3.1 より前では、旧名称のプレフィックス `s3.` を使用してください。
* `oss.region` を設定するとアクセスの正確性とパフォーマンスが向上するため、設定を推奨します。
* 接続が滞らないよう、同時実行の要件に応じて接続プールのパラメータを調整できます。

## OSS-HDFS {#oss-hdfs}

OSS-HDFS サービス（JindoFS サービス）は、Alibaba Cloud のクラウドネイティブなデータレイクストレージ機能です。統一されたメタデータ管理機能を基盤とし、HDFS ファイルシステムのインターフェースと互換性があり、ビッグデータや AI 分野のデータレイクコンピューティングに対応します。

OSS-HDFS に保存されたデータへのアクセスは、OSS サービスに直接アクセスする場合と少し異なります。詳細はこのドキュメントを参照してください。

### パラメータ一覧 {#parameter-overview-1}

| プロパティ名 | 旧名称 | 説明 | デフォルト値 | 必須 |
| --- | --- | --- | --- | --- |
| oss.hdfs.endpoint | oss.endpoint | Alibaba Cloud OSS-HDFS サービスのエンドポイント。例：`cn-hangzhou.oss-dls.aliyuncs.com`。 | なし | はい |
| oss.hdfs.access_key | oss.access_key | 認証に使用する OSS Access Key | なし | はい |
| oss.hdfs.secret_key | oss.secret_key | Access Key と組み合わせて使用する OSS Secret Key | なし | はい |
| oss.hdfs.region | oss.region | OSS バケットがあるリージョンの ID。例：`cn-beijing`。 | なし | はい |
| oss.hdfs.fs.defaultFS | | バージョン 3.1 でサポート。OSS のファイルシステムへのアクセスパスを指定します。例：`oss://my-bucket/`。 | なし | いいえ |
| oss.hdfs.hadoop.config.resources | | バージョン 3.1 でサポート。OSS ファイルシステムの設定を含むパスを指定します。相対パスが必要です。デフォルトのディレクトリは、（FE/BE の）デプロイディレクトリ配下の `/plugins/hadoop_conf/` です（fe.conf/be.conf の hadoop_config_dir を変更すると変更できます）。すべての FE ノードと BE ノードで同じ相対パスを設定する必要があります。例：`hadoop/conf/core-site.xml,hadoop/conf/hdfs-site.xml`。 | なし | いいえ |
| fs.oss-hdfs.support | oss.hdfs.enabled | バージョン 3.1 でサポート。OSS-HDFS 機能を有効にすることを明示的に宣言します。true に設定する必要があります。 | なし | いいえ |

> バージョン 3.1 より前では、旧名称を使用してください。

### エンドポイントの設定 {#endpoint-configuration}

`oss.hdfs.endpoint`：OSS-HDFS サービスのエンドポイントを指定します。

エンドポイントは Alibaba Cloud OSS にアクセスするための入口アドレスで、形式は `<region>.oss-dls.aliyuncs.com` です。例：`cn-hangzhou.oss-dls.aliyuncs.com`。

エンドポイントが Alibaba Cloud OSS のエンドポイント形式に適合するよう、厳密な形式検証を行います。

後方互換性のため、エンドポイントの設定には https:// または http:// プレフィックスを含めることができます。システムは形式検証時にプロトコル部分を自動的に解析し、無視します。

旧名称を使用する場合、システムは `endpoint` に `oss-dls` が含まれているかどうかで OSS-HDFS サービスかどうかを判定します。

バージョン 4.1.5 以降、`oss.hdfs.hadoop.config.resources` の XML パスには、親ディレクトリを表す `..` パス要素を含めることはできません。区切り文字がスラッシュとバックスラッシュのいずれの場合も検査されます。通常のファイルパスを使用してください。

### 設定ファイル {#configuration-files}

> バージョン 3.1 でサポート

OSS-HDFS では、`oss.hdfs.hadoop.config.resources` パラメータを使用して、HDFS 関連の設定ファイルがあるディレクトリを指定できます。

設定ファイルのディレクトリには、`hdfs-site.xml` と `core-site.xml` を含める必要があります。デフォルトのディレクトリは、（FE/BE の）デプロイディレクトリ配下の `/plugins/hadoop_conf/` です。すべての FE ノードと BE ノードで同じ相対パスを設定する必要があります。

設定ファイルにこのドキュメントで前述したパラメータが含まれる場合は、ユーザーが明示的に設定したパラメータが優先されます。設定ファイルは複数指定でき、`hadoop/conf/core-site.xml,hadoop/conf/hdfs-site.xml` のようにカンマで区切ります。

### 設定例 {#example-configuration-1}

```properties
"fs.oss-hdfs.support" = "true",
"oss.hdfs.access_key" = "your-access-key",
"oss.hdfs.secret_key" = "your-secret-key",
"oss.hdfs.endpoint" = "cn-hangzhou.oss-dls.aliyuncs.com",
"oss.hdfs.region" = "cn-hangzhou"
```

バージョン 3.1 より前の場合：

```
"oss.hdfs.enabled" = "true",
"oss.access_key" = "your-access-key",
"oss.secret_key" = "your-secret-key",
"oss.endpoint" = "cn-hangzhou.oss-dls.aliyuncs.com",
"oss.region" = "cn-hangzhou"
```
