---
{
    "title": "ALTER-SQL-BLOCK-RULE",
    "language": "zh-CN"
}
---

## ALTER-SQL-BLOCK-RULE

### Name

ALTER SQL BLOCK RULE

## 描述

修改SQL阻止规则，允许对sql/sqlHash/partition_num/tablet_num/cardinality/global/enable等每一项进行修改。

语法：

```sql
ALTER SQL_BLOCK_RULE rule_name 
[PROPERTIES ("key"="value", ...)];
```

说明：

- sql 和 sqlHash 不能同时被设置。这意味着，如果一个rule设置了sql或者sqlHash，则另一个属性将无法被修改；
- sql/sqlHash 和 partition_num/tablet_num/cardinality 不能同时被设置。举个例子，如果一个rule设置了partition_num，那么sql或者sqlHash将无法被修改；

## 举例

1. 根据SQL属性进行修改

```sql
ALTER SQL_BLOCK_RULE test_rule PROPERTIES("sql"="select \\* from test_table","enable"="true")
```

2. 如果一个rule设置了partition_num，那么sql或者sqlHash将无法被修改

```sql
ALTER SQL_BLOCK_RULE test_rule2 PROPERTIES("partition_num" = "10","tablet_num"="300","enable"="true")
```

### Keywords

```text
ALTER,SQL_BLOCK_RULE
```

### Best Practice
