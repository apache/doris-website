---
{
  "title": "ALTER ROLE",
  "language": "ja",
  "description": "ALTER ROLE文は、ロールを変更するために使用されます。"
}
---
## 説明

`ALTER ROLE`文は、ロールを変更するために使用されます。

## 構文

```sql
 ALTER ROLE <role_name> COMMENT <comment>;
```
## 必須パラメータ

**1. `<role_name>`**

> ロールの名前。

## オプションパラメータ

**1. `<comment>`**

> ロールのコメント。

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持つ必要があります：

| 権限          | オブジェクト | 備考 |
|:--------------|:-------------|:-----|
| ADMIN_PRIV    | USER または ROLE | この操作はADMIN_PRIV権限を持つユーザーまたはロールのみが実行できます |

## 例

- ロールのコメントを変更

```sql
ALTER ROLE role1 COMMENT "this is my first role";
```
