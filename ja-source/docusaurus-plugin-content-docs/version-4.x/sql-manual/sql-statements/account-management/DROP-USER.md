---
{
  "title": "DROP USER",
  "description": "DROP USER文は、ユーザーを削除するために使用されます。",
  "language": "ja"
}
---
## デスクリプション

`DROP USER`文は、ユーザーを削除するために使用されます。

## Syntax

```sql
  DROP USER '<user_identity>'
```
## 必須パラメータ

**1. `<user_identity>`**

> 指定するユーザーアイデンティティ。

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持つ必要があります：

| 権限          | オブジェクト    | 備考 |
|:--------------|:----------|:------|
| ADMIN_PRIV    | USER または ROLE    | この操作は、ADMIN_PRIV権限を持つユーザーまたはロールのみが実行できます  |

## 例

- ユーザー jack@'192.%' を削除

```sql
DROP USER 'jack'@'192.%'
```
