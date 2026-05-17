---
{
    "title": "Query Circuit Breaker",
    "language": "en",
    "description": "Apache Doris query circuit breaker mechanism, supporting SQL Block Rule (planning-time blocking) and Workload Policy (runtime circuit breaking) strategies to automatically terminate abnormal queries by limiting scan rows, partitions, execution time, memory, and more to ensure cluster stability."
}
---

Query circuit breaking is a protective mechanism used to prevent long-running or resource-consuming queries from having a negative impact on the system. When a query exceeds predefined resource or time limits, the circuit breaker mechanism automatically terminates the query to avoid adverse effects on system performance, resource usage, and other queries. This mechanism ensures the stability of the cluster in a multi-user environment, preventing a single query from exhausting system resources or slowing down responses, thereby improving overall availability and efficiency.

Doris provides two circuit breaker strategies that operate at different stages of the query lifecycle:

| Dimension | SQL Block Rule (Planning-time) | Workload Policy (Runtime) |
|-----------|-------------------------------|--------------------------|
| Effective Stage | Planning phase, blocked before execution | Execution phase, circuit broken during runtime |
| Judgment Basis | Estimated scan volume, SQL pattern matching | Real-time metrics such as execution time, memory usage, and scan volume |
| Accuracy | Based on cost estimation, may have false positives | Based on real-time monitoring, more accurate |
| Use Cases | Block known dangerous SQL patterns and full table scans | Circuit break unexpectedly large queries during execution |
| Applicable Statements | Any statement (DDL, DML) | select, insert into select, stream load, routine load |

## SQL Block Rule

SQL Block Rule is used to block statements that match specific patterns during the query planning phase. It is typically configured by database administrators (DBAs) to enhance cluster stability.

Each rule is defined by the following properties that control its behavior and scope:

| Property | Description | Values |
|----------|-------------|--------|
| `sql` | Regular expression to match query statements | Java regex string |
| `sqlHash` | Hash value to match query statements | SQL hash value string |
| `cardinality` | Maximum number of rows allowed to scan | Positive integer |
| `partition_num` | Maximum number of partitions allowed to scan | Positive integer |
| `tablet_num` | Maximum number of buckets allowed to scan | Positive integer |
| `global` | Whether the rule is global | `"true"` (applies to all users) or `"false"` (applies only to bound users) |
| `enable` | Whether the rule is enabled | `"true"` or `"false"` |

### Use Cases and Examples

#### Case 1: Limiting Scan Row Count

In daily use, blind full table scan operations often occur, such as `SELECT * FROM t`. Scanning data significantly consumes BE's IO and CPU resources, posing a substantial challenge to cluster stability. You can set an upper limit on the number of rows scanned by a single query on a single table to prevent such operations:

```sql
CREATE SQL_BLOCK_RULE rule_card 
PROPERTIES
(
   "cardinality" = "1000",
   "global" = "true",
   "enable" = "true"
);
```

When a single table scan exceeds 1000 rows, the query execution will be blocked.

#### Case 2: Limiting Scan Partition Count

Scanning too many partitions can significantly increase BE's CPU consumption. Additionally, if the query targets an external table, it may incur significant network overhead and metadata retrieval overhead. This is often caused by forgetting to write filtering conditions on partition columns or writing them incorrectly. You can set a partition count limit to avoid such issues:

```sql
CREATE SQL_BLOCK_RULE rule_part_num 
PROPERTIES
(
   "partition_num" = "30",
   "global" = "true",
   "enable" = "true"
);
```

When the number of partitions scanned for a single table exceeds 30, the query execution will be blocked.

#### Case 3: Limiting Scan Bucket Count

Scanning too many buckets can also significantly increase BE's CPU consumption. You can set a bucket count limit to avoid such issues:

```sql
CREATE SQL_BLOCK_RULE rule_teblet_num 
PROPERTIES
(
   "tablet_num" = "200",
   "global" = "true",
   "enable" = "true"
);
```

When the number of buckets scanned in a single table exceeds 200, the query execution will be blocked.

#### Case 4: Blocking Specific SQL Patterns

Certain query patterns may cause high computational complexity, long planning time, and other issues. You can block these queries using regular expression matching.

**Example 1: Blocking a specific function**

For example, to block the `abs` function:

