---
{
    "title": "Aliyun OSS",
    "language": "ja",
    "description": "このドキュメントでは、Alibaba Cloud OSS にアクセスするために必要なパラメータについて説明します。これらは次の用途に適用されます。"
}
---

このドキュメントでは、Alibaba Cloud OSS にアクセスするために必要なパラメータについて説明します。これらは次の用途に適用されます。

- Catalog のプロパティ
- Table Valued Function のプロパティ
- Broker Load のプロパティ
- Export のプロパティ
- Outfile のプロパティ

## OSS {#oss}

Doris は S3 Client を使用し、S3 互換プロトコルを介して Alibaba Cloud OSS にアクセスします。

### パラメータ一覧 {#parameter-overview}

| プロパティ名                   | 旧名称                       | 説明                                                         | デフォルト値 |
| ------------------------------ | ---------------------------- | ------------------------------------------------------------ | ------------- |
| oss.endpoint                   | s3.endpoint                  | Alibaba Cloud OSS への接続先となる OSS エンドポイントを指定します。OSS と OSS-HDFS ではエンドポイントが異なる点に注意してください。 | なし          |
| oss.access_key                 | s3.access_key                | 認証に使用する OSS Access Key                               | なし          |
| oss.secret_key                 | s3.secret_key                | Access Key と組み合わせて使用する OSS Secret Key             | なし          |
| oss.region                     | s3.region                    | Alibaba Cloud OSS のリージョンを指定します。                 | なし          |
| oss.use_path_style             | s3.use_path_style            | パス形式のアクセスを使用するかどうかを指定します。MinIO など、AWS 以外の S3 サービスとの互換性のため、true に設定することを推奨します。 | FALSE         |
| oss.connection.maximum         | s3.connection.maximum        | OSS サービスとの接続の最大数を指定します。                   | 50            |
| oss.connection.request.timeout | s3.connection.request.timeout| OSS サービスへの接続時のリクエストタイムアウトをミリ秒単位で指定します。 | 3000          |
| oss.connection.timeout         | s3.connection.timeout        | OSS サービスとの接続を確立する際のタイムアウトをミリ秒単位で指定します。 | 1000          |

> バージョン 3.1 より前では旧名称を使用してください。

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

### 利用時の推奨事項 {#usage-recommendations}

* 設定パラメータには `oss.` プレフィックスを使用することを推奨します。Alibaba Cloud OSS に関する設定であることが明確になり、命名も統一できます。
* バージョン 3.1 より前では、旧名称のプレフィックス `s3.` を使用してください。
* `oss.region` を設定すると、アクセスの正確性とパフォーマンスが向上するため、設定を推奨します。
* 接続が滞らないよう、同時実行の要件に合わせて接続プールのパラメータを調整できます。

## OSS-HDFS {#oss-hdfs}

OSS-HDFS サービス（JindoFS サービス）は、Alibaba Cloud ネイティブのデータレイクストレージ機能です。統一されたメタデータ管理機能を基盤とし、HDFS ファイルシステムのインターフェースと互換性があり、ビッグデータおよび AI 分野のデータレイクでの計算処理に対応します。

OSS-HDFS に保存されたデータへのアクセス方法は、OSS サービスに直接アクセスする場合と少し異なります。詳しくは、このドキュメントを参照してください。

### パラメータ一覧 {#parameter-overview-1}

| プロパティ名                   | 旧名称         | 説明                                                        | デフォルト値 | 必須 |
| ------------------------------ |----------------| ----------------------------------------------------------- | ------------- | -------- |
| oss.hdfs.endpoint              | oss.endpoint   | Alibaba Cloud OSS-HDFS サービスのエンドポイント。例：`cn-hangzhou.oss-dls.aliyuncs.com`。 | なし          | はい     |
| oss.hdfs.access_key            | oss.access_key | 認証に使用する OSS Access Key                               | なし          | はい     |
| oss.hdfs.secret_key            | oss.secret_key | Access Key と組み合わせて使用する OSS Secret Key            | なし          | はい     |
| oss.hdfs.region                | oss.region     | OSS バケットがあるリージョンの ID。例：`cn-beijing`。        | なし          | はい     |
| oss.hdfs.fs.defaultFS          |                | バージョン 3.1 でサポート。OSS のファイルシステムへのアクセスパスを指定します。例：`oss://my-bucket/`。 | なし          | いいえ   |
| oss.hdfs.hadoop.config.resources |                | バージョン 3.1 でサポート。OSS ファイルシステムの設定を含むパスを指定します。相対パスが必要です。デフォルトのディレクトリは、(FE/BE) のデプロイディレクトリ内の `/plugins/hadoop_conf/` です（fe.conf/be.conf の hadoop_config_dir を変更すると変更できます）。すべての FE ノードと BE ノードで同じ相対パスを設定する必要があります。例：`hadoop/conf/core-site.xml,hadoop/conf/hdfs-site.xml`。 | なし          | いいえ   |
| fs.oss-hdfs.support              |oss.hdfs.enabled  | バージョン 3.1 でサポート。OSS-HDFS 機能を有効にすることを明示します。true に設定する必要があります。 | なし          | いいえ   |

> バージョン 3.1 より前では旧名称を使用してください。

### エンドポイントの設定 {#endpoint-configuration}

`oss.hdfs.endpoint`：OSS-HDFS サービスのエンドポイントを指定します。

エンドポイントは Alibaba Cloud OSS にアクセスするための接続先アドレスで、形式は `<region>.oss-dls.aliyuncs.com` です。例：`cn-hangzhou.oss-dls.aliyuncs.com`。

エンドポイントが Alibaba Cloud OSS のエンドポイント形式に準拠していることを確認するため、厳密な形式検証を行います。

下位互換性のため、エンドポイントの設定には https:// または http:// のプレフィックスを含めることができます。形式検証時には、システムがプロトコル部分を自動的に解析して無視します。

旧名称を使用する場合、システムは `endpoint` に `oss-dls` が含まれているかどうかに基づいて、OSS-HDFS サービスかどうかを判定します。

バージョン 4.1.5 以降、`oss.hdfs.hadoop.config.resources` に指定する XML のパスに、親ディレクトリを表す `..` セグメントを含めることはできません。区切り文字がスラッシュとバックスラッシュのどちらの場合もチェックされます。通常のファイルパスを使用してください。

### 設定ファイル {#configuration-files}

> バージョン 3.1 でサポート

OSS-HDFS では、`oss.hdfs.hadoop.config.resources` パラメータを使用して、HDFS 関連の設定ファイルがあるディレクトリを指定できます。

設定ファイルのディレクトリには、`hdfs-site.xml` と `core-site.xml` が必要です。デフォルトのディレクトリは、(FE/BE) のデプロイディレクトリ内の `/plugins/hadoop_conf/` です。すべての FE ノードと BE ノードで同じ相対パスを設定する必要があります。

設定ファイルに、このドキュメントで前述したパラメータが含まれている場合は、ユーザーが明示的に設定したパラメータが優先されます。設定ファイルは、`hadoop/conf/core-site.xml,hadoop/conf/hdfs-site.xml` のように、カンマで区切って複数指定できます。

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
