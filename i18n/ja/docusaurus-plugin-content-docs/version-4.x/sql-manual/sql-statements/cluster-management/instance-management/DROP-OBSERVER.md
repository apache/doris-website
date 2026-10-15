---
{
    "title": "DROP OBSERVER",
    "language": "ja",
    "description": "このステートメントは、FRONTEND の OBSERVER ロールを持つノードを削除します（管理者のみ使用できます）。"
}
---

## 説明

このステートメントは、FRONTEND の OBSERVER ロールを持つノードを削除します（管理者のみ使用できます）。

## 構文

```sql
ALTER SYSTEM DROP OBSERVER "<observer_host>:<edit_log_port>"
```

## 必須パラメータ

**1. `<observer_host>`**

> FE ノードのホスト名または IP アドレスを指定できます。

**2. `<edit_log_port>`**

> FE ノードの bdbje 通信ポート。デフォルトは 9010 です。

## アクセス制御要件

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限 | オブジェクト | 備考 |
|-----------|----|-------|
| NODE_PRIV |    |       |

## 使用上の注意

1. OBSERVER ノードを削除した後、[`SHOW FRONTENDS`](./SHOW-FRONTENDS.md) コマンドを使用して、正常に削除されたことを確認します。

## 例

1. OBSERVER ノードの削除

   ```sql
   ALTER SYSTEM DROP OBSERVER "host_ip:9010"
   ```
   このコマンドは、クラスター内の OBSERVER ノード（IP アドレス host_ip、ポート 9010）を削除します。
