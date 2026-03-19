---
{
  "title": "CREATE ROLE",
  "description": "CREATE ROLE文は、権限のないロールを作成するために使用され、このロールには後でGRANTコマンドで権限を付与することができます。",
  "language": "ja"
}
---
## 説明

`CREATE ROLE`文は、権限のないロールを作成するために使用されます。このロールには、後でGRANTコマンドを使用して権限を付与することができます。

## 構文

```sql
 CREATE ROLE <role_name> [<comment>];
```
## 必須パラメータ

**1. `<role_name>`**

> ロールの名前。

## オプションパラメータ

**1. `<comment>`**

> ロールのコメント。

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持っている必要があります：

| Privilege     | Object    | 注釈 |
|:--------------|:----------|:------|
| ADMIN_PRIV    | USER or ROLE    | この操作はADMIN_PRIV権限を持つユーザーまたはロールによってのみ実行できます  |

## 例

- ロールを作成する

```sql
CREATE ROLE role1;
```
- コメント付きでロールを作成する

```sql
CREATE ROLE role2 COMMENT "this is my first role";
```
