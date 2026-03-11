---
{
  "title": "ALTER SQL_BLOCK_RULE",
  "description": "この文は、SQLブロックルールを変更するために使用されます。",
  "language": "ja"
}
---
## デスクリプション

このステートメントは、SQLブロックルールを変更するために使用されます。

## Syntax

```sql
ALTER SQL_BLOCK_RULE <rule_name>
PROPERTIES (
          -- property
          <property>
          -- Additional properties
          [ , ... ]
          ) 
```
## 必須パラメータ

**1. `<rule_name>`**

> ルールの名前。

**2. `<property>`**

詳細については、CREATE SQL_BLOCK_RULEの概要を参照してください。

## アクセス制御要件

このSQLコマンドを実行するユーザーは、最低限以下の権限を持っている必要があります：

| 権限 | オブジェクト | 備考 |
| ------------ | ------ | ----------- |
| ADMIN_PRIV | Global |             |

## 例

1. SQLを変更してルールを有効化する

  ```sql
  ALTER SQL_BLOCK_RULE test_rule PROPERTIES("sql"="select \\* from test_table","enable"="true")
  ```
