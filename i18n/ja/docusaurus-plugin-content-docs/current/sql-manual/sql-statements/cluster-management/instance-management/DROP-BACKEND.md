---
{
    "title": "DROP BACKEND",
    "language": "ja",
    "description": "このステートメントは、Doris クラスタから BE ノードを削除するために使用します。"
}
---

## 説明

このステートメントは、Doris クラスタから BE ノードを削除するために使用します。

## 構文

```sql
ALTER SYSTEM DROP BACKEND "<be_identifier>" [, "<be_identifier>" ... ]
```

各識別子の形式は次のとおりです。

```sql
be_identifier
  : "<be_host>:<be_heartbeat_port>"
  | "<backend_id>"
```

## 必須パラメータ

**1. <be_host>**

> BE ノードのホスト名または IP アドレスを指定します。

**2. <heartbeat_port>**

> BE ノードのハートビートポートを指定します。デフォルトは 9050 です。

**3. <backend_id>**

> BE ノードの ID を指定します。

:::tip
`<be_host>`、`<be_heartbeat_port>`、`<backend_id>` は、[SHOW BACKENDS](./SHOW-BACKENDS.md) ステートメントで確認できます。
:::

## アクセス制御要件

この SQL を実行するユーザーには、少なくとも次の権限が必要です。

| 権限 | オブジェクト | 備考 |
|-----------|----|-------|
| NODE_PRIV |    |       |

## 使用上の注意

1. BE ノードをオフラインにする目的で、このコマンドを使用することは推奨しません。このコマンドは BE ノードをクラスタから直接削除し、そのノード上のデータは他の BE ノードに負荷分散されません。クラスタに単一レプリカのテーブルがある場合、データが失われる可能性があります。BE ノードを安全にオフラインにするには、[DECOMMISSION BACKEND](./DECOMMISSION-BACKEND.md) コマンドを使用してください。
2. この操作には高いリスクがあるため、次のコマンドを直接実行すると、
   ```sql
   ALTER SYSTEM DROP BACKEND "127.0.0.1:9050";
   ```
   ```text
   ERROR 1105 (HY000): errCode = 2, detailMessage = It is highly NOT RECOMMENDED to use DROP BACKEND stmt.It is not safe to directly drop a backend. All data on this backend will be discarded permanently. If you insist, use DROPP instead of DROP
   ```
   上記のメッセージが表示されます。操作の影響を理解したうえで続行する場合は、`DROP` キーワードを `DROPP` に置き換えます。
   ```sql
   ALTER SYSTEM DROPP BACKEND "127.0.0.1:9050";
   ```

## 例

1. BE ノードの Host と HeartbeatPort を指定して、クラスタから二つのノードを削除します。
   ```sql
   ALTER SYSTEM DROPP BACKEND "192.168.0.1:9050", "192.168.0.2:9050";
   ```

2. BE ノードの ID を指定して、クラスタから一つのノードを削除します。
    ```sql
    ALTER SYSTEM DROPP BACKEND "10002";
    ```
