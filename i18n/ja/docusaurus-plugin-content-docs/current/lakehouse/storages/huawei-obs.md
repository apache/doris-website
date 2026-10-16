---
{
    "title": "Huawei OBS",
    "language": "ja",
    "description": "このドキュメントでは、Huawei Cloud OBS へのアクセスに必要なパラメータについて説明します。これらのパラメータは、以下の場面で使用できます。"
}
---

このドキュメントでは、Huawei Cloud OBS へのアクセスに必要なパラメータについて説明します。これらのパラメータは、以下の場面で使用できます。

- Catalog のプロパティ
- テーブル値関数のプロパティ
- Broker Load のプロパティ
- Export のプロパティ
- Outfile のプロパティ

**Doris は S3 互換プロトコルを介し、S3 クライアントを使用して Huawei Cloud OBS にアクセスします。**

## パラメータの概要

| プロパティ名 | 旧名称 | 説明 | デフォルト値 | 必須 |
| ------------ | ------ | ---- | ------------ | ---- |
| obs.endpoint | s3.endpoint | Huawei Cloud OBS にアクセスするためのエンドポイントを指定します | | はい |
| obs.access_key | s3.access_key | 認証に使用する OBS のアクセスキー | | はい |
| obs.secret_key | s3.secret_key | 認証時にアクセスキーと併用する OBS のシークレットキー | | はい |
| obs.region | s3.region | Huawei Cloud OBS のリージョンを指定します | | いいえ |
| obs.use_path_style | s3.use_path_style | パス形式のアクセスを使用するかどうか。MinIO や Ceph など、AWS 以外の S3 サービスとの互換性のために true に設定することを推奨します | FALSE | いいえ |
| obs.connection.maximum | s3.connection.maximum | OBS サービスへの最大接続数 | 50 | いいえ |
| obs.connection.request.timeout | s3.connection.request.timeout | OBS サービスへの接続時のリクエストタイムアウト（ミリ秒） | 3000 | いいえ |
| obs.connection.timeout | s3.connection.timeout | OBS サービスへの接続を確立する際の接続タイムアウト（ミリ秒） | 1000 | いいえ |

> バージョン 3.1 より前では旧名称を使用します。

## 設定例

```properties
"obs.access_key" = "your-access-key",
"obs.secret_key" = "your-secret-key",
"obs.endpoint" = "obs.cn-north-4.myhuaweicloud.com",
"obs.region" = "cn-north-4"
```

バージョン 3.1 より前の場合：

```properties
"s3.access_key" = "your-access-key",
"s3.secret_key" = "your-secret-key",
"s3.endpoint" = "obs.cn-north-4.myhuaweicloud.com",
"s3.region" = "cn-north-4",
```

## 使用上の推奨事項

* Huawei Cloud OBS 用の設定であることを明確にし、一貫性を保つため、設定パラメータには `obs.` プレフィックスを使用することを推奨します。
* バージョン 3.1 より前では、旧名称の `s3.` プレフィックスを使用してください。
* `obs.region` を設定すると、アクセスの正確性とパフォーマンスを向上できます。設定することを推奨します。
* 接続のブロックを避けるため、同時実行数に応じて接続プールのパラメータを調整できます。
