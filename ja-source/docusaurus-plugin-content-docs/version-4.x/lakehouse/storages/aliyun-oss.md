---
{
  "title": "Aliyun OSS",
  "language": "ja",
  "description": "このドキュメントは、以下のシナリオに適用されるAlibaba Cloud OSSにアクセスするために必要なパラメータについて説明します："
}
---
この文書では、Alibaba Cloud OSSにアクセスするために必要なパラメータについて説明します。これらは以下のシナリオで適用されます：

- Catalogプロパティ
- Table Valued Functionプロパティ
- Broker Loadプロパティ
- Exportプロパティ
- Outfileプロパティ

## OSS

DorisはS3互換プロトコルを通じてS3 Clientを使用してAlibaba Cloud OSSにアクセスします。

### パラメータ概要

| プロパティ名                  | 従来名                       | 説明                                                         | デフォルト値  |
| ----------------------------- | ---------------------------- | ------------------------------------------------------------ | ------------- |
| oss.endpoint                  | s3.endpoint                  | OSSエンドポイント。Alibaba Cloud OSSのアクセスエンドポイントを指定します。OSSとOSS HDFSは異なるエンドポイントを持つことに注意してください。 | None          |
| oss.access_key                | s3.access_key                | 認証用のOSS Access Key                                       | None          |
| oss.secret_key                | s3.secret_key                | OSS Secret Key。Access Keyと組み合わせて使用されます         | None          |
| oss.region                    | s3.region                    | OSSリージョン。Alibaba Cloud OSSのリージョンを指定します     | None          |
| oss.use_path_style            | s3.use_path_style            | パス形式のアクセスを使用するかどうか。MinIOやその他の非AWS S3サービスとの互換性のためtrueに設定することが推奨されます | FALSE         |
| oss.connection.maximum        | s3.connection.maximum        | 最大接続数。OSSサービスとの間に確立される接続の最大数を指定します | 50            |
| oss.connection.request.timeout| s3.connection.request.timeout| リクエストタイムアウト（ミリ秒）。OSSサービスへの接続時のリクエストタイムアウトを指定します | 3000          |
| oss.connection.timeout        | s3.connection.timeout        | 接続タイムアウト（ミリ秒）。OSSサービスとの接続確立時のタイムアウトを指定します | 1000          |

> バージョン3.1以前では従来名を使用してください

## 設定例

```properties
"oss.access_key" = "your-access-key",
"oss.secret_key" = "your-secret-key",
"oss.endpoint" = "oss-cn-beijing.aliyuncs.com",
"oss.region" = "cn-beijing"
```
バージョン3.1より前の場合:

```
"s3.access_key" = "your-access-key",
"s3.secret_key" = "your-secret-key",
"s3.endpoint" = "oss-cn-beijing.aliyuncs.com",
"s3.region" = "cn-beijing"
```
### 使用推奨事項

* Alibaba Cloud OSSとの一貫性と明確性を確保するため、設定パラメータには`oss.`プレフィックスを使用することを推奨します。
* バージョン3.1より前では、従来の名前である`s3.`をプレフィックスとして使用してください。
* `oss.region`を設定することでアクセス精度とパフォーマンスが向上するため、設定を推奨します。
* コネクションプールパラメータは、同時接続要件に応じて調整し、接続ブロッキングを回避してください。

## OSS-HDFS

OSS-HDFSサービス（JindoFSサービス）は、Alibaba Cloudのネイティブデータレイクストレージ機能です。統一されたメタデータ管理機能に基づいており、HDFSファイルシステムインターフェースと互換性があり、ビッグデータとAI分野のデータレイクコンピューティングシナリオに対応します。

OSS-HDFSに保存されたデータへのアクセスは、OSSサービスに直接アクセスするのとは若干異なります。詳細については、このドキュメントを参照してください。

### パラメータ概要

| プロパティ名                      | 従来の名前      | 説明                                                         | デフォルト値  | 必須     |
| ------------------------------ |----------------| ----------------------------------------------------------- | ------------- | -------- |
| oss.hdfs.endpoint              | oss.endpoint   | Alibaba Cloud OSS-HDFSサービスエンドポイント、例：`cn-hangzhou.oss-dls.aliyuncs.com`。 | なし          | はい      |
| oss.hdfs.access_key            | oss.access_key | 認証用のOSS Access Key                                        | なし          | はい      |
| oss.hdfs.secret_key            | oss.secret_key | OSS Secret Key、Access Keyと組み合わせて使用                  | なし          | はい      |
| oss.hdfs.region                | oss.region     | OSSバケットが配置されているリージョンID、例：`cn-beijing`。      | なし          | はい      |
| oss.hdfs.fs.defaultFS          |                | バージョン3.1でサポート。OSSのファイルシステムアクセスパスを指定、例：`oss://my-bucket/`。 | なし          | いいえ    |
| oss.hdfs.hadoop.config.resources |                | バージョン3.1でサポート。OSSファイルシステム設定を含むパスを指定。相対パスが必要。デフォルトディレクトリは（FE/BE）デプロイディレクトリ下の`/plugins/hadoop_conf/`（fe.conf/be.confのhadoop_config_dirを変更することで変更可能）。すべてのFEおよびBEノードで同じ相対パスを設定する必要があります。例：`hadoop/conf/core-site.xml,hadoop/conf/hdfs-site.xml`。 | なし          | いいえ    |
| fs.oss-hdfs.support              |oss.hdfs.enabled  | バージョン3.1でサポート。OSS-HDFS機能の有効化を明示的に宣言。trueに設定する必要があります | なし          | いいえ    |

> バージョン3.1より前では、従来の名前を使用してください。

### エンドポイント設定

`oss.hdfs.endpoint`：OSS-HDFSサービスエンドポイントの指定に使用されます。

エンドポイントはAlibaba Cloud OSSにアクセスするためのエントリアドレスで、`<region>.oss-dls.aliyuncs.com`の形式、例：`cn-hangzhou.oss-dls.aliyuncs.com`。

エンドポイントがAlibaba Cloud OSSエンドポイント形式に準拠していることを確保するため、厳格な形式検証を実行しています。

後方互換性のため、エンドポイント設定では https:// または http:// プレフィックスの含有が許可されています。システムは形式検証中にプロトコル部分を自動的に解析し、無視します。

従来の名前を使用する場合、システムは`endpoint`に`oss-dls`が含まれているかどうかに基づいてOSS-HDFSサービスかどうかを判断します。

### 設定ファイル

> バージョン3.1でサポート

OSS-HDFSは`oss.hdfs.hadoop.config.resources`パラメータを通じてHDFS関連設定ファイルディレクトリの指定をサポートしています。

設定ファイルディレクトリには`hdfs-site.xml`と`core-site.xml`ファイルが含まれている必要があります。デフォルトディレクトリは（FE/BE）デプロイディレクトリ下の`/plugins/hadoop_conf/`です。すべてのFEおよびBEノードで同じ相対パスを設定する必要があります。

設定ファイルにこのドキュメントで前述したパラメータが含まれている場合、ユーザーが明示的に設定したパラメータが優先されます。設定ファイルは複数のファイルを指定でき、カンマで区切って指定します。例：`hadoop/conf/core-site.xml,hadoop/conf/hdfs-site.xml`。

### 設定例

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
