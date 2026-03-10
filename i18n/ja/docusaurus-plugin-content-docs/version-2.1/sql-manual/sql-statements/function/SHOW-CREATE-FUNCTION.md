---
{
  "title": "SHOW CREATE FUNCTION",
  "language": "ja",
  "description": "このステートメントは、ユーザー定義関数の作成ステートメントを表示するために使用されます"
}
---
## 説明

このステートメントは、ユーザー定義関数の作成ステートメントを表示するために使用されます

## 構文

```sql
SHOW CREATE [ GLOBAL ] FUNCTION <function_name>( <arg_type> ) [ FROM <db_name> ];
```
## 必須パラメータ

**1. `<function_name>`**

> 作成ステートメントを照会したいカスタム関数の名前。

**2. `<arg_type>`**

> 作成ステートメントを照会する必要があるカスタム関数のパラメータリスト。
>
> パラメータリストの位置では、位置パラメータのデータ型を入力する必要があります

## オプションパラメータ

**1.`GLOBAL`**

> GLOBALはオプションパラメータです。
>
> GLOBALが設定されている場合、関数はグローバルに検索され、削除されます。
>
> GLOABLが入力されていない場合、関数は現在のデータベースで検索され、削除されます。

**2.`<db_name>`**

> FROM db_nameは、指定されたデータベースからカスタム関数を照会することを示します

## 戻り値

| Column          | Description          |
|-----------------|-------------|
| SYMBOL          | 関数パッケージ名        |
| FILE            | jarパッケージのパス     |
| ALWAYS_NULLABLE | 結果がNULLになる可能性があるか |
| TYPE            | 関数の型        |

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持つ必要があります：

| Privilege | Object   | Notes       |
|:----------|:---------|:--------------|
| SHOW_PRIV | Function | この関数に対するshow権限を持つ必要があります |

## 例

```sql
SHOW CREATE FUNCTION add_one(INT)
```
```text
| Function Signature | Create Function
+--------------------+-------------------------------------------------------
| add_one(INT)       | CREATE FUNCTION add_one(INT) RETURNS INT PROPERTIES (
  "SYMBOL"="org.apache.doris.udf.AddOne",
  "FILE"="file:///xxx.jar",
  "ALWAYS_NULLABLE"="true",
  "TYPE"="JAVA_UDF"
  ); |
+--------------------+-------------------------------------------------------
```
