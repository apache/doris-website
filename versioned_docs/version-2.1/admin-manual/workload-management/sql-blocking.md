---
{
"title": "Query Blocking",
"language": "zh-CN"
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

Query Circuit Breaker is a protection mechanism designed to prevent long-running or resource-intensive queries from negatively impacting the system. When a query exceeds predefined resource or time limits, the circuit breaker automatically terminates the query to avoid adverse effects on system performance, resource utilization, and other queries. This mechanism ensures the stability of the cluster in a multi-user environment, preventing individual queries from depleting system resources, slowing down responses, or causing deadlocks, thereby enhancing overall availability and efficiency.
In Doris, there are two types of circuit breaker strategies:
- Planning-time Circuit Breaker (SQL Block Rule): Used to prevent statements that match specific patterns from executing. Blocking rules apply to any SQL statements, including DDL and DML. Typically, blocking rules are configured by database administrators (DBAs) to enhance cluster stability. Examples include:
    - Blocking a query that scans too many rows of data
    - Blocking a query that scans too many partitions
    - Blocking a statement that modifies global variables to prevent unintended cluster configuration changes
    - Blocking a query pattern that typically consumes significant resources
- Runtime Circuit Breaker (Workload Policy): Monitors query execution time, data scanned, and memory consumed in real-time to implement rule-based query termination.

## SQL Block Rule
Based on the blocking pattern, SQL Block Rules can be classified into:
- Row count blocking rules
- Partition count blocking rules
- Tablet count blocking rules
- SQL regex match blocking rules
- SQL hash value match blocking rules

Blocking rules can also be classified by scope:
- Global-level blocking rules
- User-level blocking rules

### 使用方法

#### Global-level Blocking Rule
```
CREATE SQL_BLOCK_RULE rule_001
PROPERTIES (
  "sql"="select \\* from t",
  "global" = "true",
  "enable" = "true"
)
```

This creates a global-level blocking rule named rule_001. It uses a regex to block any query that matches ```select \\* from t```.
Since it's a global-level rule, any user attempting to execute a matching query will be blocked. For example:

```
MySQL root@127.0.0.1:test> select * from t;
(1105, 'errCode = 2, detailMessage = errCode = 2, detailMessage = sql match regex sql block rule: rule_001')
```

#### User-level Blocking Rule
```
CREATE SQL_BLOCK_RULE rule_001
PROPERTIES (
  "sql"="select * from t",
  "global" = "false",
  "enable" = "true"
)
```
Unlike global-level rules, user-level rules only apply to specified users. To create a user-level rule, set the "global" property to "false". Additionally, you need to set the sql_block_rules property for the user:
```
set property for 'root' 'sql_block_rules' = 'rule_001';
```
With this configuration, the rule_001 blocking rule will apply to the root user.
```
MySQL root@127.0.0.1:test> set property for 'root' 'sql_block_rules' = '';
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
MySQL root@127.0.0.1:test> set property for 'root' 'sql_block_rules' = 'rule_001';
Query OK, 0 rows affected
Time: 0.008s
MySQL root@127.0.0.1:test> select * from t;
(1105, 'errCode = 2, detailMessage = errCode = 2, detailMessage = sql match regex sql block rule: rule_001')
```
To apply multiple user-level blocking rules to a user, list all rule names separated by commas. 
To remove all user-level blocking rules, set the rule list to an empty string.

#### Other Operations
Refer to the SQL Block Rule manual for instructions on modifying or deleting blocking rules.

### Usage Scenarios
SQL Block Rules can be used in the following scenarios:
* Blocking queries that scan more than a specified number of rows
* Blocking queries that scan more than a specified number of partitions
* Blocking queries that scan more than a specified number of tablets
* Blocking specific query patterns

#### Blocking Queries that Scan More Than a Specified Number of Rows
Scanning data significantly consumes BE's IO and CPU resources. Unnecessary full table scans can pose challenges to cluster stability. To prevent destructive queries, set a limit on the number of rows scanned per query.
```
CREATE SQL_BLOCK_RULE rule_card 
PROPERTIES
(
   "cardinality" = "1000",
   "global" = "true",
   "enable" = "true"
);
```
With this rule, queries scanning more than 1000 rows are blocked. Note that row count calculation occurs during the planning phase, considering partition and tablet pruning but not other filtering conditions.
#### Blocking Queries that Scan More Than a Specified Number of Partitions
Scanning too many partitions significantly increases BE's CPU usage and may lead to network and metadata retrieval overhead, especially for external tables. To prevent this, set a limit on the number of partitions scanned per query.
```
CREATE SQL_BLOCK_RULE rule_part_num 
PROPERTIES
(
   "partition_num" = "30",
   "global" = "true",
   "enable" = "true"
);
```
With this rule, queries scanning more than 30 partitions are blocked. Note that partition count calculation occurs during the planning phase and may not fully reflect pruning.

#### Blocking Queries that Scan More Than a Specified Number of Tablets
Scanning too many tablets significantly increases BE's CPU usage. To prevent this, set a limit on the number of tablets scanned per query.
```
CREATE SQL_BLOCK_RULE rule_teblet_num 
PROPERTIES
(
   "tablet_num" = "200",
   "global" = "true",
   "enable" = "true"
);
```
With this rule, queries scanning more than 200 tablets are blocked. Note that tablet count calculation occurs during the planning phase and may not fully reflect pruning.

#### Blocking Specific Query Patterns
To prevent queries with high computational complexity or long planning times, you can block specific patterns using regex.

```
CREATE SQL_BLOCK_RULE rule_abs
PROPERTIES(
  "sql"="(?i)abs\\s*\\(.+\\)",
  "global"="true",
  "enable"="true"
);
```

In the above regular expression:
- (?i) means case-insensitive matching.
- abs is the target function to be blocked.
- \\s* allows for any number of whitespace characters between abs and the left parenthesis.
- \\(.+\\) matches the function arguments. Similarly, a similar approach can be used to block set global to prevent unintended variable changes, or to block truncate table to prevent unintended data deletion.

### FAQ
#### Q: Can regex-based blocking rules have adverse effects on the cluster?
A: Yes. Complex regex matching is computationally intensive. Using complex regexes or too many regex-based rules can significantly increase the CPU load on the FE. Therefore, add regex-based blocking rules cautiously and avoid complex regexes unless necessary.

#### Q: Can a blocking rule be temporarily disabled?
A: Yes. Modify the rule by setting the "enable" property to "false".

#### Q: What regex syntax is used in blocking rules?
A: The regular expression of the blocking rule uses the Java regular expression specification. For common expressions, refer to the SQL syntax manual. For a complete manual, refer to: https://docs.oracle.com/javase/8/docs/api/java/util/regex/Pattern.html

## Workload Group Policy
### NOTE
- The conditions and actions of the same policy must either be both FE (Frontend) or both BE (Backend). For example, set_session_variable and cancel_query cannot be configured in the same policy. Similarly, condition be_scan_rows and condition username cannot be configured in the same policy.
- Since the current policy is executed by asynchronous threads at fixed time intervals, there is a certain delay in the effectiveness of the policy. For example, if a user configures a policy to cancel a query when the scanned rows exceed 1 million, and the cluster resources are relatively idle at the time, it is possible that the query may have already finished before the cancellation policy takes effect. Currently, the time interval is set to 500ms, which means that queries with very short runtime may bypass the policy check.
- The supported load types include select/insert select/stream load/broker load/routine load.
- A query may match multiple policies, but only the policy with the highest priority will take effect.
- Currently, modification of actions and conditions is not supported; changes can only be made by deleting and recreating the policy.

### Supported Workload Load
Starting from Doris 2.1, large query circuit-breaking can be implemented through Workload Policy.

| version            | 2.1 |
|--------------------|-----|
| select             | √   |
| insert into select | √   |
| insert into values | X   |
| stream load        | √   |
| routine load       | √   |
| backup             | X   |
| compaction         | X   |

### Create Workload Policy
The CREATE WORKLOAD POLICY command can be used to create a resource management policy.
In the example below, a policy named test_cancel_policy is created, which will cancel any queries running for more than 1000ms in the cluster. The policy is currently enabled. Creating a Workload Policy requires admin_priv privileges.

```
create workload policy test_cancel_policy
conditions(query_time > 1000)
actions(cancel_query) 
properties('enabled'='true'); 
```

在创建 Workload Policy 时需要指定以下内容：
- conditions: Represents the trigger conditions for the policy. Multiple conditions can be chained together, separated by commas (,), indicating an "AND" relationship. In the example above, query_time > 1000 means the policy will be triggered when the query time exceeds 1 second.
- action: Specifies the action to be taken when the condition is triggered. Currently, a policy can define only one action (except for set_session_variable). In the example above, cancel_query indicates that the query should be canceled.
- properties， Defines the attributes of the policy, including whether it is enabled and its priority.

A policy can only be applied to either the FE (Frontend) or BE (Backend) component, not both simultaneously. This is because FE and BE have independent conditions and actions, and the policy does not distinguish between FE and BE components. The following table lists the clause options for the policy:
  
| Components   | condition&action | metric               | explain                                                                                                                                                                                                               |
|------|------------------|----------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| FE   | conditions       | username             | When a queried username is a certain value, the corresponding action will be triggered.                                                                                                                               |
|      | actions          | set_session_variable | This action can execute a statement that sets session variable. The same policy can have multiple `set_session_variable`, which means that a policy can execute multiple statements that modify the session variable. |
| BE   | conditions       | be_scan_rows         | The number of rows scanned by an SQL within a single BE process, if the SQL is executed concurrently on the BE, it is the cumulative value of multiple concurrency.                                                   |
|      |                  | be_scan_bytes        | The number of bytes scanned by an SQL within a single BE process, if the SQL is executed concurrently on the BE, it is the cumulative value of multiple concurrency, measured in bytes.                               |
|      |                  | query_time           | The running time of an SQL on a single BE process, measured in milliseconds.                                                                                                                                          |
|      |                  | query_be_memory_bytes | The memory used by an SQL within a BE process, if the SQL is executed concurrently on the BE, it is the cumulative value of multiple concurrency, measured in bytes.                                                  |
|      | actions          | cancel_query         | cancel query.                                                                                                                                                                                                         |
| FE&BE | properties       | enabled              | the value is either true or false. The default value is true, indicating that the current policy is enabled, while false indicates that the current policy is disabled.                                                                                                                                                        |
|      |                  | priority             | the value range is a positive integer from 0 to 100, with a default value of 0. The higher the value, the higher the priority of the policy. The main function of this attribute is to select the policy with the highest priority when multiple policies are matched.                                                                                                                                 |
|      |                  | workload_group       | A policy can be bound to a workload group, indicating that this policy only applies to a certain workload group.The default value is empty, which means it will take effect for all queries.                                                                                                                                         |


### Binding Workload Policy to Workload Group
By default, the Workload Policy applies to all supported queries. If you want the policy to apply only to a specific Workload Group, you need to bind the policy to the Workload Group using the workload_group option. The statement is as follows:

```
create workload policy test_cancel_big_query
conditions(query_time > 1000)
actions(cancel_query) 
properties('workload_group'='normal')
```

## Test
### 1 set session variables
Attempt to modify concurrency related parameters in the session variable of the admin user.
```
// show variable parallel_fragment_exec_instance_num of admin user.
mysql [(none)]>show variables like '%parallel_fragment_exec_instance_num%';
+-------------------------------------+-------+---------------+---------+
| Variable_name                       | Value | Default_Value | Changed |
+-------------------------------------+-------+---------------+---------+
| parallel_fragment_exec_instance_num | 8     | 8             | 0       |
+-------------------------------------+-------+---------------+---------+
1 row in set (0.00 sec)


// create a policy which reset session variable.
create workload policy test_set_var_policy
conditions(username='admin')
actions(set_session_variable 'parallel_fragment_exec_instance_num=1') 


// After a while, check the session variable of the admin.
mysql [(none)]>show variables like '%parallel_fragment_exec_instance_num%';
+-------------------------------------+-------+---------------+---------+
| Variable_name                       | Value | Default_Value | Changed |
+-------------------------------------+-------+---------------+---------+
| parallel_fragment_exec_instance_num | 1     | 8             | 1       |
+-------------------------------------+-------+---------------+---------+
1 row in set (0.01 sec)
```

### 2 big query fusing test
Test fusing queries that have run for more than 3 seconds. The following is the audit log of a successful execution of q29 in Clickbench. It can be seen that it takes 4.5 seconds for this SQL to run.
```
mysql [hits]>SELECT REGEXP_REPLACE(Referer, '^https?://(?:www\.)?([^/]+)/.*$', '\1') AS k, AVG(length(Referer)) AS l, COUNT(*) AS c, MIN(Referer) FROM hits WHERE Referer <> '' GROUP BY k HAVING COUNT(*) > 100000 ORDER BY l DESC LIMIT 25;
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

Create a policy that cancels queries after running for more than 3 seconds
```
create workload policy test_cancel_3s_query
conditions(query_time > 3000)
actions(cancel_query) 
```

Executing SQL again will result in a direct error message.
```
mysql [hits]>SELECT REGEXP_REPLACE(Referer, '^https?://(?:www\.)?([^/]+)/.*$', '\1') AS k, AVG(length(Referer)) AS l, COUNT(*) AS c, MIN(Referer) FROM hits WHERE Referer <> '' GROUP BY k HAVING COUNT(*) > 100000 ORDER BY l DESC LIMIT 25;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.8)[CANCELLED]query canceled by workload policy,id:12345
```