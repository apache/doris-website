---
{
  "title": "概要 | Open Api",
  "language": "ja",
  "description": "Apache Dorisの運用保守管理の補完として、",
  "sidebar_label": "Overview"
}
---
# 概要

Apache Dorisの運用・保守管理の補完として、OPEN APIは主にデータベース管理者が一部の管理操作を実行するために使用されます。

:::note
OPEN APIは現在不安定であり、開発者のテストと使用のみを推奨しています。後続のバージョンでインターフェースの動作を変更する可能性があります。
本番環境では、SQLコマンドを使用して操作を完了することを推奨します。
:::

## セキュリティ認証

FE BE APIのセキュリティ認証は、以下の設定で有効化できます：

| 設定 | 設定ファイル | デフォルト値 | 説明 |
| --- | ---| --- | --- |
| `enable_all_http_auth` | `be.conf` | `false` | BE HTTPポート（デフォルト8040）の認証を有効化。有効化後、BEのHTTP APIへのアクセスにはADMINユーザーログインが必要。 |
| `enable_brpc_builtin_services` | `be.conf` | true | brpcビルトインサービスを外部に開放するかどうか（デフォルトは8060）。無効化すると、HTTPポート8060にアクセスできなくなります。（バージョン2.1.7以降でサポート） |
| `enable_all_http_auth` | `fe.conf` | `false` | FE HTTPポート（デフォルト8030）の認証を有効化。有効化後、FE HTTP APIへのアクセスには対応するユーザー権限が必要。 |

:::info NOTE
FEとBEのHTTP APIの権限要件はバージョンごとに異なります。詳細については対応するAPIドキュメントを参照してください。
:::
