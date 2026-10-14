---
{
    "title": "ADD FOLLOWER",
    "language": "ja",
    "description": "FRONTEND ノードに FOLLOWER ロールのノードを追加するステートメントです（管理者のみが使用できます）。"
}
---

## 説明

このステートメントは、FRONTEND ノードに FOLLOWER ロールのノードを追加します（管理者のみが使用できます）。

## 構文

```sql
ALTER SYSTEM ADD FOLLOWER "<follower_host>:<edit_log_port>"
```

## 必須パラメータ

**1. `<follower_host>`**

> FE ノードのホスト名または IP アドレスを指定できます。

**2. `<edit_log_port>`**

> FE ノードの bdbje 通信ポートです。デフォルトは 9010 です。

## 必要な権限

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限 | 対象 | 備考 |
|-----------|----|-------|
| NODE_PRIV |    |       |

## 使用上の注意

1. 新しい FOLLOWER ノードを追加する前に、そのノードが正しく設定されていることを確認してください。
2. FOLLOWER ノードを追加する前に、追加後のクラスタ内の FOLLOWER ノード数が奇数になることを確認してください。
3. FOLLOWER ノードを追加した後、[`SHOW FRONTENDS`](./SHOW-FRONTENDS.md) コマンドを使用して、追加が成功し、ノードが正常な状態にあることを確認してください。

## 例

1. FOLLOWER ノードを追加する

   ```sql
   ALTER SYSTEM ADD FOLLOWER "host_ip:9010"
   ```
   このコマンドは、IP アドレスが host_ip、ポートが 9010 の FOLLOWER ノードをクラスタに追加します。
