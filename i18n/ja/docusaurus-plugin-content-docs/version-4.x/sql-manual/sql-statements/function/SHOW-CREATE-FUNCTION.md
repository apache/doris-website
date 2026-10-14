---
{
    "title": "SHOW CREATE FUNCTION",
    "language": "ja",
    "description": "ユーザー定義関数の作成ステートメントを表示するためのステートメントです"
}
---

## 説明

このステートメントは、ユーザー定義関数の作成ステートメントを表示します。

## 構文

```sql
SHOW CREATE [ GLOBAL ] FUNCTION <function_name>( <arg_type> ) [ FROM <db_name> ];
```

## 必須パラメータ

**1. `<function_name>`**

> 作成ステートメントを確認するカスタム関数の名前です。

**2. `<arg_type>`**

> 作成ステートメントを確認するカスタム関数の引数リストです。
>
> 引数リストの各位置には、その位置の引数のデータ型を指定します。

## 任意パラメータ

**1.`GLOBAL`**

> GLOBAL は省略可能です。
>
> GLOBAL を指定すると、関数はグローバルに検索されます。
>
> GLOBAL を指定しない場合、関数は現在のデータベース内で検索されます。

**2.`<db_name>`**

> FROM db_name は、指定したデータベースからカスタム関数を検索することを示します。

## 戻り値

| 列              | 説明                    |
|-----------------|-------------------------|
| SYMBOL          | 関数のパッケージ名      |
| FILE            | JAR パッケージのパス    |
| ALWAYS_NULLABLE | 結果が NULL になり得るかどうか |
| TYPE            | 関数の種類              |

## 必要な権限

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限      | オブジェクト | 備考                               |
|:----------|:-------------|:-----------------------------------|
| SHOW_PRIV | 関数         | この関数に対する表示権限が必要です |

## 使用例

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
