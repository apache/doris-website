---
{
    "title": "Query Circuit Breaking: SQL Block Rule and Workload Policy Configuration Guide",
    "sidebar_label": "Query Circuit Breaking",
    "language": "en",
    "description": "Learn how to use SQL Block Rule and Workload Policy to block full table scans, limit query resource consumption, and prevent abnormal large queries from overwhelming the cluster.",
    "keywords": ["query circuit breaking", "SQL Block Rule", "Workload Policy", "full table scan limit", "large query governance", "cluster stability"]
}
---

<!-- Knowledge type: concept + procedure -->

Query circuit breaking is a protection mechanism that prevents long-running or resource-intensive queries from affecting cluster stability. When a query exceeds preset resource or time limits, the circuit breaker automatically terminates it, preventing a single query from exhausting system resources or slowing down other workloads.

Doris provides two circuit breaking strategies that act at different stages of the query lifecycle:

| Dimension | SQL Block Rule (planning-time breaking) | Workload Policy (runtime breaking) |
|---------|--------------------------|---------------------------|
| Effective stage | Query planning stage, intercepted before execution | Query execution stage, broken during runtime |
| Decision basis | Estimated scan volume, SQL pattern matching | Real-time metrics such as actual execution time, memory usage, scan volume |
| Accuracy | Based on cost estimation, may produce false positives | Based on real-time monitoring, more accurate |
| Use case | Block known dangerous SQL patterns and full table scans | Break runtime queries that exceed expectations |
| Supported statements | Any statement (DDL, DML) | select, insert into select, stream load, routine load |

## SQL Block Rule

<!-- Knowledge type: concept -->

SQL Block Rule intercepts statements matching specific patterns at the **planning stage**, preventing them from entering the execution stage. It is usually configured by DBAs to prevent known risky operations such as full table scans and dangerous function calls.

### Rule Properties

Each rule is defined by the following properties that determine its behavior and scope:

| Property | Description | Value |
|------|------|------|
| `sql` | Regular expression that matches the query statement | Java regular expression string |
| `sqlHash` | Hash value that matches the query statement | SQL hash value string |
| `cardinality` | Maximum number of rows allowed to scan | Positive integer |
| `partition_num` | Maximum number of partitions allowed to scan | Positive integer |
| `tablet_num` | Maximum number of tablets allowed to scan | Positive integer |
| `global` | Whether the rule is global | `"true"` (global) / `"false"` (only applies to bound users) |
| `enable` | Whether the rule is enabled | `"true"` / `"false"` |

### Use Cases and Examples

<!-- Knowledge type: procedure -->

#### Scenario 1: Limit the Number of Scanned Rows

**Problem**: Full table scan operations such as `SELECT * FROM t` consume large amounts of BE IO and CPU resources.

**Solution**: Set an upper limit on the number of rows scanned from a single table. Queries that exceed the threshold are blocked.

```sql
CREATE SQL_BLOCK_RULE rule_card 
PROPERTIES
(
    "cardinality" = "1000",
    "global" = "true",
    "enable" = "true"
);
```

When a single-table scan exceeds 1000 rows, the query is rejected.

#### Scenario 2: Limit the Number of Scanned Partitions

**Problem**: Scanning too many partitions significantly increases BE CPU consumption. When querying external tables, it also adds extra network overhead and metadata fetching overhead, usually caused by missing or incorrectly written partition filter conditions.

**Solution**: Set the maximum number of partitions that a single query can scan.

```sql
CREATE SQL_BLOCK_RULE rule_part_num 
PROPERTIES
(
    "partition_num" = "30",
    "global" = "true",
    "enable" = "true"
);
```

When a single-table scan exceeds 30 partitions, the query is rejected.

#### Scenario 3: Limit the Number of Scanned Tablets

**Problem**: Scanning too many tablets also significantly increases BE CPU consumption.

**Solution**: Set the maximum number of tablets that a single query can scan.

```sql
CREATE SQL_BLOCK_RULE rule_tablet_num 
PROPERTIES
(
    "tablet_num" = "200",
    "global" = "true",
    "enable" = "true"
);
```

When a single-table scan exceeds 200 tablets, the query is rejected.

#### Scenario 4: Block Specific SQL Patterns

**Problem**: Certain query patterns (such as calling specific functions or performing dangerous operations) may cause excessive computational complexity or long planning time.

**Solution**: Block such queries by matching with regular expressions.

**Example 1: Block the use of a specific function**

The following rule blocks all queries that contain the `abs` function:

```sql
CREATE SQL_BLOCK_RULE rule_abs
PROPERTIES(
    "sql"="(?i)abs\\s*\\(.+\\)",
    "global"="true",
    "enable"="true"
);
```

Regex explanation:

- `(?i)`: case-insensitive matching
- `abs`: target function name
- `\\s*`: allows any whitespace between the function name and the left parenthesis
- `\\(.+\\)`: matches the function arguments

**Example 2: Block dangerous operations**

Similarly, you can use regular expressions to block `set global` (to prevent unintended variable modification) or `truncate table` (to prevent unintended data deletion).

