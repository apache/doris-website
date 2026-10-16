---
{
    "title": "Apache Ozone",
    "language": "ja",
    "description": "Doris はバージョン 4.0.4 以降、S3 Gateway 経由で Apache Ozone にアクセスできます。",
    "sidebar_label": "Apache Ozone"
}
---

# Apache Ozone

Doris はバージョン 4.0.4 以降、S3 Gateway 経由で Apache Ozone にアクセスできます。

このドキュメントでは、Apache Ozone へのアクセスに必要なパラメータを説明します。これらのパラメータは次の設定に適用されます。

- Catalog のプロパティ
- テーブル値関数のプロパティ
- Broker Load のプロパティ
- Export のプロパティ
- Outfile のプロパティ

**Ozone を専用のストレージタイプとして使用するには、`"fs.ozone.support" = "true"` を明示的に設定してください。**

## パラメータの概要

| プロパティ名 | 旧名称 | 説明 | デフォルト値 | 必須 |
| --- | --- | --- | --- | --- |
| ozone.endpoint | s3.endpoint | Ozone S3 Gateway のエンドポイント（例: `http://ozone-s3g:9878`） | なし | はい |
| ozone.region | s3.region | Ozone S3 Gateway のリージョン | `us-east-1` | いいえ |
| ozone.access_key | s3.access_key, s3.access-key-id | 認証に使用するアクセスキー | なし | いいえ* |
| ozone.secret_key | s3.secret_key, s3.secret-access-key | 認証に使用するシークレットキー | なし | いいえ* |
| ozone.session_token | s3.session_token, s3.session-token | セッショントークン | なし | いいえ |
| ozone.connection.maximum | s3.connection.maximum | 最大接続数 | `100` | いいえ |
| ozone.connection.request.timeout | s3.connection.request.timeout | リクエストのタイムアウト（ミリ秒） | `10000` | いいえ |
| ozone.connection.timeout | s3.connection.timeout | 接続のタイムアウト（ミリ秒） | `10000` | いいえ |
| ozone.use_path_style | use_path_style, s3.path-style-access | パス形式のアクセスを使用するかどうか | `true` | いいえ |
| ozone.force_parsing_by_standard_uri | force_parsing_by_standard_uri | 標準 URI 解析を強制するかどうか | `false` | いいえ |
| fs.ozone.support |  | Ozone をストレージタイプとして有効にするかどうか | `false` | はい |

注意事項:

- `ozone.access_key` と `ozone.secret_key` は両方を一緒に設定する必要があります。
- `fs.s3a.*` キーは Ozone のプロパティとして直接解析されません。`ozone.*` キーまたは互換性のある `s3.*` キーを使用してください。
- Ozone は `s3://`、`s3a://`、`s3n://` の URI スキームをサポートします。
- `ozone.endpoint`（または `s3.endpoint`）を設定するだけでは Ozone は有効になりません。`fs.ozone.support=true` を設定する必要があります。

## 設定例

`ozone.*` キーを使用する場合:

```properties
"fs.ozone.support" = "true",
"ozone.endpoint" = "http://ozone-s3g:9878",
"ozone.access_key" = "hadoop",
"ozone.secret_key" = "hadoop",
"ozone.region" = "us-east-1",
"ozone.use_path_style" = "true"
```

互換性のある `s3.*` エイリアスを使用する場合:

```properties
"fs.ozone.support" = "true",
"s3.endpoint" = "http://ozone-s3g:9878",
"s3.access_key" = "hadoop",
"s3.secret_key" = "hadoop",
"s3.region" = "us-east-1",
"s3.path-style-access" = "true"
```
