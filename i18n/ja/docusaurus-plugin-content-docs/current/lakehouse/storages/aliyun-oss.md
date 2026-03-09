---
{
  "title": "Aliyun OSS",
  "language": "ja",
  "description": "この文書では、Alibaba Cloud OSSにアクセスするために必要なパラメータについて説明します。これらは以下のシナリオに適用されます："
}
---
このドキュメントでは、Alibaba Cloud OSSにアクセスするために必要なパラメータについて説明します。これらのパラメータは以下のシナリオに適用されます：

- Catalogプロパティ
- Table Valued Functionプロパティ
- Broker Loadプロパティ
- Exportプロパティ
- Outfileプロパティ

## OSS

DorisはS3互換プロトコルを通じてAlibaba Cloud OSSにアクセスするためにS3 Clientを使用します。

### パラメータ概要

| プロパティ名                   | 旧名称                       | 説明                                                         | デフォルト値  |
| ------------------------------ | ---------------------------- | ------------------------------------------------------------ | ------------- |
| oss.endpoint                   | s3.endpoint                  | OSSエンドポイント、Alibaba Cloud OSSのアクセスエンドポイントを指定します。OSSとOSS HDFSでは異なるエンドポイントを使用することに注意してください。 | None          |
| oss.access_key                 | s3.access_key                | 認証用のOSS Access Key                                       | None          |
| oss.secret_key                 | s3.secret_key                | OSS Secret Key、Access Keyと組み合わせて使用します          | None          |
| oss.region                     | s3.region                    | OSSリージョン、Alibaba Cloud OSSのリージョンを指定します     | None          |
| oss.use_path_style             | s3.use_path_style            | パススタイルアクセスを使用するかどうか。MinIOやその他の非AWS S3サービスとの互換性のためtrueに設定することを推奨します | FALSE         |
| oss.connection.maximum         | s3.connection.maximum        | 最大接続数、OSSサービスとの間で確立する最大接続数を指定します | 50            |
| oss.connection.request.timeout | s3.connection.request.timeout| リクエストタイムアウト（ミリ秒）、OSSサービスに接続する際のリクエストタイムアウトを指定します | 3000          |
| oss.connection.timeout         | s3.connection.timeout        | 接続タイムアウト（ミリ秒）、OSSサービスとの接続確立時のタイムアウトを指定します | 1000          |

> バージョン3.1以前では、旧名称を使用してください

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
### 利用推奨事項

* Alibaba Cloud OSS との一貫性と明確性を確保するため、設定パラメータには `oss.` プレフィックスの使用を推奨します。
* 3.1より前のバージョンでは、レガシー名である `s3.` をプレフィックスとして使用してください。
* `oss.region` の設定はアクセス精度とパフォーマンスを向上させることができるため、設定を推奨します。
* 接続プールパラメータは、接続ブロッキングを回避するため、並行性要件に応じて調整できます。

## OSS-HDFS

OSS-HDFS サービス（JindoFS サービス）は、Alibaba Cloud ネイティブのデータレイクストレージ機能です。統一されたメタデータ管理機能に基づき、HDFS ファイルシステムインターフェースと互換性があり、ビッグデータおよびAI分野のデータレイクコンピューティングシナリオに対応します。

OSS-HDFS に保存されたデータへのアクセスは、OSS サービスに直接アクセスする場合と若干異なります。詳細については、このドキュメントを参照してください。

### パラメータ概要

| プロパティ名                  | レガシー名    | 説明                                                 | デフォルト値 | 必須 |
| ------------------------------ |----------------| ----------------------------------------------------------- | ------------- | -------- |
| oss.hdfs.endpoint              | oss.endpoint   | Alibaba Cloud OSS-HDFS サービスエンドポイント（例：`cn-hangzhou.oss-dls.aliyuncs.com`） | None          | Yes      |
| oss.hdfs.access_key            | oss.access_key | 認証用の OSS Access Key                           | None          | Yes      |
| oss.hdfs.secret_key            | oss.secret_key | OSS Secret Key、Access Key と併せて使用              | None          | Yes      |
| oss.hdfs.region                | oss.region     | OSS バケットが配置されているリージョンID（例：`cn-beijing`） | None          | Yes      |
| oss.hdfs.fs.defaultFS          |                | バージョン3.1でサポート。OSS のファイルシステムアクセスパスを指定（例：`oss://my-bucket/`） | None          | No       |
| oss.hdfs.hadoop.config.resources |                | バージョン3.1でサポート。OSS ファイルシステム設定を含むパスを指定。相対パスが必要。デフォルトディレクトリは（FE/BE）デプロイメントディレクトリ下の `/plugins/hadoop_conf/`（fe.conf/be.confのhadoop_config_dirを変更することで変更可能）。すべてのFEおよびBEノードで同じ相対パスを設定する必要があります。例：`hadoop/conf/core-site.xml,hadoop/conf/hdfs-site.xml`。 | None          | No       |
| fs.oss-hdfs.support              |oss.hdfs.enabled  | バージョン3.1でサポート。OSS-HDFS 機能の有効化を明示的に宣言。trueに設定する必要があります | None          | No       |

> 3.1より前のバージョンでは、レガシー名を使用してください。

### エンドポイント設定

`oss.hdfs.endpoint`：OSS-HDFS サービスエンドポイントの指定に使用されます。

エンドポイントは Alibaba Cloud OSS にアクセスするためのエントリアドレスで、`<region>.oss-dls.aliyuncs.com` の形式（例：`cn-hangzhou.oss-dls.aliyuncs.com`）です。

エンドポイントが Alibaba Cloud OSS エンドポイント形式に準拠していることを確保するため、厳格な形式検証を実行します。

後方互換性のため、エンドポイント設定では https:// または http:// プレフィックスの含有が許可されています。システムは形式検証時にプロトコル部分を自動的に解析し、無視します。

レガシー名を使用する場合、システムは `endpoint` に `oss-dls` が含まれているかどうかに基づいて OSS-HDFS サービスかどうかを判断します。

### 設定ファイル

> バージョン3.1でサポート

OSS-HDFS は `oss.hdfs.hadoop.config.resources` パラメータを通じて HDFS 関連設定ファイルディレクトリの指定をサポートします。

設定ファイルディレクトリには `hdfs-site.xml` および `core-site.xml` ファイルが含まれている必要があります。デフォルトディレクトリは（FE/BE）デプロイメントディレクトリ下の `/plugins/hadoop_conf/` です。すべてのFEおよびBEノードで同じ相対パスを設定する必要があります。

設定ファイルに本ドキュメントで前述したパラメータが含まれている場合、ユーザが明示的に設定したパラメータが優先されます。設定ファイルは複数のファイルを指定でき、`hadoop/conf/core-site.xml,hadoop/conf/hdfs-site.xml` のようにカンマで区切ります。

### 設定例

```properties
"fs.oss-hdfs.support" = "true",
"oss.hdfs.access_key" = "your-access-key",
"oss.hdfs.secret_key" = "your-secret-key",
"oss.hdfs.endpoint" = "cn-hangzhou.oss-dls.aliyuncs.com",
"oss.hdfs.region" = "cn-hangzhou"
```
バージョン 3.1 より前の場合:

```
"oss.hdfs.enabled" = "true",
"oss.access_key" = "your-access-key",
"oss.secret_key" = "your-secret-key",
"oss.endpoint" = "cn-hangzhou.oss-dls.aliyuncs.com",
"oss.region" = "cn-hangzhou"
```
