---
{
  "title": "オブザーバーを追加",
  "description": "この文は、OBSERVER ロールを持つノードを FRONTEND ノードに追加します（管理者のみが使用！）",
  "language": "ja"
}
---
## デスクリプション

このステートメントは、FRONTENDノードにOBSERVERロールを持つノードを追加します（管理者のみが使用）

## Syntax

```sql
ALTER SYSTEM ADD OBSERVER "<observer_host>:<edit_log_port>"
```
## 必須パラメータ

**1. `<observer_host>`**

> FEノードのホスト名またはIPアドレスを指定できます

**2. `<edit_log_port>`**

> FEノードのbdbje通信ポート、デフォルトは9010です

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持つ必要があります：

| Privilege | Object | 注釈 |
|-----------|----|-------|
| NODE_PRIV |    |       |

## 使用上の注意

1. 新しいOBSERVERノードを追加する前に、ノードが適切に設定されていることを確認してください。
2. OBSERVERノードを追加した後、[`SHOW FRONTENDS`](./SHOW-FRONTENDS.md)コマンドを使用して、正常に追加され、正常な状態であることを確認してください。

## 例

1. OBSERVERノードを追加する

   ```sql
   ALTER SYSTEM ADD OBSERVER "host_ip:9010"
   ```
このコマンドは、OBSERVER ノードをクラスタに追加します（IP host_ip、ポート 9010）