```sql
CREATE SQL_BLOCK_RULE rule_abs
PROPERTIES(
  "sql"="(?i)abs\\s*\\(.+\\)",
  "global"="true",
  "enable"="true"
);
```

In the above regular expression:

- `(?i)` indicates case-insensitive matching
- `abs` is the target function to be blocked
- `\\s*` signifies that any amount of whitespace is allowed between `abs` and the left parenthesis
- `\\(.+\\)` matches the function parameters

**Example 2: Blocking other dangerous operations**

Similarly, you can use the same method to block `set global` to prevent unintended variable changes, or block `truncate table` to prevent unintended data deletions.

#### Case 5: Setting Rules for Specific Users

By default, block rules apply globally (`"global" = "true"`). To apply a rule only to specific users, you can create a user-level block rule:

1. Set `"global"` to `"false"` when creating the rule:

    ```sql
    CREATE SQL_BLOCK_RULE rule_001
    PROPERTIES (
      "sql"="select * from t",
      "global" = "false",
      "enable" = "true"
    )
    ```

2. Bind the rule to the target user:

    ```sql
    SET PROPERTY FOR 'root' 'SQL_block_rules' = 'rule_001';
    ```

3. Verify the rule is effective:

    ```sql
    MySQL root@127.0.0.1:test> select * from t;
    (1105, 'errCode = 2, detailMessage = errCode = 2, detailMessage = SQL match regex SQL block rule: rule_001')
    ```

- To add multiple rules for a user, list all rule names in the rule list, separated by commas.
- To remove all rules for a user, set the rule list to an empty string: `SET PROPERTY FOR 'root' 'SQL_block_rules' = '';`

To modify or delete block rules, refer to the SQL manual for block rules.

### Important Notes

- The calculation of scan row count, partition count, and bucket count is performed during the planning phase. Only partition and bucket pruning are considered, and other filtering conditions are not taken into account (i.e., the worst-case scenario is estimated). Therefore, queries with actual scan volumes below the set values may also be blocked.
- Regular expression matching is a computationally intensive operation. Too many or overly complex regex rules can put significant pressure on FE's CPU. Use them cautiously and avoid complex regular expressions unless necessary.
- To temporarily disable a rule, set its `"enable"` property to `"false"`.
- Regular expressions in block rules use Java's regular expression syntax. For the complete reference, see https://docs.oracle.com/javase/8/docs/api/java/util/regex/Pattern.html

## Workload Policy

SQL Block Rule performs circuit breaking during the planning phase, but since cost estimation during planning may be inaccurate (especially for complex queries), it can lead to rules not being effective or false positives. Workload Policy addresses this limitation by monitoring real-time metrics during query execution and circuit breaking queries whose runtime state does not meet expectations, preventing unexpectedly large queries from consuming excessive resources and affecting cluster stability.

Workload Policy has been supported since Doris version 2.1. The support status for each load type is as follows:

| Load Type          | Supported |
|--------------------|-----------|
| select             | Yes       |
| insert into select | Yes       |
| insert into values | No        |
| stream load        | Yes       |
| routine load       | Yes       |
| backup             | No        |
| compaction         | No        |

### Creation and Configuration

Use the `CREATE WORKLOAD POLICY` command to create a policy. Creating a Workload Policy requires `admin_priv` privileges.

The following example creates a policy named test_cancel_policy that cancels queries running longer than 1000 ms:

```sql
CREATE WORKLOAD POLICY test_cancel_policy
CONDITIONS(query_time > 1000)
ACTIONS(cancel_query) 
PROPERTIES('enabled'='true'); 
```

When creating a Workload Policy, three components must be specified:

#### Conditions

Conditions represent the policy trigger conditions. Multiple Conditions are separated by commas `,` to represent an "AND" relationship.

| Condition             | Description                                                                                          |
|-----------------------|------------------------------------------------------------------------------------------------------|
| username              | The username carried by the query; only triggers the set_session_variable Action in FE               |
| be_scan_rows          | Number of rows scanned by a SQL in a single BE process; cumulative value when executed concurrently   |
| be_scan_bytes         | Number of bytes scanned by a SQL in a single BE process; cumulative value when executed concurrently, in bytes |
| query_time            | Runtime of a SQL in a single BE process, in milliseconds                                             |
| query_be_memory_bytes | Memory usage of a SQL in a single BE process; cumulative value when executed concurrently, in bytes   |

