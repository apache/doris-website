---
{
    "title": "CREATE-SQL-BLOCK-RULE",
    "language": "en"
}
---

## CREATE-SQL-BLOCK-RULE

### Name

CREATE SQL BLOCK RULE

### Description

This statement creates a SQL blocking rule, which is only used to restrict query statements, not to restrict the execution of explian statements.

Supports configuring SQL blacklists by user:

- Refuse to specify SQL by regular matching
- Check if a query reaches one of these limits by setting partition_num, tablet_num, cardinality
  - partition_num, tablet_num, cardinality can be set together, once a query reaches one of these limits, the query will be intercepted

grammar:

```sql
CREATE SQL_BLOCK_RULE rule_name
[PROPERTIES ("key"="value", ...)];
```

Parameter Description:

- sql: matching rule (based on regular matching, special characters need to be translated,for example`select *`use`select \\*`), optional, the default value is "NULL"
- sqlHash: sql hash value, used for exact matching, we will print this value in `fe.audit.log`, optional, this parameter and sql can only be selected one, the default value is "NULL"
- partition_num: the maximum number of partitions a scan node will scan, the default value is 0L
- tablet_num: The maximum number of tablets that a scanning node will scan, the default value is 0L
- cardinality: the rough scan line number of a scan node, the default value is 0L
- global: Whether to take effect globally (all users), the default is false
- enable: whether to enable blocking rules, the default is true

### Example

1. Create a block rule named test_rule

    ```sql
    CREATE SQL_BLOCK_RULE test_rule
    PROPERTIES(
    "sql"="select \\* from order_analysis",
    "global"="false",
    "enable"="true"
    );
    ```

    >Notes:
    >
    >That the sql statement here does not end with a semicolon
    
    When we execute the sql we just defined in the rule, an exception error will be returned. The example is as follows:
    
    ```sql
    select * from order_analysis;
    ERROR 1064 (HY000): errCode = 2, detailMessage = sql match regex sql block rule: order_analysis_rule
    ```


2. Create test_rule2, limit the maximum number of scanned partitions to 30, and limit the maximum scan base to 10 billion rows. The example is as follows:

   ```sql
    CREATE SQL_BLOCK_RULE test_rule2
    PROPERTIES (
    "partition_num" = "30",
    "cardinality" = "10000000000",
    "global" = "false",
    "enable" = "true"
    );
   ```
3. Create SQL BLOCK RULE with special chars

    ```sql
    CREATE SQL_BLOCK_RULE test_rule3
    PROPERTIES
    ( 
    "sql" = "select count\\(1\\) from db1.tbl1"
    );
    CREATE SQL_BLOCK_RULE test_rule4
    PROPERTIES
    ( 
    "sql" = "select \\* from db1.tbl1"
    );
    ```

### Keywords

```text
CREATE, SQL_BLCOK_RULE
```

### Best Practice

