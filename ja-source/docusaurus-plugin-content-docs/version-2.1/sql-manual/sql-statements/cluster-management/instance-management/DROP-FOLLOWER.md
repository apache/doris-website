---
{
  "title": "DROP FOLLOWER",
  "language": "ja",
  "description": "このステートメントはFRONTENDのFOLLOWERロールを持つノードを削除します。（管理者のみ！）"
}
---
## 説明

このステートメントは、FRONTENDのFOLLOWERロールを持つノードを削除します。（管理者のみ！）

## 構文

```sql
ALTER SYSTEM DROP FOLLOWER "<follower_host>:<edit_log_port>"
```
## 必須パラメータ

**1. `<follower_host>`**

> FEノードのホスト名またはIPアドレスを指定できます

**2. `<edit_log_port>`**

> FEノードのbdbje通信ポート、デフォルトは9010です

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持っている必要があります：

| 権限 | オブジェクト | 備考 |
|-----------|----|-------|
| NODE_PRIV |    |       |

## 使用上の注意

1. FOLLOWERノードを削除する前に、オフラインにする必要があるノードがMasterノードではないことを確認してください。
2. FOLLOWERノードを削除する前に、オフライン後のクラスター内のFOLLOWERノード数が奇数であることを確認してください。
3. FOLLOWERノードを削除した後、[`SHOW FRONTENDS`](./SHOW-FRONTENDS.md)コマンドを使用して正常に削除されたことを確認してください。

## 例

1. FOLLOWERノードを削除する

   ```sql
   ALTER SYSTEM DROP FOLLOWER "host_ip:9010"
   ```
このコマンドは、クラスタ内のFOLLOWERノード（IP host_ip、ポート9010）を削除します
