---
{
    "title": "ALTER-SQL-BLOCK-RULE",
    "language": "en"
}
---

## ALTER-SQL-BLOCK-RULE

### Name

ALTER SQL BLOCK RULE

### Description

Modify SQL blocking rules to allow modification of each item such as sql/sqlHash/partition_num/tablet_num/cardinality/global/enable.

grammar:

```sql
ALTER SQL_BLOCK_RULE rule_name
[PROPERTIES ("key"="value", ...)];
```

illustrate:

- sql and sqlHash cannot be set at the same time. This means that if a rule sets sql or sqlHash, the other attribute cannot be modified;
- sql/sqlHash and partition_num/tablet_num/cardinality cannot be set at the same time. For example, if a rule sets partition_num, then sql or sqlHash cannot be modified;

### Example

1. Modify according to SQL properties

```sql
ALTER SQL_BLOCK_RULE test_rule PROPERTIES("sql"="select \\* from test_table","enable"="true")
```

2. If a rule sets partition_num, then sql or sqlHash cannot be modified

```sql
ALTER SQL_BLOCK_RULE test_rule2 PROPERTIES("partition_num" = "10","tablet_num"="300","enable"="true")
```

### Keywords

```text
ALTER,SQL_BLOCK_RULE
```

### Best Practice
