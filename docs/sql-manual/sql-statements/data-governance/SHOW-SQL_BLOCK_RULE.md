---
{
    "title": "SHOW SQL_BLOCK_RULE",
    "language": "en",
    "description": "Displays the configured SQL blocking rules. If no rule name is specified, all rules will be displayed."
}
---

## Description  
Displays the configured SQL blocking rules. If no rule name is specified, all rules will be displayed.  

## Syntax  
```sql
SHOW SQL_BLOCK_RULE [FOR <rule_name>];
```

## Optional Parameters  

`<rule_name>`

The name of the SQL blocking rule to display. If omitted, all rules will be shown. |

## Access Control Requirements  

Users executing this command must have the following privileges:  

| Privilege | Object        | Notes  |
|-----------|--------------|--------|
| `ADMIN`   | User or Role | Required to perform this operation. |

## Examples  

1. Display all SQL blocking rules  
```sql
SHOW SQL_BLOCK_RULE;
```

```text
+------------+----------------------------+---------+-------------+------------+-------------+--------+--------+
| Name       | Sql                        | SqlHash | PartitionNum | TabletNum  | Cardinality | Global | Enable |
+------------+----------------------------+---------+-------------+------------+-------------+--------+--------+
| test_rule  | select * from order_analysis | NULL    | 0           | 0          | 0           | true   | true   |
| test_rule2 | NULL                        | NULL    | 30          | 0          | 10000000000 | false  | true   |
+------------+----------------------------+---------+-------------+------------+-------------+--------+--------+
```

2. Display a specific SQL blocking rule  
```sql
SHOW SQL_BLOCK_RULE FOR test_rule2;
```

```text
+------------+------+---------+-------------+------------+-------------+--------+--------+
| Name       | Sql  | SqlHash | PartitionNum | TabletNum  | Cardinality | Global | Enable |
+------------+------+---------+-------------+------------+-------------+--------+--------+
| test_rule2 | NULL | NULL    | 30          | 0          | 10000000000 | false  | true   |
+------------+------+---------+-------------+------------+-------------+--------+--------+
```
