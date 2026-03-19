---
{
  "title": "DROP-TABLE",
  "description": "この文は table を削除するために使用されます。",
  "language": "ja"
}
---
## デスクリプション

このステートメントはtableを削除するために使用されます。

## Syntax

```sql
DROP [TEMPORARY] TABLE [IF EXISTS] [<db_name>.]<table_name> [FORCE];
```
## 必須パラメータ
**1.`<table_name>`**
> Table識別子（名前）を指定します。これは、そのTableが配置されているデータベース内で一意である必要があります。
>
> 識別子は英字（またはunicodeの名前サポートが有効になっている場合は任意の言語の文字）で始まる必要があり、識別子文字列全体がバッククォートで囲まれていない限り（例：`My Object`）、スペースや特殊文字を含めることはできません。
>
> 識別子は予約キーワードを使用することはできません。
>
> 詳細については、Identifier RequirementsおよびReserved Keywordsを参照してください。

## オプションパラメータ

**1. `TEMPORARY` **
> 指定した場合、ステートメントはTEMPORARYTableのみを削除します。

**2. `IF EXISTS`**
> 指定した場合、存在しないTableに対してエラーが発生しません。

**3.`<db_name>`**
> データベースの識別子（名前）を指定します。
>
> 識別子は英字（またはunicodeの名前サポートが有効になっている場合は指定された言語の任意の文字）で始まる必要があり、識別子文字列全体がバッククォートで囲まれていない限り（例：`My Database`）、スペースや特殊文字を含めることはできません。
>
> 識別子は予約キーワードを使用することはできません。
>
> 詳細については、Identifier RequirementsおよびReserved Keywordsを参照してください。

**4.`FORCE`**
> 指定した場合、システムはTableに未完了のトランザクションがあるかどうかをチェックしません。Tableは直接削除され、復旧することはできません。この操作は一般的に推奨されません。

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持っている必要があります：


| Privilege       | Object    | 注釈                      |
|:----------------|:----------|:---------------------------|
| Drop_priv       | Table     | DROP TABLEはTableのDROP操作に属します |

## 使用上の注意

- `DROP TABLE`を実行してから一定期間後、削除されたTableはRECOVERステートメントを使用して復元できます。詳細については、[RECOVER](../../recycle/RECOVER)ステートメントを参照してください。
- `DROP TABLE FORCE`を実行した場合、システムはTableに未完了のトランザクションがあるかどうかをチェックしません。Tableは直接削除され、復元することはできません。一般的に、この操作は推奨されません。

## 例

1. Tableの削除

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
