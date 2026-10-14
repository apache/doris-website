---
{
    "title": "DROP FOLLOWER",
    "language": "ja",
    "description": "このステートメントは、FRONTEND の FOLLOWER ロールを持つノードを削除します。（管理者のみ実行できます。）"
}
---

## 説明

このステートメントは、FRONTEND の FOLLOWER ロールを持つノードを削除します。（管理者のみ実行できます。）

## 構文

```sql
ALTER SYSTEM DROP FOLLOWER "<follower_host>:<edit_log_port>"
```

## 必須パラメータ

**1. `<follower_host>`**

> FE ノードのホスト名または IP アドレスを指定できます。

**2. `<edit_log_port>`**

> FE ノードの bdbje 通信ポートです。デフォルトは 9010 です。

## アクセス権限の要件

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限 | 対象 | 備考 |
|-----------|----|-------|
| NODE_PRIV |    |       |

## 使用上の注意

1. FOLLOWER ノードを削除する前に、オフラインにするノードが Master ノードではないことを確認してください。
2. FOLLOWER ノードを削除する前に、そのノードをオフラインにした後も、クラスター内の FOLLOWER ノード数が奇数になることを確認してください。
3. FOLLOWER ノードを削除した後、[`SHOW FRONTENDS`](./SHOW-FRONTENDS.md) コマンドを使用して、ノードが正常に削除されたことを確認してください。

## 使用例

1. FOLLOWER ノードを削除する

   ```sql
   ALTER SYSTEM DROP FOLLOWER "host_ip:9010"
   ```
   このコマンドは、クラスター内の FOLLOWER ノード（IP アドレスは host_ip、ポートは 9010）を削除します。
