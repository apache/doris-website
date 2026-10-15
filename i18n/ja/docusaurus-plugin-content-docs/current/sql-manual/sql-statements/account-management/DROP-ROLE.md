---
{
    "title": "DROP ROLE",
    "language": "ja",
    "description": "DROP ROLE 文はロールを削除します。"
}
---

## 説明

`DROP ROLE` 文はロールを削除します。

## 構文 

```sql
  DROP ROLE [IF EXISTS] <role_name>;
```

## 必須パラメータ

**1. `<role_name>`**：

> ロール名。 

## 必要な権限

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限     | 対象    | 説明 |
|:--------------|:----------|:------|
| ADMIN_PRIV    | USER or ROLE    | この操作を実行できるのは ADMIN_PRIV 権限を持つユーザーまたはロールのみです  |

## 使用上の注意

- ロールを削除しても、以前そのロールに属していたユーザーの権限には影響しません。ロールとユーザーの関連付けを解除するだけであり、ユーザーがロールから取得した権限は変わりません。

## 例

準備として `role1` を作成し、DROP の例の対象にします。

```sql
CREATE ROLE role1;
```

- role1 を削除します

```sql
DROP ROLE role1;
```
