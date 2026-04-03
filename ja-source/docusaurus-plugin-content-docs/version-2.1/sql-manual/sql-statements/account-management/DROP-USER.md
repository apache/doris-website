---
{
  "title": "DROP USER",
  "language": "ja",
  "description": "DROP USER文は、ユーザーを削除するために使用されます。"
}
---
## 説明

`DROP USER`文はユーザーを削除するために使用されます。

## 構文

```sql
  DROP USER '<user_identity>'
```
## 必須パラメータ

**1. `<user_identity>`**

> 指定されたユーザーアイデンティティ。

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持っている必要があります：

| Privilege     | Object    | Notes |
|:--------------|:----------|:------|
| ADMIN_PRIV    | USER or ROLE    | この操作はADMIN_PRIV権限を持つユーザーまたはロールによってのみ実行できます  |

## 例

- ユーザー jack@'192.%' を削除

```sql
DROP USER 'jack'@'192.%'
```
