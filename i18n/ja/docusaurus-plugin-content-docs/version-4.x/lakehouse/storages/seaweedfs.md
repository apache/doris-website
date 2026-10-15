---
{
    "title": "SeaweedFS | ストレージ",
    "language": "ja",
    "description": "このドキュメントでは、SeaweedFS へのアクセスに必要なパラメータを説明します。これらのパラメータは、以下の用途に適用されます。",
    "sidebar_label": "SeaweedFS"
}
---

# SeaweedFS

このドキュメントでは、[SeaweedFS](https://seaweedfs.com/) へのアクセスに必要なパラメータを説明します。これらのパラメータは、以下の用途に適用されます。

- カタログのプロパティ
- テーブル値関数のプロパティ
- Broker Load のプロパティ
- Export のプロパティ
- Outfile のプロパティ

**Doris は S3 クライアントを使用し、S3 互換プロトコルで SeaweedFS にアクセスします。** このページでは、SeaweedFS S3 の通常のバケットを扱います。SeaweedFS S3 Table Buckets（REST Catalog と S3 を同じ `weed` プロセスから提供）に保存された Iceberg テーブルについては、[SeaweedFS との連携](../best-practices/doris-seaweedfs.md)を参照してください。

## `weed mini` によるクイックスタート

`weed mini` は、環境変数から認証情報を設定してバケットを事前に作成し、単一のプロセスで SeaweedFS の S3 エンドポイントを起動します。

```bash
AWS_ACCESS_KEY_ID=admin \
AWS_SECRET_ACCESS_KEY=secret \
S3_BUCKET=my-bucket \
weed mini -dir=/data
```

S3 エンドポイントには `http://localhost:8333` でアクセスできます。`my-bucket` は作成済みで、`admin` / `secret` を有効な認証情報として使用できます。Docker、ポートの変更、複数のバケット、リバースプロキシの設定については、[`weed mini` のクイックスタート](https://github.com/seaweedfs/seaweedfs/wiki/Quick-Start-with-weed-mini)を参照してください。

## パラメータ一覧

SeaweedFS には S3 互換プロトコルでアクセスするため、AWS S3 と同じ `s3.*` プロパティを使用します。

| プロパティ名                    | 説明                                                                                                    | デフォルト値 | 必須 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------ | ---- |
| s3.endpoint                     | SeaweedFS S3 ゲートウェイのエンドポイント。例: `http://seaweedfs.example.com:8333`                      |              | はい |
| s3.access_key                   | SeaweedFS S3 の IAM 設定で構成したアクセスキー                                                           |              | はい |
| s3.secret_key                   | `s3.access_key` に対応するシークレットキー                                                               |              | はい |
| s3.region                       | リージョン。SeaweedFS は値を検証しませんが、AWS S3 SDK には指定が必要です。例: `us-east-1`               |              | はい |
| s3.use_path_style               | `true` に設定します。SeaweedFS は `http://<endpoint>/<bucket>/<key>` でオブジェクトを提供します。        | FALSE        | いいえ |
| s3.connection.maximum           | SeaweedFS S3 ゲートウェイへの最大接続数                                                                  | 50           | いいえ |
| s3.connection.request.timeout   | リクエストのタイムアウト（ミリ秒）                                                                       | 3000         | いいえ |
| s3.connection.timeout           | 接続確立のタイムアウト（ミリ秒）                                                                         | 1000         | いいえ |

### パス形式のアクセス

SeaweedFS はパス形式のアドレス指定（`http://<endpoint>/<bucket>/<key>`）を使用し、バケットごとの DNS サブドメインを用意しません。そのため、すべての接続で `s3.use_path_style = true` を設定してください。

## 設定例

```properties
"s3.access_key" = "your-access-key",
"s3.secret_key" = "your-secret-key",
"s3.endpoint" = "http://seaweedfs.example.com:8333",
"s3.region" = "us-east-1",
"s3.use_path_style" = "true"
```

## 利用時の推奨事項

* `s3.use_path_style = true` を設定してください。SeaweedFS はバケットごとの DNS サブドメインを使用しません。
* `s3.region` は AWS S3 SDK で必須ですが、SeaweedFS では無視されます。空でない値なら使用できます。
* HTTPS を使用する場合は、リバースプロキシで TLS を終端し、S3 署名の検証が機能するように `weed` を `-s3.externalUrl=https://<proxy>` で起動してください。
* SeaweedFS S3 Table Buckets 内の Iceberg テーブルについては、[SeaweedFS との連携](../best-practices/doris-seaweedfs.md)を参照してください。
