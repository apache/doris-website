---
{
  "title": "ALTER SQL_BLOCK_RULE",
  "language": "ja",
  "description": "このステートメントはSQLブロックルールを変更するために使用されます。"
}
---
## 説明

このステートメントはSQLブロックルールを変更するために使用されます。

## 構文

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

詳細については、[CREATE SQL_BLOCK_RULE](../data-governance/CREATE-SQL_BLOCK_RULE.md)の説明を参照してください。

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持っている必要があります：

| 権限   | オブジェクト | 備考 |
| ------------ | ------ | ----------- |
| ADMIN_PRIV | Global |             |

## 例

1. SQLを変更してルールを有効化する

  ```sql
  ALTER SQL_BLOCK_RULE test_rule PROPERTIES("sql"="select \\* from test_table","enable"="true")
  ```
