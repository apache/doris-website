---
{
  "title": "SHOW CREATE FUNCTION",
  "description": "このステートメントは、ユーザー定義関数の作成ステートメントを表示するために使用されます",
  "language": "ja"
}
---
## デスクリプション

このステートメントは、ユーザー定義関数の作成ステートメントを表示するために使用されます

## Syntax

```sql
SHOW CREATE [ GLOBAL ] FUNCTION <function_name>( <arg_type> ) [ FROM <db_name> ];
```
## 必須パラメータ

**1. `<function_name>`**

> 作成文をクエリしたいカスタム関数の名前。

**2. `<arg_type>`**

> 作成文をクエリする必要があるカスタム関数のパラメータリスト。
>
> パラメータリストの位置には、位置パラメータのデータ型を入力する必要があります

## オプションパラメータ

**1.`GLOBAL`**

> GLOBALはオプションパラメータです。
>
> GLOBALが設定されている場合、関数はグローバルに検索されて削除されます。
>
> GLOABLが入力されていない場合、関数は現在のデータベース内で検索されて削除されます。

**2.`<db_name>`**

> FROM db_nameは、指定されたデータベースからカスタム関数がクエリされることを示します

## 戻り値

| Column          | デスクリプション          |
|-----------------|-------------|
| SYMBOL          | 関数パッケージ名        |
| FILE            | jarパッケージパス     |
| ALWAYS_NULLABLE | 結果がNULLになる可能性があるかどうか |
| TYPE            | 関数タイプ        |

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持つ必要があります：

| Privilege | Object   | 注釈       |
|:----------|:---------|:--------------|
| SHOW_PRIV | ファンクション | この関数に対するshow権限を持つ必要があります |

## 例

```sql
SHOW CREATE FUNCTION add_one(INT)
```
```text
| ファンクション Signature | Create ファンクション
+--------------------+-------------------------------------------------------
| add_one(INT)       | CREATE FUNCTION add_one(INT) RETURNS INT PROPERTIES (
  "SYMBOL"="org.apache.doris.udf.AddOne",
  "FILE"="file:///xxx.jar",
  "ALWAYS_NULLABLE"="true",
  "TYPE"="JAVA_UDF"
  ); |
+--------------------+-------------------------------------------------------
```
