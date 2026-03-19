---
{
  "title": "DROP TABLE",
  "language": "ja",
  "description": "このステートメントはtableを削除するために使用されます。"
}
---
## 説明

このステートメントはtableを削除するために使用されます。
## 構文

```sql
DROP TABLE [IF EXISTS] [<db_name>.]<table_name> [FORCE];
```
## 必須パラメータ
**1.`<table_name>`**
> テーブル識別子（名前）を指定します。これは、そのテーブルが配置されているデータベース内で一意である必要があります。
>
> 識別子は、アルファベット文字（またはunicode name supportが有効な場合は任意の言語の文字）で始まる必要があり、識別子文字列全体がバッククォートで囲まれていない限り（例：`My Object`）、スペースや特殊文字を含めることはできません。
>
> 識別子は予約キーワードを使用することはできません。
>
> 詳細については、Identifier RequirementsとReserved Keywordsを参照してください。

## オプションパラメータ

**1.`<db_name>`**
> データベースの識別子（名前）を指定します。
>
> 識別子は、アルファベット文字（またはunicode name supportが有効な場合は指定された言語の任意の文字）で始まる必要があり、識別子文字列全体がバッククォートで囲まれていない限り（例：`My Database`）、スペースや特殊文字を含めることはできません。
>
> 識別子は予約キーワードを使用することはできません。
>
> 詳細については、Identifier RequirementsとReserved Keywordsを参照してください。

**2.`FORCE`**
> 指定された場合、システムはテーブルに未完了のトランザクションがあるかどうかをチェックしません。テーブルは直接削除され、復旧することはできません。この操作は一般的に推奨されません。

## アクセス制御要件

このSQLコマンドを実行するユーザーは、最低でも以下の権限を持っている必要があります：


| Privilege       | Object    | Notes                      |
|:----------------|:----------|:---------------------------|
| Drop_priv       | Table     | DROP TABLEはテーブルのDROP操作に属します |

## 使用上の注意

- `DROP TABLE`を実行してから一定期間後、削除されたテーブルはRECOVER文を使用して復元できます。詳細については、[RECOVER](../../recycle/RECOVER)文を参照してください。
- `DROP TABLE FORCE`を実行した場合、システムはテーブルに対して未完了のトランザクションがあるかどうかをチェックしません。テーブルは直接削除され、復元することはできません。一般的に、この操作は推奨されません。

## 例

1. テーブルの削除

    ```sql
    DROP TABLE my_table;
    ```
2. 存在する場合は、指定されたDatabaseのTableを削除します。

    ```sql
    DROP TABLE IF EXISTS example_db.my_table;
    ```
3. 存在する場合は、指定されたDatabaseのTableを削除し、強制的に削除する

    ```sql
    DROP TABLE IF EXISTS example_db.my_table FORCE;
    ```
