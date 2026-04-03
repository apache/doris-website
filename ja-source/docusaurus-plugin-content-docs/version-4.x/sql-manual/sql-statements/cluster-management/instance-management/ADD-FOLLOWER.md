---
{
  "title": "フォロワーを追加",
  "description": "この文は、FOLLOWER ロールを持つノードを FRONTEND ノードに追加します（管理者のみが使用！）",
  "language": "ja"
}
---
## デスクリプション

このステートメントは、FRONTENDノードにFOLLOWERロールを持つノードを追加します（管理者のみが使用！）

## Syntax

```sql
ALTER SYSTEM ADD FOLLOWER "<follower_host>:<edit_log_port>"
```
## 必須パラメータ

**1. `<follower_host>`**

> FEノードのホスト名またはIPアドレスを指定できます

**2. `<edit_log_port>`**

> FEノードのbdbje通信ポート、デフォルトは9010です

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持つ必要があります：

| 権限 | オブジェクト | 備考 |
|-----------|----|-------|
| NODE_PRIV |    |       |

## 使用上の注意

1. 新しいFOLLOWERノードを追加する前に、ノードが適切に設定されていることを確認してください。
2. FOLLOWERノードを追加する前に、追加後のクラスター内のFOLLOWERノード数が奇数になることを確認してください。
3. FOLLOWERノードを追加した後、[`SHOW FRONTENDS`](./SHOW-FRONTENDS.md)コマンドを使用して、正常に追加され、正常な状態にあることを確認してください。

## 例

1. FOLLOWERノードを追加する

   ```sql
   ALTER SYSTEM ADD FOLLOWER "host_ip:9010"
   ```
このコマンドは、FOLLOWERノードをクラスター（IP host_ip、ポート9010）に追加します。
