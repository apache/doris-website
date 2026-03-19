---
{
  "title": "DROP OBSERVER",
  "description": "この文は、FRONTEND の OBSERVER ロールを持つノードを削除します（管理者のみが使用！）",
  "language": "ja"
}
---
## デスクリプション

この文は FRONTEND の OBSERVER ロールを持つノードを削除します（管理者のみが使用！）

## Syntax

```sql
ALTER SYSTEM DROP OBSERVER "<observer_host>:<edit_log_port>"
```
## 必須パラメータ

**1. `<observer_host>`**

> FEノードのホスト名またはIPアドレスを指定できます

**2. `<edit_log_port>`**

> FEノードのbdbje通信ポート、デフォルトは9010です

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持っている必要があります：

| 権限 | オブジェクト | 備考 |
|-----------|----|-------|
| NODE_PRIV |    |       |

## 使用上の注意

1. OBSERVERノードを削除した後、[`SHOW FRONTENDS`](./SHOW-FRONTENDS.md)コマンドを使用して正常に削除されたことを確認してください。

## 例

1. OBSERVERノードの削除

   ```sql
   ALTER SYSTEM DROP OBSERVER "host_ip:9010"
   ```
このコマンドは、クラスター内のOBSERVERノード（IP host_ip、ポート9010）を削除します
