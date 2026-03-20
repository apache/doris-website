---
{
  "title": "DROP BACKEND",
  "language": "ja",
  "description": "このステートメントは、DorisクラスターからBEノードを削除するために使用されます。"
}
---
## 説明

このステートメントは、DorisクラスターからBEノードを削除するために使用されます。

## 構文

```sql
ALTER SYSTEM DROP BACKEND "<be_identifier>" [, "<be_identifier>" ... ]
```
ここで:

```sql
be_identifier
  : "<be_host>:<be_heartbeat_port>"
  | "<backend_id>"
```
## 必須パラメータ

**1. <be_host>**

> BEノードのホスト名またはIPアドレスを指定できます。

**2. <heartbeat_port>**

> BEノードのハートビートポート。デフォルトは9050です。

**3. <backend_id>**

> BEノードのIDです。

:::tip
`<be_host>`、`<be_heartbeat_port>`、`<backend_id>`は、すべて[SHOW BACKENDS](./SHOW-BACKENDS.md)文でクエリすることで取得できます。
:::

## アクセス制御要件

このSQLを実行するユーザーは、少なくとも以下の権限を持っている必要があります：

| 権限 | オブジェクト | 備考 |
|-----------|----|-------|
| NODE_PRIV |    |       |

## 使用上の注意

1. このコマンドを使用してBEノードをオフラインにすることは推奨されません。このコマンドはBEノードをクラスターから直接削除します。現在のノード上のデータは他のBEノードに負荷分散されません。クラスター内に単一レプリカテーブルがある場合、データ損失が発生する可能性があります。より良いアプローチは、[DECOMMISSION BACKEND](./DECOMMISSION-BACKEND.md)コマンドを使用してBEノードを優雅にオフラインにすることです。
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
## 例

1. BEノードのHostとHeartbeatPortに基づいてクラスターから2つのノードを削除する:

   ```sql
   ALTER SYSTEM DROPP BACKEND "192.168.0.1:9050", "192.168.0.2:9050";
   ```
2. BEノードのIDに基づいてクラスターから1つのノードを削除します：

    ```sql
    ALTER SYSTEM DROPP BACKEND "10002";
    ```
