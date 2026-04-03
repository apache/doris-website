---
{
  "title": "DROP FUNCTION",
  "language": "ja",
  "description": "カスタム関数を削除します。"
}
---
## 説明

カスタム関数を削除します。

## 構文

```sql
DROP [ GLOBAL ] <function_name> ( <arg_type> )
```
## 必須パラメータ

**1. `<function_name>`**

> 削除する関数の名前を指定します。
>
> 関数名は、関数作成時の関数名と完全に同じである必要があります。

**2. `<arg_type>`**

> 削除する関数の引数リストを指定します。
>
> パラメータリストの位置では、位置パラメータのデータ型を入力する必要があります。

## オプションパラメータ

**1.`GLOBAL`**

> GLOBALはオプションパラメータです。
>
> GLOBALが設定されている場合、関数はグローバルに検索され削除されます。
>
> GLOABLが入力されていない場合、関数は現在のデータベース内で検索され削除されます。

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持っている必要があります：

| Privilege  | Object         | Notes       |
|:-----------|:---------------|:------------|
| ADMIN_PRIV | Custom function| DROPは管理操作です |


## 使用上の注意

- 関数は、その名前とパラメータ型が同一の場合にのみ削除できます

## Examples

```sql
DROP FUNCTION my_add(INT, INT)
```
```sql
DROP GLOBAL FUNCTION my_add(INT, INT)
```
