---
{
    "title": "DROP USER",
    "language": "ja",
    "description": "DROP USER 文はユーザーを削除します。"
}
---

## 説明

`DROP USER` 文はユーザーを削除します。

## 構文 

```sql
  DROP USER <user_identity>
```

## 必須パラメータ

**1. `<user_identity>`**

> 指定したユーザー識別子。

## 必要な権限

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限     | 対象    | 説明 |
|:--------------|:----------|:------|
| ADMIN_PRIV    | USER or ROLE    | この操作を実行できるのは ADMIN_PRIV 権限を持つユーザーまたはロールのみです  |

## 例

- ユーザー jack@'192.%' を削除します

```sql
DROP USER 'jack'@'192.%'
```