> Regular expressions follow Java conventions. See the [Pattern documentation](https://docs.oracle.com/javase/8/docs/api/java/util/regex/Pattern.html) for details.

#### Scenario 5: Set Rules for Specific Users

**Problem**: Default rules apply globally, but in some cases the restriction should only apply to specific users.

**Solution**: Create a non-global rule and bind it to the target user.

1. Set `global` to `"false"` when creating the rule:

    ```sql
    CREATE SQL_BLOCK_RULE rule_001
    PROPERTIES (
        "sql"="select \\* from t",
        "global" = "false",
        "enable" = "true"
    );
    ```

2. Bind the rule to the target user:

    ```sql
    SET PROPERTY FOR 'root' 'SQL_block_rules' = 'rule_001';
    ```

3. Verify that the rule is in effect:

    ```sql
    MySQL root@127.0.0.1:test> select * from t;
    (1105, 'errCode = 2, detailMessage = errCode = 2, detailMessage = SQL match regex SQL block rule: rule_001')
    ```

**Managing multiple rules**:

- To bind multiple rules to a user: separate all rule names in the rule list with commas, for example `'rule_001,rule_002'`.
- To remove all rules from a user: set the rule list to an empty string, for example `SET PROPERTY FOR 'root' 'SQL_block_rules' = '';`.

### Notes

- **Estimation method**: The number of scanned rows, partitions, and tablets is estimated at the planning stage based on the worst case (only partition pruning and tablet pruning are considered; other filter conditions are not). Queries whose actual scan volume is less than the configured value may also be blocked.
- **Performance impact**: Regex matching is a compute-intensive operation. Too many or overly complex regex rules put significant pressure on FE CPU, so add them carefully.
- **Temporarily disable a rule**: Change the `"enable"` property of the rule to `"false"` to disable it temporarily without deleting the rule.

## Workload Policy

<!-- Knowledge type: concept -->

Workload Policy monitors real-time metrics during query **runtime** and applies actions such as circuit breaking or variable adjustment to queries that exceed expectations. Compared with the static planning-time estimation of SQL Block Rule, Workload Policy bases its decisions on actual runtime data and is more accurate.

Workload Policy is supported starting from Doris 2.1. The support status for each workload type is as follows:

| Workload type | Supported |
|---------|---------|
| select | Yes |
| insert into select | Yes |
| insert into values | No |
| stream load | Yes |
| routine load | Yes |
| backup | No |
| compaction | No |

### Creation and Configuration

<!-- Knowledge type: procedure -->

Use the `CREATE WORKLOAD POLICY` command to create a policy. The `admin_priv` privilege is required.

**Basic syntax**:

```sql
CREATE WORKLOAD POLICY <policy_name>
CONDITIONS(<condition_expr>)
ACTIONS(<action_expr>) 
PROPERTIES('<key>'='<value>');
```

The following example creates a policy that cancels queries running longer than 1000 ms:

```sql
CREATE WORKLOAD POLICY test_cancel_policy
CONDITIONS(query_time > 1000)
ACTIONS(cancel_query) 
PROPERTIES('enabled'='true'); 
```

#### Trigger Conditions

Conditions specify when the policy is triggered. Multiple conditions are separated by commas (`,`), which means an "AND" relationship.

| Condition | Description |
|-----------|------|
| `username` | The username carried by the query. Only triggers the `set_session_variable` Action on the FE |
| `be_scan_rows` | The number of rows scanned by a SQL within a single BE process. Cumulative value under concurrent execution |
| `be_scan_bytes` | The number of bytes scanned by a SQL within a single BE process. Cumulative value under concurrent execution (unit: bytes) |
| `query_time` | The execution time of a SQL on a single BE process (unit: milliseconds) |
| `query_be_memory_bytes` | The memory used by a SQL within a single BE process. Cumulative value under concurrent execution (unit: bytes) |

#### Actions

Actions specify what to do when the conditions are triggered. Currently, a Policy can define only one Action (except for `set_session_variable`).

| Action | Description |
|--------|------|
| `cancel_query` | Cancel the query |
| `set_session_variable` | Execute a set session variable statement. The same Policy can include multiple of these options. Currently, this is only triggered on the FE by the `username` Condition |

#### Policy Properties

| Property | Description | Default |
|----------|------|--------|
| `enabled` | Whether the policy is enabled. Value is `true` or `false` | `true` |
| `priority` | Priority, in the range 0 to 100. A larger value means higher priority. When multiple Policies match, only the one with the highest priority takes effect | `0` |
| `workload_group` | The name of the bound Workload Group. When specified, the Policy applies only to queries in that Workload Group. When empty, it applies to all queries | Empty (global) |

#### Binding to a Workload Group

To restrict a policy to a specific Workload Group, bind it through the `workload_group` property:

```sql
CREATE WORKLOAD POLICY test_cancel_big_query
CONDITIONS(query_time > 1000)
ACTIONS(cancel_query) 
PROPERTIES('workload_group'='normal');
```

### Examples

<!-- Knowledge type: procedure -->

#### Example 1: Break Long-Running Queries

The following audit log shows that a SQL normally takes 4.5 seconds to execute:

```sql
MySQL [hits]> SELECT REGEXP_REPLACE(Referer, '^https?://(?:www\\.)?([^/]+)/.*$', '\\1') AS k, AVG(length(Referer)) AS l, COUNT(*) AS c, MIN(Referer) FROM hits WHERE Referer <> '' GROUP BY k HAVING COUNT(*) > 100000 ORDER BY l DESC LIMIT 25;
+-----------------------------------------------------------------------+------------------+----------+---------------------------------------------------------------------------------------------------------------------+
| k                                                                     | l                | c        | min(Referer)                                                                                                        |
+-----------------------------------------------------------------------+------------------+----------+---------------------------------------------------------------------------------------------------------------------+
| 1                                                                     | 85.4611926713085 | 67259319 | http://%26ad%3D1%25EA%25D0%26utm_source=web&cd=19590&input_onlist/би-2 место будущей кондицин                       |
| http:%2F%2Fwwww.regnancies/search&evL8gE&where=all&filmId=bEmYZc_WTDE |               69 |   207347 | http:%2F%2Fwwww.regnancies/search&evL8gE&where=all&filmId=bEmYZc_WTDE                                               |
| http://новострашная                                                   |               31 |   740277 | http://новострашная                                                                                                 |
| http://loveche.html?ctid                                              |               24 |   144901 | http://loveche.html?ctid                                                                                            |
| http://rukodeliveresult                                               |               23 |   226135 | http://rukodeliveresult                                                                                             |
| http://holodilnik.ru                                                  |               20 |   133893 | http://holodilnik.ru                                                                                                |
| http://smeshariki.ru                                                  |               20 |   210736 | http://smeshariki.ru                                                                                                |
| http:%2F%2Fviewtopic                                                  |               20 |   391115 | http:%2F%2Fviewtopic                                                                                                |
| http:%2F%2Fwwww.ukr                                                   |               19 |   655178 | http:%2F%2Fwwww.ukr                                                                                                 |
| http:%2F%2FviewType                                                   |               19 |   148907 | http:%2F%2FviewType                                                                                                 |
| http://state=2008                                                     |               17 |   139630 | http://state=2008                                                                                                   |
+-----------------------------------------------------------------------+------------------+----------+---------------------------------------------------------------------------------------------------------------------+
11 rows in set (4.50 sec)
```

Create a policy that cancels any query running longer than 3 seconds:

```sql
CREATE WORKLOAD POLICY test_cancel_3s_query
CONDITIONS(query_time > 3000)
ACTIONS(cancel_query); 
```

Run the same SQL again, and the query is broken:

```sql
MySQL [hits]> SELECT REGEXP_REPLACE(Referer, '^https?://(?:www\\.)?([^/]+)/.*$', '\\1') AS k, AVG(length(Referer)) AS l, COUNT(*) AS c, MIN(Referer) FROM hits WHERE Referer <> '' GROUP BY k HAVING COUNT(*) > 100000 ORDER BY l DESC LIMIT 25;
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[CANCELLED]query cancelled by workload policy,id:12345
```

#### Example 2: Automatically Adjust User Session Variables

Workload Policy can automatically modify session variables for a specific user, for example, lowering concurrency to reduce resource consumption:

```sql
-- Check the current concurrency parameter for the admin user
MySQL [(none)]> show variables like '%parallel_fragment_exec_instance_num%';
+-------------------------------------+-------+---------------+---------+
| Variable_name                       | Value | Default_Value | Changed |
+-------------------------------------+-------+---------------+---------+
| parallel_fragment_exec_instance_num | 8     | 8             | 0       |
+-------------------------------------+-------+---------------+---------+
1 row in set (0.00 sec)

-- Create a policy: set the concurrency parameter for the admin user to 1
CREATE WORKLOAD POLICY test_set_var_policy
CONDITIONS(username='admin')
ACTIONS(set_session_variable 'parallel_fragment_exec_instance_num=1');

-- Check again later, the parameter has taken effect
MySQL [(none)]> show variables like '%parallel_fragment_exec_instance_num%';
+-------------------------------------+-------+---------------+---------+
| Variable_name                       | Value | Default_Value | Changed |
+-------------------------------------+-------+---------------+---------+
| parallel_fragment_exec_instance_num | 1     | 8             | 1       |
+-------------------------------------+-------+---------------+---------+
1 row in set (0.01 sec)
```

### Notes

- **FE/BE side isolation**: The Condition and Action of the same Policy must belong to the same side (FE or BE). For example, `set_session_variable` (FE side) and `cancel_query` (BE side) cannot be configured in the same Policy. The same applies to `username` (FE side) and `be_scan_rows` (BE side).
- **Asynchronous execution latency**: Policies are checked by an asynchronous thread every 500 ms, so policy enforcement has some lag. Queries that run for a very short time may complete before the check is triggered and bypass the policy.
- **Priority mechanism**: A query may match multiple Policies, but only the one with the highest priority (largest `priority` value) takes effect.
- **Modification limit**: Currently, directly modifying the Action and Condition of an existing Policy is not supported. Delete the Policy and recreate it.
