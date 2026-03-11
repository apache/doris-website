---
{
  "title": "DROP BACKEND",
  "description": "このステートメントは、DorisクラスターからBEノードを削除するために使用されます。",
  "language": "ja"
}
---
## デスクリプション

このステートメントはDorisクラスターからBEノードを削除するために使用されます。

## Syntax

```sql
ALTER SYSTEM DROP BACKEND "<be_identifier>" [, "<be_identifier>" ... ]
```
どこで：

```sql
be_identifier
  : "<be_host>:<be_heartbeat_port>"
  | "<backend_id>"
```
## 必須パラメータ

**1. <be_host>**

> BEノードのホスト名またはIPアドレスを指定できます。

**2. <heartbeat_port>**

> BEノードのハートビートポートです。デフォルトは9050です。

**3. <backend_id>**

> BEノードのIDです。

:::tip
`<be_host>`、`<be_heartbeat_port>`、`<backend_id>`はすべて[SHOW BACKENDS](./SHOW-BACKENDS.md)文でクエリを実行して取得できます。
:::

## アクセス制御要件

このSQLを実行するユーザーは、少なくとも以下の権限を持つ必要があります：

| Privilege | Object | 注釈 |
|-----------|----|-------|
| NODE_PRIV |    |       |

## 使用上の注意

1. このコマンドを使用してBEノードをオフラインにすることは推奨されません。このコマンドはBEノードをクラスターから直接削除します。現在のノード上のデータは他のBEノードに負荷分散されません。クラスター内に単一レプリカTableがある場合、データ損失が発生する可能性があります。より良いアプローチは、[DECOMMISSION BACKEND](./DECOMMISSION-BACKEND.md)コマンドを使用してBEノードを適切にオフラインにすることです。
2. この操作は高リスク操作であるため、このコマンドを直接実行する場合：

   ```sql
   ALTER SYSTEM DROP BACKEND "127.0.0.1:9050";
   ```
   ```text
   ERROR 1105 (HY000): errCode = 2, detailMessage = It is highly NOT RECOMMENDED to use DROP BACKEND stmt.It is not safe to directly drop a backend. All data on this backend will be discarded permanently. If you insist, use DROPP instead of DROP
   ```
上記のプロンプトメッセージが表示されます。実行内容を理解している場合は、`DROP`キーワードを`DROPP`に置き換えて続行できます：

   ```sql
   ALTER SYSTEM DROPP BACKEND "127.0.0.1:9050";
   ```
## Examples

1. BEノードのHostとHeartbeatPortに基づいて、クラスターから2つのノードを削除する：

   ```sql
   ALTER SYSTEM DROPP BACKEND "192.168.0.1:9050", "192.168.0.2:9050";
   ```
2. BEノードのIDに基づいて、クラスターから1つのノードを削除します：

    ```sql
    ALTER SYSTEM DROPP BACKEND "10002";
    ```
