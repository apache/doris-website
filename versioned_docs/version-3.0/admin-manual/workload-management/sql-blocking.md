---
{
"title": "Query Circuit Breaker",
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

Query circuit breaking is a protective mechanism used to prevent long-running or resource-consuming queries from having a negative impact on the system. When a query exceeds predefined resource or time limits, the circuit breaker mechanism automatically terminates the query to avoid adverse effects on system performance, resource usage, and other queries. This mechanism ensures the stability of the cluster in a multi-user environment, preventing a single query from exhausting system resources or slowing down responses, thereby improving overall availability and efficiency.

In Doris, there are two types of circuit breaker strategies:

- **Planning-time circuit breaking**, namely **SQL Block Rule**, which is used to prevent the execution of statements that match specific patterns. Block rules apply to any statements, including DDL and DML. Typically, block rules are configured by database administrators (DBAs) to enhance cluster stability. For example,

  - Preventing a query from scanning too many rows of data
  - Preventing a query from scanning too many partitions
  - Preventing a statement that modifies global variables to avoid accidental changes to cluster configurations.
  - Preventing a query pattern that typically consumes excessive resources

- **Runtime circuit breaking**, namely **Workload Policy**, which monitors in real-time during runtime the execution time of queries, the amount of data scanned, and memory consumption to implement rule-based query circuit breaking.

## SQL Block Rule

According to the block pattern, it can be divided into:

- Scan row count block rule
- Scan partition count block rule
- Scan bucket count block rule
- Query statement regex matching block rule
- Query statement hash value matching block rule

Blocking rules can be categorized according to the scope of blocking into:

- Global-level blocking rules
- User-level blocking rules

### Usage

#### Global-level blocking rules

```sql
CREATE SQL_BLOCK_RULE rule_001
PROPERTIES (
  "SQL"="select \\* from t",
  "global" = "true",
  "enable" = "true"
)
```

In this way, we have created a global-level blocking rule. The rule is named rule_001. A query statement regex matching rule has been configured to block all query statements that match the regex `select \\* from t`.

Since this is a global-level blocking rule, any user executing statements that match the above regex will be blocked. For example:

```sql
MySQL root@127.0.0.1:test> select * from t;
(1105, 'errCode = 2, detailMessage = errCode = 2, detailMessage = SQL match regex SQL block rule: rule_001')
```

#### User-level Blocking Rule

```sql
CREATE SQL_BLOCK_RULE rule_001
PROPERTIES (
  "SQL"="select * from t",
  "global" = "false",
  "enable" = "true"
)
```

Unlike global-level blocking rules, user-level blocking rules only apply to specified users. When we create a blocking rule, set the property "global" to "false". Then, this blocking rule will be considered a user-level blocking rule.

To make user-level blocking rules effective, you also need to set the corresponding properties for the users who need to use this rule. For example:

```sql
set property for 'root' 'SQL_block_rules' = 'rule_001';
```

Thus, after the above configuration, when the root user executes a query, the blocking rule named rule_001 will be applied.

```sql
MySQL root@127.0.0.1:test> set property for 'root' 'SQL_block_rules' = '';
Query OK, 0 rows affected
Time: 0.018s
MySQL root@127.0.0.1:test> select * from t;
+----+----+
| id | c1 |
+----+----+
| 1  | 1  |
+----+----+

1 row in set
Time: 0.027s
MySQL root@127.0.0.1:test> set property for 'root' 'SQL_block_rules' = 'rule_001';
Query OK, 0 rows affected
Time: 0.008s
MySQL root@127.0.0.1:test> select * from t;
(1105, 'errCode = 2, detailMessage = errCode = 2, detailMessage = SQL match regex SQL block rule: rule_001')
```
- If you want to add multiple user-level blocking rules for a user, list all the rule names in the rule list, separated by commas.
- If you want to remove all user-level blocking rules for a user, set the rule list to an empty string.

#### Other Operations
If you need to modify or delete blocking rules, refer to the SQL manual for blocking rules.

### Use Cases
You can use the following scenarios:

* Blocking scans that exceed a specified number of rows
* Blocking scans that exceed a specified number of partitions
* Blocking scans that exceed a specified number of buckets
* Blocking queries with specific patterns

#### Blocking Scans that Exceed a Specified Number of Rows
Scanning data significantly consumes BE's IO and CPU resources. Therefore, unnecessary data scans pose a substantial challenge to cluster stability. In daily use, blind full table scan operations often occur, such as `SELECT * FROM t`. To prevent such queries from damaging the cluster, you can set an upper limit on the number of rows scanned by a single query on a single table.

```sql
CREATE SQL_BLOCK_RULE rule_card 
PROPERTIES
(
   "cardinality" = "1000",
   "global" = "true",
   "enable" = "true"
);
```

When the above rules are set, if a single table scan exceeds 1000 rows, the execution of the query is prohibited.
It should be noted that since the calculation of the number of rows scanned is done during the planning phase, not the execution phase. Therefore, when calculating the number of rows, only partition and bucket pruning are considered, and the impact of other filtering conditions on the number of rows scanned is not taken into account. In other words, the worst-case scenario is considered. Therefore, queries where the actual number of rows scanned is less than the set value may also be blocked.

#### Prevent Scanning Data from Exceeding the Specified Number of Partitions
Scanning too many partitions can significantly increase the CPU consumption of BE. Additionally, if the query is on an external table, it is more likely to incur significant network overhead and metadata retrieval overhead. In daily use, this is often due to forgetting to write filtering conditions on partition columns or writing them incorrectly. To prevent such queries from damaging the cluster, you can set an upper limit on the number of partitions scanned by a single query on a single table.


```sql
CREATE SQL_BLOCK_RULE rule_part_num 
PROPERTIES
(
   "partition_num" = "30",
   "global" = "true",
   "enable" = "true"
);
```
When the above rules are set, if the number of partitions scanned for a single table exceeds 30, the execution of the query is prohibited.
It should be noted that the calculation of the number of scanned partitions is completed during the planning phase, not the execution phase. Therefore, there may be cases where more partitions are retained due to incomplete partition pruning. Thus, queries where the actual number of scanned partitions is less than the set value may also be blocked.

#### Prevent Scanning Data with Excessive Bucket Counts
Scanning too many buckets can significantly increase the BE's CPU consumption. To prevent such queries from harming the cluster, you can set an upper limit on the number of partitions a single query can scan on a single table.


```sql
CREATE SQL_BLOCK_RULE rule_teblet_num 
PROPERTIES
(
   "tablet_num" = "200",
   "global" = "true",
   "enable" = "true"
);
```
When the above rules are set, if the number of buckets scanned in a single table exceeds 200, the execution of the query is prohibited.

It is important to note that the calculation of the number of scanned buckets is done during the planning phase, not the execution phase. Therefore, it is possible that due to incomplete bucket pruning, more partitions are retained. As a result, queries with an actual number of scanned buckets less than the set value may also be blocked.

#### Blocking Queries with Specific Patterns

For various reasons, such as high computational complexity or long planning time, you may want to block queries that use certain patterns.

For example, to block the `abs` function. You can use the following regular expression block rule to achieve this purpose.


```sql
CREATE SQL_BLOCK_RULE rule_abs
PROPERTIES(
  "SQL"="(?i)abs\\s*\\(.+\\)",
  "global"="true",
  "enable"="true"
);
```

In the above regular expressions:

- `(?i)` indicates case-insensitive matching.
- `abs` is the target function to be blocked.
- `\s*` signifies that any amount of whitespace is allowed between `abs` and the left parenthesis.
- `\(.+\)` matches the function parameters.

Similarly, similar methods can be used to block `set global` to prevent unintended variable changes, or block `truncate table` to prevent unintended data deletions.

### FAQ

#### Q: Will regular expression blocking rules have side effects on the cluster?
A: Yes. Regular expression matching is computationally intensive. When using complex regular expressions or too many regex blocking rules, it can significantly increase the CPU load on the FE. Therefore, add regex blocking rules cautiously. Avoid using complex regular expressions unless necessary.

#### Q: Can a blocking rule be temporarily disabled?
A: Yes. Modify the blocking rule by setting its "enable" property to "false".

#### Q: What standard do the regular expressions in blocking rules use?
A: The regular expressions in blocking rules use Java's regular expression syntax. Common expressions can refer to the SQL syntax manual. The complete manual can be found at https://docs.oracle.com/javase/8/docs/api/java/util/regex/Pattern.html

## Workload Policy

SQL Block Rule is a configuration for circuit breaking during planning, but because the cost calculation during planning may be inaccurate (especially for very complex queries, making it difficult to estimate accurately), it can lead to rules not being effective or false positives. Workload Policy addresses this limitation by allowing real-time monitoring of certain metrics during query execution, and circuit breaking queries whose runtime state does not meet expectations. This prevents unexpected large queries from consuming excessive resources and affecting cluster stability. Common runtime monitoring metrics include:

* Query execution time
* Number of rows scanned per BE
* Number of bytes scanned per BE
* Memory usage per BE

### Version Notes

Since Doris version 2.1, Workload Policy can be used to implement circuit breaking for large queries.

| Version                 | 2.1 |
|--------------------|-----|
| select             | √   |
| insert into select | √   |
| insert into values | X   |
| stream load        | √   |
| routine load       | √   |
| backup             | X   |
| compaction         | X   |

### Creating Workload Policy
Use the `CREATE WORKLOAD Policy` command to create a resource management policy.

In the example below, create a Policy named `test_cancel_Policy`, which will cancel queries running in the cluster for more than 1000ms. The current status is enabled. Creating a Workload Policy requires `admin_priv` privileges.

```sql
create workload policy test_cancel_Policy
Conditions(query_time > 1000)
Actions(cancel_query) 
properties('enabled'='true'); 
```

When creating a Workload Policy, the following must be specified:

- **Condition** represents the policy trigger condition. Multiple Conditions can be linked using commas "," to represent an "AND" relationship. In the example above, `query_time > 1000` indicates that the Policy is triggered when the query time exceeds 1 second. Currently supported Conditions are:

| Conditions            | Description                                                                                                 |
|-----------------------|-------------------------------------------------------------------------------------------------------------|
| username              | The username carried by the query, only triggers the `set_session_variable` Action in FE.                   |
| be_scan_rows          | The number of rows scanned by a SQL in a single BE process. If the SQL is executed concurrently on BE, it is the cumulative value of multiple concurrent executions. |
| be_scan_bytes         | The number of bytes scanned by a SQL in a single BE process. If the SQL is executed concurrently on BE, it is the cumulative value of multiple concurrent executions, in bytes. |
| query_time            | The runtime of a SQL in a single BE process, in milliseconds.                                             |
| query_be_memory_bytes | The memory usage of a SQL in a single BE process. If the SQL is executed concurrently on BE, it is the cumulative value of multiple concurrent executions, in bytes. |

- **Action** represents the action taken when the condition is triggered. Currently, a Policy can only define one Action (except for `set_session_variable`). In the example above, `cancel_query` indicates cancelling the query. Currently supported Actions are:

| Actions                | Description                                                                                                      |
|------------------------|------------------------------------------------------------------------------------------------------------------|
| cancel_query           | Cancel the query.                                                                                                 |
| set_session_variable   | Triggers the `set session variable` statement. A single policy can have multiple `set_session_variable` options, currently only triggered in FE by the `username` Condition. |

- **Properties** define the attributes of the current Policy, including whether it is enabled and its priority.

| Properties      | Description                                                                                                                                                 |
|-----------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------|
| enabled         | Can be `true` or `false`, default is `true`, indicating the Policy is enabled. `false` indicates the Policy is disabled.                                      |
| priority        | An integer ranging from 0 to 100, default is 0, representing the Policy's priority. The higher the value, the higher the priority. This attribute mainly ensures that when a query matches multiple Policies, only the Policy with the highest priority is selected. |
| workload_group  | Currently, a Policy can bind to one workload group, meaning this Policy only applies to queries from a specific Workload Group. The default is empty, meaning it applies to all queries. |

### Binding Workload Policy to Workload Group

By default, Workload Policies apply to all supported queries. If you want to specify that a Policy only targets a specific Workload Group, you need to bind the Workload Group through the `workload_group` option. The statement is as follows:

```sql
create workload policy test_cancel_big_query
Conditions(query_time > 1000)
Actions(cancel_query) 
properties('workload_group'='normal')
```

### Important Notes
- The Conditions and Actions of the same Policy must either both be FE or both be BE. For example, `set_session_variable` and `cancel_query` cannot be configured within the same Policy. Conditions `be_scan_rows` and `username` cannot be configured within the same Policy.
- Currently, Policies are executed by asynchronous threads at fixed time intervals, which introduces a certain latency in policy enforcement. For example, if a user configures a policy to cancel a query when the number of scanned rows exceeds 1,000,000, and the cluster resources are relatively idle at that time, the query may finish before the cancellation policy takes effect. The current interval is 500ms, meaning that queries with run times shorter than this interval may bypass the policy check.
- Currently supported load types include select/insert, select/stream load, broker load, and routine load.
- A single query may match multiple Policies, but only the Policy with the highest priority will take effect.
- Modifications to Actions and Conditions are currently not supported; they can only be modified by deleting and recreating them.

### Workload Policy Demonstration

#### 1. Session Variable Modification Test
Attempt to modify concurrency-related parameters in the session variables of the Admin account.

```sql
-- log on admin to check variables
show variables like '%parallel_fragment_exec_instance_num%';
+-------------------------------------+-------+---------------+---------+
| Variable_name                       | Value | Default_Value | Changed |
+-------------------------------------+-------+---------------+---------+
| parallel_fragment_exec_instance_num | 8     | 8             | 0       |
+-------------------------------------+-------+---------------+---------+
1 row in set (0.00 sec)

-- Create a Policy to modify the concurrency parameters of the admin account.
create workload Policy test_set_var_Policy
Conditions(username='admin')
Actions(set_session_variable 'parallel_fragment_exec_instance_num=1') 

-- After some time, check the admin account's parameters again.
show variables like '%parallel_fragment_exec_instance_num%';
+-------------------------------------+-------+---------------+---------+
| Variable_name                       | Value | Default_Value | Changed |
+-------------------------------------+-------+---------------+---------+
| parallel_fragment_exec_instance_num | 1     | 8             | 1       |
+-------------------------------------+-------+---------------+---------+
1 row in set (0.01 sec)
```

#### 2. Big Query Circuit Breaker Test
Test to circuit break queries that run longer than 3s. Below is an audit log of a successful run of ckbench's q29, showing that this SQL took 4.5s to complete.


```sql
mySQL [hits]>SELECT REGEXP_REPLACE(Referer, '^https?://(?:www\.)?([^/]+)/.*$', '\1') AS k, AVG(length(Referer)) AS l, COUNT(*) AS c, MIN(Referer) FROM hits WHERE Referer <> '' GROUP BY k HAVING COUNT(*) > 100000 ORDER BY l DESC LIMIT 25;
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

Create a Policy that cancels a query if it runs longer than 3 seconds.
```sql
create workload Policy test_cancel_3s_query
Conditions(query_time > 3000)
Actions(cancel_query) 
```

Upon re-executing the SQL, you can see that the SQL execution will directly report an error.

```sql
mySQL [hits]>SELECT REGEXP_REPLACE(Referer, '^https?://(?:www\.)?([^/]+)/.*$', '\1') AS k, AVG(length(Referer)) AS l, COUNT(*) AS c, MIN(Referer) FROM hits WHERE Referer <> '' GROUP BY k HAVING COUNT(*) > 100000 ORDER BY l DESC LIMIT 25;
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[CANCELLED]query cancelled by workload Policy,id:12345
```

