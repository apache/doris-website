---
{
  "title": "TRUNCATE TABLE",
  "description": "この文は、指定されたtableとパーティションのデータをクリアするために使用されます。",
  "language": "ja"
}
---
## 説明

このステートメントは、指定されたtableとパーティションのデータを削除するために使用されます。

## 構文

```sql
TRUNCATE TABLE [<db_name>.]<table_name>[ PARTITION ( <partition_name1> [, <partition_name2> ... ] ) ];
```
## 必須パラメータ

**1.`<db_name>`**
> データベースの識別子（名前）を指定します。
>
> 識別子は英字で始める必要があり（unicode name supportが有効な場合は指定された言語の任意の文字）、識別子文字列全体がバッククォートで囲まれていない限り（例：`My Database`）、スペースや特殊文字を含めることはできません。
>
> 識別子は予約済みキーワードを使用できません。
>
> 詳細については、Identifier Requirements and Reserved Keywordsを参照してください。

**2.`<table_name>`**
> Table識別子（名前）を指定します。これは、配置されるデータベース内で一意である必要があります。
>
> 識別子は英字で始める必要があり（unicode name supportが有効な場合は言語の任意の文字）、識別子文字列全体がバッククォートで囲まれていない限り（例：`My Object`）、スペースや特殊文字を含めることはできません。
>
> 識別子は予約済みキーワードを使用できません。
>
> 詳細については、Identifier Requirements and Reserved Keywordsを参照してください。

## オプションパラメータ
**1.`<partition_name>`**
> パーティションの識別子（名前）を指定します。
>
> 識別子は英字で始める必要があり（unicode name supportが有効な場合はスクリプトの任意の文字）、識別子文字列全体がバッククォートで囲まれていない限り（例：`My Object`）、スペースや特殊文字を含めることはできません。
>
> 識別子は予約済みキーワードを使用できません。
>
> 詳細については、Identifier Requirements and Reserved Keywordsを参照してください。


## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持つ必要があります：


| Privilege       | Object    | 注釈                      |
|:----------------|:----------|:---------------------------|
| Drop_priv       | Table     | TRUNCATE TABLEはTableのDROP操作に属します |

## 使用上の注意

- この文はデータをクリアしますが、Tableまたはパーティションは保持されます。
- DELETEとは異なり、この文は指定されたTableまたはパーティション全体のみをクリアでき、フィルタリング条件を追加することはできません。
- DELETEとは異なり、この方法でデータをクリアしてもクエリパフォーマンスに影響しません。
- この操作により削除されたデータは回復できません。
- このコマンドを使用する場合、TableのステータスはNORMALである必要があります。つまり、SCHEMA CHANGEなどの操作は許可されません。
- このコマンドにより、進行中のインポートが失敗する可能性があります。

## 例

1. example_db下のTabletblをクリア

    ```sql
    TRUNCATE TABLE example_db.tbl;
    ```
2. Table tbl の p1 および p2 パーティションをクリアする

    ```sql
    TRUNCATE TABLE tbl PARTITION(p1, p2);
    ```
