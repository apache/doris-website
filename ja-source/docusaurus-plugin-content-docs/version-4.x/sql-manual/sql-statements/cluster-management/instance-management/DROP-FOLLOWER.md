---
{
  "title": "DROP FOLLOWER",
  "description": "このステートメントは、FRONTENDのFOLLOWERロールを持つノードを削除します。（管理者のみ！）",
  "language": "ja"
}
---
## デスクリプション

このステートメントは、FRONTENDのFOLLOWERロールを持つノードを削除します。（管理者専用！）

## Syntax

```sql
ALTER SYSTEM DROP FOLLOWER "<follower_host>:<edit_log_port>"
```
## 必要なパラメータ

**1. `<follower_host>`**

> FEノードのホスト名またはIPアドレスを指定可能

**2. `<edit_log_port>`**

> FEノードのbdbje通信ポート、デフォルトは9010

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持っている必要があります：

| 権限 | オブジェクト | 備考 |
|-----------|----|-------|
| NODE_PRIV |    |       |

## 使用上の注意

1. FOLLOWERノードを削除する前に、オフラインにする必要があるノードがMasterノードでないことを確認してください。
2. FOLLOWERノードを削除する前に、オフライン後のクラスター内のFOLLOWERノード数が奇数になることを確認してください。
3. FOLLOWERノードを削除した後、[`SHOW FRONTENDS`](./SHOW-FRONTENDS.md)コマンドを使用して正常に削除されたことを確認してください。

## 例

1. FOLLOWERノードを削除する

   ```sql
   ALTER SYSTEM DROP FOLLOWER "host_ip:9010"
   ```
このコマンドは、クラスター内のFOLLOWERノード（IP host_ip、ポート9010）を削除します。
