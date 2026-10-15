---
{
    "title": "SeaweedFS との連携",
    "language": "ja"
}
---

[SeaweedFS](https://seaweedfs.com/) は、単一の `weed` プロセスから S3 互換のオブジェクト API と Apache Iceberg REST Catalog の両方を提供する分散ストレージシステムです。Parquet データと Iceberg メタデータを単一の実行ファイルで提供し、同じ S3 認証情報のペアで認証します。

このページでは、SeaweedFS を Doris から利用する Iceberg レイクハウスにするための最小構成を示します。同じ一連の手順は、SeaweedFS リポジトリの統合テスト [`TestDorisIcebergCatalog`](https://github.com/seaweedfs/seaweedfs/tree/master/test/s3tables/catalog_doris) でも検証されています。このテストでは、SeaweedFS のミニクラスターを起動し、Doris に Iceberg カタログとして登録し、PyIceberg で行を書き込み、`apache/doris:doris-all-in-one-2.1.0` からその行を読み取ります。

## Iceberg レイクハウスで SeaweedFS を使う理由 {#why-seaweedfs-for-an-iceberg-lakehouse}

一般的なレイクハウスの構成では、次の三層を組み合わせます。

* オブジェクトストレージ（S3 またはその互換サービス）
* 独立した Iceberg カタログ（Hive Metastore、Glue、Polaris、Lakekeeper、Nessie など）
* クエリエンジン（Doris、Spark、Trino など）

SeaweedFS では、最初の二層を単一のプロセスにまとめられます。同じ `weed` 実行ファイルが、次の両方を担います。

* Parquet ファイルを保持する S3 互換オブジェクトストレージ
* テーブルのメタデータを保持する Iceberg REST Catalog

そのため、Doris は二つではなく一つのシステムに接続します。実用上の利点は次のとおりです。

* **構成要素を減らせる。** Hive Metastore や Glue、別のカタログを支える Postgres、プロビジョニングする STS ロールが不要です。
* **デプロイが簡単になる。** Doris の Iceberg REST クライアントと S3 リーダーで、単一の実行ファイル、単一の IAM 設定、共通の S3 認証情報のペアを共有します。
* **ローカル環境やオンプレミス環境でも使いやすい。** この構成にクラウド固有のサービスは必要ありません。同じ設定でノート PC、単一の VM、Kubernetes クラスター上で動作します。
* **メタデータ参照のレイテンシーを抑えられる。** カタログの状態はデータを提供する SeaweedFS filer にあるため、名前空間やテーブルの参照で別サービスとの通信が発生しません。
* **S3 上に標準形式で保存できる。** テーブルは S3 バケット内の標準的な Iceberg ディレクトリとして保存されます。任意の S3 クライアント（rclone、`aws s3`、Spark、Trino、Dremio、RisingWave）は、Doris と並行してテーブルを読み取ったり複製したりできます。

構成は次のとおりです。

```text
Doris
  |
  v
Iceberg tables
  |
  v
SeaweedFS  (S3 storage + REST catalog)
```

小規模なチームや社内プラットフォームでは、独立したメタストアサービスに依存せずにレイクハウスを構築できます。

## 1. SeaweedFS を起動する {#1-start-seaweedfs}

`weed` を [github.com/seaweedfs/seaweedfs](https://github.com/seaweedfs/seaweedfs) からビルドするか、インストールします。

アクセスキーに S3 への完全なアクセス権を付与する IAM 設定を作成します。同じキーを Iceberg REST エンドポイントの OAuth2 クライアントとしても使用します。

```json
{
  "identities": [
    {
      "name": "doris",
      "credentials": [
        {
          "accessKey": "AKIAIOSFODNN7EXAMPLE",
          "secretKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
        }
      ],
      "actions": ["Admin"]
    }
  ]
}
```

Iceberg REST エンドポイントと事前作成されるテーブル用バケットを備えた、単一プロセスのクラスターを起動します。

```bash
weed mini \
  -ip $(hostname -I | awk '{print $1}') \
  -dir /var/lib/seaweedfs \
  -s3.config /etc/seaweedfs/iam_config.json \
  -tableBucket iceberg-tables
```

`weed mini` は、master、volume、filer、S3、Iceberg REST カタログを単一のプロセスで実行します。デフォルトのポートは次のとおりです。

| コンポーネント | ポート | 変更用フラグ |
| --------- | ---- | ------------- |
| Master HTTP | 9333 | `-master.port` |
| Filer HTTP | 8888 | `-filer.port` |
| S3 | 8333 | `-s3.port` |
| Iceberg REST | 8181 | `-s3.port.iceberg` |

`-tableBucket iceberg-tables` は、起動時に S3 Tables バケットを作成します。これは Doris が書き込む Iceberg 対応のバケットです。

カタログに接続できることを確認するには、次のコマンドを実行します。

```bash
curl -s http://SEAWEED_HOST:8181/v1/config | jq .
```

## 2. Doris に Iceberg カタログを登録する {#2-register-the-iceberg-catalog-in-doris}

```sql
CREATE CATALOG seaweedfs PROPERTIES (
    "type" = "iceberg",
    "iceberg.catalog.type" = "rest",
    "uri" = "http://SEAWEED_HOST:8181",
    "warehouse" = "s3://iceberg-tables",
    "credential" = "AKIAIOSFODNN7EXAMPLE:wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
    "s3.endpoint" = "http://SEAWEED_HOST:8333",
    "s3.access_key" = "AKIAIOSFODNN7EXAMPLE",
    "s3.secret_key" = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
    "s3.region" = "us-west-2",
    "use_path_style" = "true"
);
```

補足事項：

* `credential = "<access_key>:<secret_key>"` は、Doris の Iceberg REST クライアントから OAuth2 クライアント認証情報として送信されます。SeaweedFS は、S3 エンドポイントを保護する IAM 設定と照合して認証します。
* `s3.*` プロパティは、Doris 自身の Parquet リーダーとライターが使用します。同じホストと同じキーのペアを使い、同じ `weed` プロセスに接続します。
* SeaweedFS はデフォルトでパス形式の S3 アクセスを提供するため、`use_path_style = "true"` が必要です。
* 統合テストでもこれらと同じプロパティを使用しています。標準的な記述方法は [`createDorisIcebergCatalog`](https://github.com/seaweedfs/seaweedfs/blob/master/test/s3tables/catalog_doris/doris_catalog_test.go) を参照してください。

カタログを登録する前に Doris 以外から（たとえば PyIceberg で）名前空間やテーブルを作成した場合は、メタデータキャッシュを更新します。

```sql
REFRESH CATALOG seaweedfs;
```

## 3. カタログを使用する {#3-use-the-catalog}

```sql
USE seaweedfs;

CREATE DATABASE IF NOT EXISTS demo;

USE seaweedfs.demo;

CREATE TABLE iceberg_smoke (
  id BIGINT,
  label STRING
);

INSERT INTO iceberg_smoke VALUES (1, 'one'), (2, 'two'), (3, 'three');

SELECT id, label FROM iceberg_smoke ORDER BY id;
```

期待される出力：

```text
+----+-------+
| id | label |
+----+-------+
|  1 | one   |
|  2 | two   |
|  3 | three |
+----+-------+
```

これは SeaweedFS の統合テストで検証されるのと同じ経路です。Iceberg REST カタログを介して名前空間とテーブルを作成し、PyIceberg で行を追加し、Doris が標準的な S3 アクセスと Iceberg メタデータを通じてデータを読み取ります。

## 本番環境での注意事項 {#production-notes}

* 本番クラスターでは、`weed mini` の代わりに `weed master`、`weed volume`、`weed filer`、`weed s3 -iceberg.port=8181` を使用します（または SeaweedFS の Helm チャートを使用します）。Doris 側の設定は同じで、変更するのはホストとポートだけです。
* OAuth2 の認証情報には S3 アクセスキーを使用します。Doris のカタログへのアクセスに使う認証情報を更新する場合は、ほかの S3 ユーザーと同様に、そのキーを保持する IAM アイデンティティの認証情報を更新します。
* Iceberg テーブルのメンテナンス（コンパクション、スナップショットの期限切れ処理、孤立ファイルの削除、マニフェストの書き換え）は SeaweedFS に組み込まれており、同じバケットに対して実行されます。詳細は [SeaweedFS Iceberg Catalog wiki](https://github.com/seaweedfs/seaweedfs/wiki/SeaweedFS-Iceberg-Catalog) を参照してください。

## 参考資料 {#references}

* [SeaweedFS](https://github.com/seaweedfs/seaweedfs)
* [SeaweedFS の Doris Iceberg 統合テスト](https://github.com/seaweedfs/seaweedfs/tree/master/test/s3tables/catalog_doris)
* [Doris Iceberg Catalog リファレンス](https://doris.apache.org/docs/lakehouse/catalogs/iceberg-catalog)
