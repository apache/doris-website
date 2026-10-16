---
{
    "title": "Tencent COS",
    "language": "ja",
    "description": "このドキュメントでは、Tencent Cloud COS にアクセスするために必要なパラメータについて説明します。これらのパラメータは、以下の用途に適用されます。"
}
---

このドキュメントでは、Tencent Cloud COS にアクセスするために必要なパラメータについて説明します。これらのパラメータは、以下の用途に適用されます。

- Catalog のプロパティ
- テーブル値関数のプロパティ
- Broker Load のプロパティ
- Export のプロパティ
- Outfile のプロパティ

**Doris は、S3 互換プロトコルを介して S3 クライアントで Tencent Cloud COS にアクセスします。**

## パラメータの概要

| プロパティ名 | 旧名称 | 説明 | デフォルト値 | 必須 |
| --- | --- | --- | --- | --- |
| cos.endpoint | s3.endpoint | Tencent Cloud COS にアクセスするためのエンドポイントを指定します。 | | はい |
| cos.access_key | s3.access_key | COS へのアクセスを認証するためのアクセスキーです。 | | はい |
| cos.secret_key | s3.secret_key | アクセスキーとともに認証に使用する COS のシークレットキーです。 | | はい |
| cos.region | s3.region | Tencent Cloud COS のリージョンを指定します。 | | いいえ |
| cos.connection.maximum | s3.connection.maximum | S3 の最大接続数として、COS サービスへの最大接続数を指定します。 | 50 | いいえ |
| cos.connection.request.timeout | s3.connection.request.timeout | S3 リクエストタイムアウトとして、COS サービスへの接続時のリクエストタイムアウトをミリ秒単位で指定します。 | 3000 | いいえ |
| cos.connection.timeout | s3.connection.timeout | S3 接続タイムアウトとして、COS サービスへの接続を確立する際のタイムアウトをミリ秒単位で指定します。 | 1000 | いいえ |

> バージョン 3.1 より前では旧名称を使用してください。

## 設定例

```properties
"cos.access_key" = "your-access-key",
"cos.secret_key" = "your-secret-key",
"cos.endpoint" = "cos.ap-beijing.myqcloud.com",
"cos.region" = "ap-beijing"
```

バージョン 3.1 より前の場合：

```properties
"s3.access_key" = "ak",
"s3.secret_key" = "sk",
"s3.endpoint" = "cos.ap-beijing.myqcloud.com",
"s3.region" = "ap-beijing"
```

## 使用上の推奨事項

* 設定パラメータには `cos.` プレフィックスを使用することを推奨します。Tencent Cloud COS 向けの設定であることが明確になり、一貫性も保てます。
* バージョン 3.1 より前では、旧来の `s3.` プレフィックスを使用してください。
* `cos.region` を設定するとアクセスの精度とパフォーマンスが向上するため、設定することを推奨します。
* 接続がブロックされないように、同時実行の要件に応じて接続プールのパラメータを調整できます。
