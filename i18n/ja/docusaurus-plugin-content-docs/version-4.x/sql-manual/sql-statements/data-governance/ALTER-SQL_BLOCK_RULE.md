---
{
    "title": "ALTER SQL_BLOCK_RULE",
    "language": "ja",
    "description": "このステートメントは SQL ブロックルールを変更するために使用します。"
}
---

## 説明

このステートメントは SQL ブロックルールを変更するために使用します。

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

詳細は [CREATE SQL_BLOCK_RULE](../data-governance/CREATE-SQL_BLOCK_RULE.md) の説明を参照してください。

## 必要な権限

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限   | 対象 | 備考 |
| ------------ | ------ | ----------- |
| ADMIN_PRIV | グローバル |             |

## 例

1. SQL を変更し、ルールを有効にします。


  ```sql
  ALTER SQL_BLOCK_RULE test_rule PROPERTIES("sql"="select \\* from test_table","enable"="true")
  ```
