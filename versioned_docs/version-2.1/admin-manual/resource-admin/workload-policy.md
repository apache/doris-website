---
{
    "title": "Workload Policy",
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

<version since="2.1.3"></version>

## Backgroup
The Workload Group solves the problem of isolation between different workload, but it cannot solve negative impact of large queries on stability within the same Group. When users encounter large queries that affect cluster stability, they can only manually handle them.

Therefore, Doris has implemented Workload Policy, which supports the automation of query load management, such as automatically canceling queries with running time exceeding 5 seconds.

## Basic Concepts
Provide an example of Workload Policy
```
create workload policy test_cancel_policy
conditions(query_time > 1000)
actions(cancel_query) 
properties('enabled'='true'); 
```
Workload Policy mainly includes the following concepts:
* policy，user-defined policies，Contains conditions for triggering policies and actions after triggering policies.
* conditions，represents the triggering conditions of the policy.A policy can have multiple conditions, and there is an AND relationship between multiple conditions.
* actions，the action works when a policy is triggered, such as canceling a query, currently only a policy can only have one action (except for `set_session_variable`).
* properties，defined the properties of the current policy, including whether it is enabled and its priority.

The meaning of the policy in the above example is to create a policy named test_cancel_policy, which will cancel queries in the cluster that have been running for more than 1 second, and it's enabled.
CREATE POLICY needs admin_priv.

## Basic Usage
Due to the fact that some actions can only take effect in FE and others can only take effect in BE, so the policy also needs to be distinguished between the policy of FE and the policy of BE.

### Policy used in FE
1. Condition
   * username，When the username of a query is a certain value, the corresponding action will be triggered.
2. Action
   * set_session_variable，This action can execute a statement that sets session variable. The same policy can have multiple `set_session_variable`, which means that a policy can execute multiple statements that modify the session variable.

The policy used in FE is mainly used to modify the session variable, and currently does not support the ```set global```.

### Policy used in BE
1. Condition
   * be_scan_rows，The number of rows scanned by an SQL within a single BE process, and if there are multiple concurrency, it is the cumulative value of multiple concurrency.
   * be_scan_bytes，The number of bytes scanned by an SQL within a single BE process, and if there are multiple concurrency, it is the cumulative value of multiple concurrency.
   * query_time，The running time of an SQL on a single BE process, measured in milliseconds.

2. Action
   * cancel_query，cancel query

At present, BE's policy is mainly used for managing BE workload, such as canceling a query when the scan data volume is too large or the query time is too long.

### Properties
* enabled, the value is either true or false. The default value is true, indicating that the current policy is enabled, while false indicates that the current policy is disabled.
* priority, the value range is a positive integer from 0 to 100, with a default value of 0. The higher the value, the higher the priority of the policy. The main function of this attribute is to select the policy with the highest priority when multiple policies are matched.
* workload_group, A policy can be bound to a workload group, indicating that this policy only applies to a certain workload group.The default value is empty, which means it will take effect for all queries.

### Attention
* Conditions and actions of the same policy are either used in FE or used in BE at the same time, for example, `set_session_variable` and `cancel_query` cannot be configured into the same policy. Condition `be_scan_rows` and condition `username` cannot be configured into the same policy.

* Due to the current policy being executed by asynchronous threads at fixed time intervals, there is a certain lag in the effectiveness of the policy. For example, if a user has configured a strategy of canceling queries when the number of scan rows exceeds one million, and the cluster resources are relatively idle at this time, it is possible that the query may have ended before the cancel policy takes effect. At present, the time interval is 500ms, which means that queries with too short running time may bypass policy checks.

* The currently supported workload types include select/insert select/stream load/broker load/route load.

* A query may match multiple policies, but only the policy with the highest priority will take effect.

* At present, it does not support modifying actions and conditions, and can only be modified by deleting and creating new ones.

## Example
1. Change the workload group in all session variables with the username admin to normal.
```
create workload policy test_set_var_policy
conditions(username='admin')
actions(set_session_variable 'workload_group=normal') 
```

2. Cancel SQL with scan rows greater than 1000 on a single BE.
```
create workload policy test_cancel_query
conditions(be_scan_rows > 1000)
actions(cancel_query) 
```

3. Cancel all SQL with scan bytes greater than 5GB and running time exceeding 1s.
```
create workload policy test_cancel_big_query
conditions(query_time > 1000, be_scan_bytes > 5368709120)
actions(cancel_query) 
```

4. Alter properties.
```
alter workload policy test_cancel_big_query properties('workload_group'='normal');
```

5. show all workload policy.
```
mysql [information_schema]>select * from workload_policy;
+-------+-----------------------+----------------------------------------------+--------------+----------+---------+---------+----------------+
| ID    | NAME                  | CONDITION                                    | ACTION       | PRIORITY | ENABLED | VERSION | WORKLOAD_GROUP |
+-------+-----------------------+----------------------------------------------+--------------+----------+---------+---------+----------------+
| 35025 | test_cancel_big_query | query_time > 1000;be_scan_bytes > 5368709120 | cancel_query |        0 |       1 |       1 | normal         |
+-------+-----------------------+----------------------------------------------+--------------+----------+---------+---------+----------------+
1 row in set (0.03 sec)
```

6. drop policy.
```
drop workload policy test_cancel_3s_query;
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