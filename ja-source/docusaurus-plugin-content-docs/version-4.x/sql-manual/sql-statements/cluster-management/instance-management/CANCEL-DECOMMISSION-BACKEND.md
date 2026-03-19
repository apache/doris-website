---
{
  "title": "CANCEL DECOMMISSION BACKEND",
  "description": "このステートメントはBEノードの廃止操作をキャンセルするために使用されます。",
  "language": "ja"
}
---
## デスクリプション

このステートメントはBEノードの廃止操作をキャンセルするために使用されます。

:::tip
このステートメントはストレージとコンピュートの分離モードではサポートされていません。
:::

## Syntax

```sql
CANCEL DECOMMISSION BACKEND "<be_identifier>" [, "<be_identifier>" ... ]
```
ここで:

```sql
be_identifier
  : "<be_host>:<be_heartbeat_port>"
  | "<backend_id>"
```
## 必須パラメータ

**<be_host>**

> BEノードのホスト名またはIPアドレスを指定できます。

**<heartbeat_port>**

> BEノードのハートビートポート。デフォルトは9050です。

**<backend_id>**

> BEノードのIDです。

:::tip
`<be_host>`、`<be_heartbeat_port>`、および`<backend_id>`は、すべて[SHOW BACKENDS](./SHOW-BACKENDS.md)ステートメントでクエリすることで取得できます。
:::

## アクセス制御要件

このSQLを実行するユーザーは、少なくとも以下の権限を持っている必要があります：

| Privilege | Object | 注釈 |
|-----------|----|-------|
| NODE_PRIV |    |       |

## 使用上の注意

1. このコマンドを実行後、[SHOW BACKENDS](./SHOW-BACKENDS.md)ステートメントにより、デコミッション状態（`SystemDecommissioned`列の値がfalse）とデコミッションの進行状況（`TabletNum`列の値がゆっくりと減少しなくなる）を確認できます。
2. クラスターは他のノードから現在のBEにタブレットをゆっくりと移行し直すため、各BE上のタブレット数は最終的に均等に近づく傾向になります。

## 例

1. BEのHostとHeartbeatPortに従って、クラスターから2つのノードを安全にデコミッションします。

   ```sql
   CANCEL DECOMMISSION BACKEND "192.168.0.1:9050", "192.168.0.2:9050";
   ```
2. BEのIDに従って、クラスターから1つのノードを安全に廃止します。

   ```sql
   CANCEL DECOMMISSION BACKEND "10002";
   ```
