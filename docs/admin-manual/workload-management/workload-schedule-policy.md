---
{
"title": "WORKLOAD SCHEDULE POLICY",
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

# WORKLOAD SCHEDULE POLICY

<version since="dev"></version>

## Backgroup
The Workload Group solves the problem of isolation between different workload, but it cannot solve negative impact of large queries on stability within the same Group. When users encounter large queries that affect cluster stability, they can only manually handle them.

Therefore, Doris has implemented Workload Schedule Policy, which supports the automation of query load management, such as automatically canceling queries with running time exceeding 5 seconds.

## Basic Concepts
Provide an example of Workload Schedule Policy
```
create workload schedule policy test_cancel_policy
conditions(query_time > 1000)
actions(cancel_query) 
properties('enabled'='true'); 
```
Workload Schedule Policy mainly includes the following concepts:
* policy，user-defined policies，Contains conditions for triggering policies and actions after triggering policies.
* conditions，represents the triggering conditions of the policy.A policy can have multiple conditions, and there is an AND relationship between multiple conditions.
* actions，the action works when a policy is triggered, such as canceling a query, currently only a policy can only have one action (except for set_session_variable).
* properties，defined the properties of the current policy, including whether it is enabled and its priority.

The meaning of the policy in the above example is to create a policy named test_cancel_policy, which will cancel queries in the cluster that have been running for more than 1 second, and it's enabled.

## Basic Usage
Due to the fact that some actions can only take effect in FE and others can only take effect in BE, so the policy also needs to be distinguished between the policy of FE and the policy of BE.

### Policy used in FE
#### Condition
* username，When the username of a query is a certain value, the corresponding action will be triggered.
#### Action
* set_session_variable，This action can execute a statement that sets session variable. The same policy can have multiple set_session_variables, which means that a policy can execute multiple statements that modify the session variable.

The policy used in FE is mainly used to modify the session variable, and currently does not support the ```set global```.

### Policy used in BE
#### Condition
* be_scan_rows，The number of rows scanned by an SQL within a single BE process, and if there are multiple concurrency, it is the cumulative value of multiple concurrency.
* be_scan_bytes，The number of bytes scanned by an SQL within a single BE process, and if there are multiple concurrency, it is the cumulative value of multiple concurrency.
* query_time，The running time of an SQL on a single BE process, measured in milliseconds.

#### Action
* cancel_query，cancel query

At present, BE's policy is mainly used for managing BE workload, such as canceling a query when the scan data volume is too large or the query time is too long.

### Properties
* enabled，the value is either true or false. The default value is true, indicating that the current policy is enabled, while false indicates that the current policy is disabled.
* priority，the value range is a positive integer from 0 to 100, with a default value of 0. The higher the value, the higher the priority of the policy. The main function of this attribute is to select the policy with the highest priority when multiple policies are matched.

### Attention
1 Conditions and actions of the same policy are either used in FE or used in BE at the same time, for example, set_session_variable and cancel_query cannot be configured into the same policy. Condition be_scan_rows and condition username cannot be configured into the same policy.

2 Due to the current policy being executed by asynchronous threads at fixed time intervals, there is a certain lag in the effectiveness of the policy. For example, if a user has configured a strategy of canceling queries when the number of scan rows exceeds one million, and the cluster resources are relatively idle at this time, it is possible that the query may have ended before the cancel policy takes effect. At present, the time interval is 500ms, which means that queries with too short running time may bypass policy checks.

3 The currently supported workload types include select/insert select/stream load/broker load/route load.

4 A query may match multiple policies, but only the policy with the highest priority will take effect.

5 At present, it does not support modifying actions and conditions, and can only be modified by deleting and creating new ones.

## Example
1 Change the workload group in all session variables with the username admin to normal.
```
create workload schedule policy test_set_var_policy
conditions(username='admin')
actions(set_session_variable 'workload_group=normal') 
```

2 Cancel SQL with scan rows greater than 1000 on a single BE.
```
create workload schedule policy test_cancel_query
conditions(be_scan_rows > 1000)
actions(cancel_query) 
```

3 Cancel all SQL with scan bytes greater than 5GB and running time exceeding 1s.
```
create workload schedule policy test_cancel_big_query
conditions(query_time > 1000, be_scan_bytes > 5368709120)
actions(cancel_query) 
```

4 Alter properties.
```
alter workload schedule policy test_cancel_big_query properties('enabled'='false');
```

5 show all workload schedule policy.
```
mysql [(none)]>show workload schedule policy;
+-------+----------------------+-------------------+--------------+----------+---------+---------+
| Id    | Name                 | Condition         | Action       | Priority | Enabled | Version |
+-------+----------------------+-------------------+--------------+----------+---------+---------+
| 41057 | test_cancel_3s_query | query_time > 3000 | cancel_query | 0        | true    | 0       |
+-------+----------------------+-------------------+--------------+----------+---------+---------+
1 row in set (0.00 sec)
```

## Test
#### 1 set session variables
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
create workload schedule policy test_set_var_policy
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

#### 2 big query fusing test
Test fusing queries that have run for more than 3 seconds. The following is the audit log of a successful execution of q29 in Clickbench. It can be seen that it takes 4.5 seconds for this SQL to run.
```
User=root|Ctl=internal|Db=hits|State=EOF|ErrorCode=0|ErrorMessage=|Time(ms)=4543|ScanBytes=15573090304|ScanRows=81032736|ReturnRows=11|StmtId=102|QueryId=391b02b55fdf4f59-becf6c17dfff1a65|IsQuery=true|isNereids=true|feIp=127.0.0.1|Stmt=SELECT REGEXP_REPLACE(Referer, '^https?://(?:www\.)?([^/]+)/.*$', '\1') AS k, AVG(length(Referer)) AS l, COUNT(*) AS c, MIN(Referer) FROM hits WHERE Referer <> '' GROUP BY k HAVING COUNT(*) > 100000 ORDER BY l DESC LIMIT 25|CpuTimeMS=40454|ShuffleSendBytes=0|ShuffleSendRows=0|SqlHash=b03d48a7e6849912003ad1cff9519957|peakMemoryBytes=1748076928
```

Create a policy that cancels queries after running for more than 3 seconds
```
create workload schedule policy test_cancel_3s_query
conditions(query_time > 3000)
actions(cancel_query) 
```

Executing SQL again will result in a direct error message.
```
mysql [hits]>SELECT REGEXP_REPLACE(Referer, '^https?://(?:www\.)?([^/]+)/.*$', '\1') AS k, AVG(length(Referer)) AS l, COUNT(*) AS c, MIN(Referer) FROM hits WHERE Referer <> '' GROUP BY k HAVING COUNT(*) > 100000 ORDER BY l DESC LIMIT 25;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.8)[CANCELLED]query canceled by workload scheduler
```

We can also find error message in fe.audit.log
```
Ctl=internal|Db=hits|State=ERR|ErrorCode=1105|ErrorMessage=errCode = 2, detailMessage = (127.0.0.1)[CANCELLED]query canceled by workload scheduler|Time(ms)=3118|ScanBytes=11013275648|ScanRows=59503712|ReturnRows=0|StmtId=107|QueryId=eee98eec821342a0-ac07ff18ea08026a|IsQuery=true|isNereids=true|feIp=10.16.10.8|Stmt=SELECT REGEXP_REPLACE(Referer, '^https?://(?:www\.)?([^/]+)/.*$', '\1') AS k, AVG(length(Referer)) AS l, COUNT(*) AS c, MIN(Referer) FROM hits WHERE Referer <> '' GROUP BY k HAVING COUNT(*) > 100000 ORDER BY l DESC LIMIT 25|CpuTimeMS=28318|ShuffleSendBytes=0|ShuffleSendRows=0|SqlHash=b03d48a7e6849912003ad1cff9519957|peakMemoryBytes=1230807350
```