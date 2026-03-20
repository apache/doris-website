---
{
  "title": "DROP USER",
  "description": "DROP USER文は、ユーザーを削除するために使用されます。",
  "language": "ja"
}
---
## 説明

`DROP USER`文は、ユーザーを削除するために使用されます。

## 構文

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
| ADMIN_PRIV    | USER または ROLE    | この操作はADMIN_PRIV権限を持つユーザーまたはロールのみが実行できます  |

## 例

- ユーザーjack@'192.%'を削除する

```sql
DROP USER 'jack'@'192.%'
```
