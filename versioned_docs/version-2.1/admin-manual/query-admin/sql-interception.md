---
{
    "title": "SQL Interception",
    "language": "en"
}
---

<!-- 
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

This feature is used to restrict the execution of SQL statements (both DDL and DML can be restricted).

Supports per-user configuration of SQL interception rules, such as using regular expressions to match and intercept SQL, or using supported rules for interception.

## Creating and Managing Rules

### Creating Rules

For more syntax on creating rules, please refer to [CREATE SQL BLOCK RULE](../../sql-manual/sql-statements/data-governance/CREATE-SQL_BLOCK_RULE).

- `sql`: Matching rule (based on regular expression matching, special characters need to be escaped), optional, default value is "NULL".
- `sqlHash`: SQL hash value for exact matching. This value will be printed in `fe.audit.log`, optional. This parameter and SQL are mutually exclusive, default value is "NULL".
- `partition_num`: Maximum number of partitions a scan node will scan, default value is 0L.
- `tablet_num`: Maximum number of tablets a scan node will scan, default value is 0L.
- `cardinality`: Rough number of rows scanned by a scan node, default value is 0L.
- `global`: Whether it is globally effective (for all users), default is false.
- `enable`: Whether to enable the blocking rule, default is true.

Example:

```sql
CREATE SQL_BLOCK_RULE test_rule1 
PROPERTIES(
  "sql"="select \\* from order_analysis",
  "global"="false",
  "enable"="true",
  "sqlHash"=""
);

CREATE SQL_BLOCK_RULE test_rule2
PROPERTIES(
	"partition_num" = "30",
	"cardinality"="10000000000",
	"global"="false",
	"enable"="true"
)
```

:::note
Note: Do not include a semicolon at the end of the SQL statement.
:::

Starting from version 2.1.6, SQL interception rules support external tables (tables in the External Catalog).

- `sql`: Same as for internal tables.
- `sqlHash`: Same as for internal tables.
- `partition_num`: Same as for internal tables.
- `tablet_num`: Limits the number of shards scanned for external tables. Different data sources have different definitions of shards. For example, file shards in Hive tables, incremental data shards in Hudi tables, etc.
- `cardinality`: Same as for internal tables, limits the number of scanned rows. This parameter only takes effect when there are row count statistics for external tables (such as collected manually or automatically).

### Binding Rules

Rules with `global` set to `true` are globally effective and do not need to be bound to specific users.

Rules with `global` set to `false` need to be bound to specific users. A user can be bound to multiple rules, and multiple rules are separated by `,`.

```sql
SET PROPERTY [FOR 'jack'] 'sql_block_rules' = 'test_rule1,test_rule2'
```

### Viewing Rules

- View the configured SQL blocking rules.

If no rule name is specified, all rules will be viewed. For specific syntax, please refer to [SHOW SQL BLOCK RULE](../../sql-manual/sql-statements/data-governance/SHOW-SQL_BLOCK_RULE)

```sql
SHOW SQL_BLOCK_RULE [FOR RULE_NAME]
```

- View rules bound to a user

```sql
SHOW PROPERTY FOR user_name;
```

### Modifying Rules

Allow modifications to each item such as sql/sqlHash/partition_num/tablet_num/cardinality/global/enable. For specific syntax, please refer to [ALTER SQL BLOCK RULE](../../sql-manual/sql-statements/data-governance/ALTER-SQL_BLOCK_RULE)

- `sql` and `sqlHash` cannot be set simultaneously.

If a rule sets `sql` or `sqlHash`, the other property cannot be modified.

- `sql`/`sqlHash` and `partition_num`/`tablet_num`/`cardinality` cannot be set simultaneously

For example, if a rule sets `partition_num`, then `sql` or `sqlHash` cannot be modified.

```sql
ALTER SQL_BLOCK_RULE test_rule PROPERTIES("sql"="select \\* from test_table","enable"="true")
```

```sql
ALTER SQL_BLOCK_RULE test_rule2 PROPERTIES("partition_num" = "10","tablet_num"="300","enable"="true")
```

### Deleting Rules

Support deleting multiple rules simultaneously, separated by `,`. For specific syntax, please refer to [DROP SQL BLOCK RULE](../../sql-manual/sql-statements/data-governance/DROP-SQL_BLOCK_RULE)

```
DROP SQL_BLOCK_RULE test_rule1,test_rule2
```

## Triggering Rules

When we execute the SQL defined in the rules, an exception error will be returned, as shown below:

```sql
mysql> select * from order_analysis;
ERROR 1064 (HY000): errCode = 2, detailMessage = sql match regex sql block rule: order_analysis_rule
```
