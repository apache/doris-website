---
{
  "title": "DROP FUNCTION",
  "description": "カスタム関数を削除します。",
  "language": "ja"
}
---
## デスクリプション

カスタム関数を削除します。

## Syntax

```sql
DROP [ GLOBAL ] <function_name> ( <arg_type> )
```
## 必須パラメータ

**1. `<function_name>`**

> 削除する関数の名前を指定します。
>
> 関数名は、関数が作成された時の関数名と完全に同じである必要があります。

**2. `<arg_type>`**

> 削除する関数の引数リストを指定します。
>
> パラメータリストの位置では、位置パラメータのデータ型を入力する必要があります。

## オプションパラメータ

**1.`GLOBAL`**

> GLOBALはオプションパラメータです。
>
> GLOBALが設定された場合、関数はグローバルに検索され削除されます。
>
> GLOABLが入力されない場合、関数は現在のデータベースで検索され削除されます。

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持つ必要があります：

| Privilege  | Object         | 注釈       |
|:-----------|:---------------|:------------|
| ADMIN_PRIV | Custom function| DROPは管理操作です |

## 使用上の注意

- 関数は、その名前とパラメータ型が同一の場合のみ削除できます

## 例

```sql
DROP FUNCTION my_add(INT, INT)
```
```sql
DROP GLOBAL FUNCTION my_add(INT, INT)
```
