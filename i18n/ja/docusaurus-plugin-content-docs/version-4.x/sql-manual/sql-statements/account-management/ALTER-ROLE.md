---
{
    "title": "ALTER ROLE",
    "language": "ja",
    "description": "ALTER ROLE 文はロールを変更します。"
}
---

## 説明

`ALTER ROLE` 文はロールを変更します。

## 構文 

```sql
 ALTER ROLE <role_name> COMMENT <comment>;
```

## 必須パラメータ

**1. `<role_name>`**

> ロール名。 

## 任意パラメータ

**1. `<comment>`**

> ロールのコメント。

## 必要な権限

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限     | 対象    | 説明 |
|:--------------|:----------|:------|
| ADMIN_PRIV    | USER or ROLE    | この操作を実行できるのは ADMIN_PRIV 権限を持つユーザーまたはロールのみです  |

## 例

- ロールのコメントを変更します

```sql
ALTER ROLE role1 COMMENT "this is my first role";
```

