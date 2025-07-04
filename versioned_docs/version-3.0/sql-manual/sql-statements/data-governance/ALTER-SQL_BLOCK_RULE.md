---
{
    "title": "ALTER SQL_BLOCK_RULE",
    "language": "en"
}
---

## Description

This statement is used to modify an SQL block rule.

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

## Required Parameters

**1. `<rule_name>`**

> The name of the rule.

**2. `<property>`**

See the introduction of [CREATE SQL_BLOCK_RULE](../data-governance/CREATE-SQL_BLOCK_RULE.md) for details.

## Access Control Requirements

The user executing this SQL command must have at least the following permissions:

| Privilege   | Object | Notes |
| ------------ | ------ | ----------- |
| ADMIN_PRIV | Global |             |

## Example

1. Modify the SQL and enable the rule


  ```sql
  ALTER SQL_BLOCK_RULE test_rule PROPERTIES("sql"="select \\* from test_table","enable"="true")
  ```