---
{
    "title": "Aliyun OSS",
    "language": "ja",
    "description": "このドキュメントでは、Alibaba Cloud OSS にアクセスするために必要なパラメータを説明します。以下の用途に適用できます。"
}
---

このドキュメントでは、Alibaba Cloud OSS にアクセスするために必要なパラメータを説明します。以下の用途に適用できます。

- Catalog のプロパティ
- テーブル値関数のプロパティ
- Broker Load のプロパティ
- Export のプロパティ
- Outfile のプロパティ

## OSS

Doris は S3 クライアントを使用し、S3 互換プロトコル経由で Alibaba Cloud OSS にアクセスします。

### パラメータ一覧

| プロパティ名                 | 旧名称                       | 説明                                                         | デフォルト値 |
| ---------------------------- | ---------------------------- | ------------------------------------------------------------ | ------------ |
| oss.endpoint                 | s3.endpoint                  | OSS のエンドポイント。Alibaba Cloud OSS へのアクセス先を指定します。OSS と OSS-HDFS ではエンドポイントが異なる点に注意してください。 | なし         |
| oss.access_key               | s3.access_key                | 認証に使用する OSS Access Key                                 | なし         |
| oss.secret_key               | s3.secret_key                | Access Key とともに使用する OSS Secret Key                    | なし         |
| oss.region                   | s3.region                    | Alibaba Cloud OSS のリージョンを指定します。                  | なし         |
| oss.use_path_style           | s3.use_path_style            | パス形式でアクセスするかどうかを指定します。MinIO など、AWS 以外の S3 サービスとの互換性のため、true に設定することを推奨します。 | FALSE        |
| oss.connection.maximum       | s3.connection.maximum        | OSS サービスとの最大接続数を指定します。                      | 50           |
| oss.connection.request.timeout | s3.connection.request.timeout | OSS サービスへの接続時のリクエストタイムアウトをミリ秒単位で指定します。 | 3000         |
| oss.connection.timeout       | s3.connection.timeout        | OSS サービスとの接続を確立する際のタイムアウトをミリ秒単位で指定します。 | 1000         |

> バージョン 3.1 より前では旧名称を使用してください。

## 設定例

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

### 使用上の推奨事項

* Alibaba Cloud OSS の設定であることを明確にし、一貫性を保つため、パラメータには `oss.` プレフィックスを使用することを推奨します。
* バージョン 3.1 より前では、旧名称の `s3.` プレフィックスを使用してください。
* アクセスの正確性とパフォーマンスを高めるため、`oss.region` の設定を推奨します。
* 接続が滞留しないよう、同時実行数に応じて接続プールのパラメータを調整できます。

## OSS-HDFS

OSS-HDFS サービス（JindoFS サービス）は、Alibaba Cloud が提供するネイティブなデータレイクストレージ機能です。統合メタデータ管理機能を基盤とし、HDFS ファイルシステムのインターフェースに対応しているため、ビッグデータや AI 分野のデータレイク処理に利用できます。

OSS-HDFS に保存されたデータへのアクセス方法は、OSS サービスに直接アクセスする場合と少し異なります。詳細については、このドキュメントを参照してください。

### パラメータ一覧

| プロパティ名                   | 旧名称           | 説明                                                         | デフォルト値 | 必須 |
| ------------------------------ | ---------------- | ------------------------------------------------------------ | ------------ | ---- |
| oss.hdfs.endpoint              | oss.endpoint     | Alibaba Cloud OSS-HDFS サービスのエンドポイント。例：`cn-hangzhou.oss-dls.aliyuncs.com`。 | なし         | はい |
| oss.hdfs.access_key            | oss.access_key   | 認証に使用する OSS Access Key                                 | なし         | はい |
| oss.hdfs.secret_key            | oss.secret_key   | Access Key とともに使用する OSS Secret Key                    | なし         | はい |
| oss.hdfs.region                | oss.region       | OSS バケットがあるリージョンの ID。例：`cn-beijing`。          | なし         | はい |
| oss.hdfs.fs.defaultFS          |                  | バージョン 3.1 でサポートされます。OSS のファイルシステムアクセスパスを指定します。例：`oss://my-bucket/`。 | なし         | いいえ |
| oss.hdfs.hadoop.config.resources |                  | バージョン 3.1 でサポートされます。OSS ファイルシステムの設定ファイルのパスを指定します。相対パスが必要です。デフォルトのディレクトリは、FE/BE のデプロイディレクトリ配下の `/plugins/hadoop_conf/` です（fe.conf/be.conf の hadoop_config_dir を変更することで変更可能）。すべての FE ノードと BE ノードで同じ相対パスを設定する必要があります。例：`hadoop/conf/core-site.xml,hadoop/conf/hdfs-site.xml`。 | なし         | いいえ |
| fs.oss-hdfs.support            | oss.hdfs.enabled | バージョン 3.1 でサポートされます。OSS-HDFS 機能を有効にすることを明示します。true に設定する必要があります。 | なし         | いいえ |

> バージョン 3.1 より前では旧名称を使用してください。

### エンドポイントの設定

`oss.hdfs.endpoint`：OSS-HDFS サービスのエンドポイントを指定します。

エンドポイントは Alibaba Cloud OSS にアクセスするための入口となるアドレスです。形式は `<region>.oss-dls.aliyuncs.com` で、例として `cn-hangzhou.oss-dls.aliyuncs.com` を指定できます。

エンドポイントが Alibaba Cloud OSS のエンドポイント形式に従っていることを確認するため、厳密な形式検証を行います。

後方互換性のため、エンドポイントの設定には https:// または http:// のプレフィックスを含めることができます。形式検証時に、システムはプロトコル部分を自動的に解析して無視します。

旧名称を使用する場合、システムは `endpoint` に `oss-dls` が含まれるかどうかで OSS-HDFS サービスかどうかを判定します。

### 設定ファイル

> バージョン 3.1 でサポートされます。

OSS-HDFS では、`oss.hdfs.hadoop.config.resources` パラメータを使用して HDFS 関連の設定ファイルのディレクトリを指定できます。

設定ファイルのディレクトリには `hdfs-site.xml` と `core-site.xml` を含める必要があります。デフォルトのディレクトリは、FE/BE のデプロイディレクトリ配下の `/plugins/hadoop_conf/` です。すべての FE ノードと BE ノードで同じ相対パスを設定する必要があります。

設定ファイルにこのドキュメントで前述したパラメータが含まれている場合は、ユーザーが明示的に設定したパラメータが優先されます。設定ファイルは、`hadoop/conf/core-site.xml,hadoop/conf/hdfs-site.xml` のように、カンマ区切りで複数指定できます。

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
