---
{
  "title": "BACKEND廃止のキャンセル",
  "language": "ja",
  "description": "この文は、BEノードの廃止操作をキャンセルするために使用されます。"
}
---
## 説明

このステートメントは、BEノードの廃止操作をキャンセルするために使用されます。

:::tip
このステートメントは、ストレージとコンピューティングの分離モードではサポートされていません。
:::

## 構文

```sql
CANCEL DECOMMISSION BACKEND "<be_identifier>" [, "<be_identifier>" ... ]
```
ここで：

```sql
be_identifier
  : "<be_host>:<be_heartbeat_port>"
  | "<backend_id>"
```
## 必要なパラメータ

**<be_host>**

> BEノードのホスト名またはIPアドレスを指定できます。

**<heartbeat_port>**

> BEノードのハートビートポート。デフォルトは9050です。

**<backend_id>**

> BEノードのIDです。

:::tip
`<be_host>`、`<be_heartbeat_port>`、`<backend_id>`はすべて[SHOW BACKENDS](./SHOW-BACKENDS.md)文でクエリして取得できます。
:::

## アクセス制御要件

このSQLを実行するユーザーは、少なくとも以下の権限を持つ必要があります：

| 権限 | オブジェクト | 備考 |
|-----------|----|-------|
| NODE_PRIV |    |       |

## 使用上の注意

1. このコマンドを実行した後、[SHOW BACKENDS](./SHOW-BACKENDS.md)文を使用して、デコミッション状態（`SystemDecommissioned`列の値がfalse）とデコミッションの進行状況（`TabletNum`列の値がゆっくりと減少しなくなる）を確認できます。
2. クラスターは他のノードからタブレットを現在のBEにゆっくりと移行するため、各BEのタブレット数は最終的に均等に近づく傾向があります。

## 例

1. BEのHostとHeartbeatPortに基づいて、クラスターから2つのノードを安全にデコミッションします。

   ```sql
   CANCEL DECOMMISSION BACKEND "192.168.0.1:9050", "192.168.0.2:9050";
   ```
2. BEのIDに従って、クラスターから1つのノードを安全に廃止します。

   ```sql
   CANCEL DECOMMISSION BACKEND "10002";
   ```