#### Actions

Actions represent the action taken when the condition is triggered. Currently, a Policy can only define one Action (except for set_session_variable).

| Action               | Description                                                                                                     |
|----------------------|-----------------------------------------------------------------------------------------------------------------|
| cancel_query         | Cancel the query                                                                                                 |
| set_session_variable | Triggers a set session variable statement. A single Policy can have multiple set_session_variable options; currently only triggered in FE by the username Condition |

#### Properties

| Property       | Description                                                                                                         |
|----------------|---------------------------------------------------------------------------------------------------------------------|
| enabled        | Whether the policy is enabled; values are true or false, default is true                                             |
| priority       | Priority, an integer from 0 to 100, default is 0. Higher values mean higher priority; when a query matches multiple Policies, only the one with the highest priority takes effect |
| workload_group | The name of the bound Workload Group; when specified, the Policy only applies to queries from that Workload Group. Default is empty, meaning it applies to all queries |

#### Binding to a Workload Group

By default, Workload Policies apply to all supported queries. To specify that a Policy only targets a specific Workload Group, bind it through the `workload_group` property:

```sql
CREATE WORKLOAD POLICY test_cancel_big_query
CONDITIONS(query_time > 1000)
ACTIONS(cancel_query) 
PROPERTIES('workload_group'='normal')
```

### Usage Examples

#### Example 1: Circuit Breaking Timeout Queries

Below is an audit log of a successful run of ckbench's q29, showing that this SQL took 4.5s to complete:

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

Create a Policy that cancels queries running longer than 3 seconds:

```sql
CREATE WORKLOAD POLICY test_cancel_3s_query
CONDITIONS(query_time > 3000)
ACTIONS(cancel_query) 
```

Upon re-executing the SQL, you can see the query is circuit broken:

```sql
MySQL [hits]> SELECT REGEXP_REPLACE(Referer, '^https?://(?:www\\.)?([^/]+)/.*$', '\\1') AS k, AVG(length(Referer)) AS l, COUNT(*) AS c, MIN(Referer) FROM hits WHERE Referer <> '' GROUP BY k HAVING COUNT(*) > 100000 ORDER BY l DESC LIMIT 25;
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[CANCELLED]query cancelled by workload policy,id:12345
```

#### Example 2: Modifying User Session Variables

Workload Policy can automatically modify session variables for specific users, for example, adjusting concurrency parameters:

```sql
-- Log in to admin account and check concurrency parameters
MySQL [(none)]> show variables like '%parallel_fragment_exec_instance_num%';
+-------------------------------------+-------+---------------+---------+
| Variable_name                       | Value | Default_Value | Changed |
+-------------------------------------+-------+---------------+---------+
| parallel_fragment_exec_instance_num | 8     | 8             | 0       |
+-------------------------------------+-------+---------------+---------+
1 row in set (0.00 sec)

-- Create a Policy to modify the concurrency parameters of the admin account
CREATE WORKLOAD POLICY test_set_var_policy
CONDITIONS(username='admin')
ACTIONS(set_session_variable 'parallel_fragment_exec_instance_num=1') 

-- After some time, check the admin account's parameters again
MySQL [(none)]> show variables like '%parallel_fragment_exec_instance_num%';
+-------------------------------------+-------+---------------+---------+
| Variable_name                       | Value | Default_Value | Changed |
+-------------------------------------+-------+---------------+---------+
| parallel_fragment_exec_instance_num | 1     | 8             | 1       |
+-------------------------------------+-------+---------------+---------+
1 row in set (0.01 sec)
```

### Important Notes

- The Conditions and Actions of the same Policy must belong to the same side (FE or BE). For example, set_session_variable and cancel_query cannot be configured within the same Policy; Condition be_scan_rows and Condition username also cannot be configured within the same Policy.
- Policies are executed by asynchronous threads at fixed time intervals (currently 500 ms), so there is a certain latency in policy enforcement. Queries with very short run times may bypass the policy check.
- A single query may match multiple Policies, but only the Policy with the highest priority will take effect.
- Modifications to Actions and Conditions are currently not supported; they can only be modified by deleting and recreating them.
