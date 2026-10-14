---
{
    "title": "ADD OBSERVER",
    "language": "ja",
    "description": "このステートメントは、OBSERVER ロールの FRONTEND ノードを追加します（管理者のみ使用可能）。"
}
---

## 説明

このステートメントは、OBSERVER ロールの FRONTEND ノードを追加します（管理者のみ使用可能）。

## 構文

```sql
ALTER SYSTEM ADD OBSERVER "<observer_host>:<edit_log_port>"
```

## 必須パラメータ

**1. `<observer_host>`**

> FE ノードのホスト名または IP アドレスを指定できます。

**2. `<edit_log_port>`**

> FE ノードの bdbje 通信ポートです。デフォルトは 9010 です。

## アクセス制御要件

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限 | オブジェクト | 備考 |
|-----------|----|-------|
| NODE_PRIV |    |       |

## 使用上の注意

1. 新しい OBSERVER ノードを追加する前に、そのノードが適切に設定されていることを確認してください。
2. OBSERVER ノードを追加した後、[`SHOW FRONTENDS`](./SHOW-FRONTENDS.md) コマンドを使用して、ノードが正常に追加され、正常な状態にあることを確認してください。

## 例

1. OBSERVER ノードを追加する
   ```sql
   ALTER SYSTEM ADD OBSERVER "host_ip:9010"
   ```
   このコマンドは、OBSERVER ノード（IP アドレス host_ip、ポート 9010）をクラスターに追加します。
