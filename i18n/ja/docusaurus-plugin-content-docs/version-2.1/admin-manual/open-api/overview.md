---
{
  "title": "概要 | Open Api",
  "language": "ja",
  "description": "Apache Dorisの運用保守管理の補完として、",
  "sidebar_label": "Overview"
}
---
# 概要

Apache Doris 運用保守管理の補完として、OPEN API は主にデータベース管理者が一部の管理操作を実行するために使用されます。

:::note
OPEN API は現在不安定であり、開発者がテストして使用することのみを推奨します。今後のバージョンでインターフェースの動作を変更する可能性があります。
本番環境では、SQL コマンドを使用して操作を完了することを推奨します。
:::

## セキュリティ認証

FE BE API のセキュリティ認証は、以下の設定を通じて有効にできます：

| 設定項目 | 設定ファイル | デフォルト値 | 説明 |
| --- | ---| --- | --- |
| `enable_all_http_auth` | `be.conf` | `false` | BE HTTP ポート（デフォルト 8040）の認証を有効にする。有効にした後、BE の HTTP API へのアクセスには ADMIN ユーザーログインが必要。 |
| `enable_brpc_builtin_services` | `be.conf` | true | brpc 組み込みサービスを外部に公開するかどうか（デフォルトは 8060）。無効にした場合、HTTP ポート 8060 にアクセスできなくなる。（バージョン 2.1.7 以降でサポート） |
| `enable_all_http_auth` | `fe.conf` | `false` | FE HTTP ポート（デフォルト 8030）の認証を有効にする。有効にした後、FE HTTP API へのアクセスには対応するユーザー権限が必要。 |

:::info NOTE
FE および BE の HTTP API の権限要件は、バージョンによって異なります。詳細については、対応する API ドキュメントを参照してください。
:::
