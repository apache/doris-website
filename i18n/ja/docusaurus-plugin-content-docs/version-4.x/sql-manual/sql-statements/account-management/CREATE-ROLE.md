---
{
    "title": "CREATE ROLE",
    "language": "ja",
    "description": "CREATE ROLE 文は権限を持たないロールを作成します。後から GRANT コマンドで権限を付与できます。"
}
---

## 説明

`CREATE ROLE` 文は権限を持たないロールを作成します。後から GRANT コマンドで権限を付与できます。

## 構文 

```sql
 CREATE ROLE <role_name> [<comment>];
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

- ロールを作成します

```sql
CREATE ROLE role1;
```

- コメント付きでロールを作成します

```sql
CREATE ROLE role2 COMMENT "this is my first role";
```
