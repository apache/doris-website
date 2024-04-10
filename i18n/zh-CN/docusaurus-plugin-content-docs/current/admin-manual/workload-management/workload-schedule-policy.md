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

## 功能背景
Workload Group功能解决了不同负载间的隔离问题，但无法解决同一个Group内的大查询熔断的问题， 用户遇到大查询影响集群稳定性时只能手动处理。

因此Doris实现了Workload Schedule Policy的功能，支持查询负载管理的自动化，比如实现自动cancel运行时间超过5s的查询这样的功能。

## 基础概念
给出一个创建Workload Schedule Policy的语法
```
create workload schedule policy test_cancel_policy
conditions(query_time > 1000)
actions(cancel_query) 
properties('enabled'='true'); 
```
Workload Scheduler Policy主要包含以下几个概念：
* policy，代表了用户定义的策略，包含触发策略的条件(conditions)和触发策略后的动作(actions)。
* conditions，代表了策略的触发条件，比如当查询时间大于3s，就触发当前policy的action。一个policy可以有多个condition，多个condition之间是“与”的关系。
* actions，当policy被触发时所采取的动作，比如可以cancel query，目前一个policy只能定义一个action(除了set_session_variable)。
* properties，定义了当前policy的属性，包括是否启用和优先级。

上面例子中policy的含义是，创建一个名为test_cancel_policy的policy，它会cancel掉集群中运行时间超过1s的查询，当前状态为启用。

## 基本用法
由于action的行为有的只能在FE生效，有的只能在BE生效，因此policy本身也有FE和BE的区别。

### 适用于FE的policy
#### Condition
* username，当一个查询的username为某个值时，就会触发相应的action
#### Action
* set_session_variable，这个action可以执行一条set session variable的语句。同一个policy可以有多个set_session_variable，也就是说一个policy可以执行多个修改session变量的语句。

适用于FE的policy主要是用于修改某个user的session变量，目前不支持set global的用法。

### 适用于BE的policy
#### Condition
* be_scan_rows，一个sql在单个BE进程内scan的行数，如果有多个并发那就是多个并发的累加值。
* be_scan_bytes，一个sql在单个BE进程内scan的字节数，如果有多个并发那么就是多个并发的累加值。
* query_time，一个sql在单个BE进程上的运行时间，时间单位是毫秒。

#### Action
* cancel_query，cancel查询。

目前BE的policy主要是用于BE负载的管理，比如当某个query的scan数据量过大或者查询时间过长，就cancel这个query。

### 属性
* enabled，取值为true或false，默认值为true，表示当前policy处于启用状态，false表示当前policy处于禁用状态。
* priority，取值范围为0到100的正整数，默认值为0，代表policy的优先级，该值越大，优先级越高。这个属性的主要作用是，当匹配到多个policy时，选择优先级最高的policy。

### 注意事项
1 同一个policy的condition和action要么都是FE的，要么都是BE的，比如set_session_variable和cancel_query无法配置到同一个policy中。condition be_scan_rows和condition username无法配置到同一个policy中。

2 由于目前的policy是异步线程以固定时间间隔执行的，因此策略的生效存在一定的滞后性。比如用户配置了scan行数大于100万就cancel查询的策略，如果此时集群资源比较空闲，那么有可能在cancel策略生效之前查询就已经结束了。目前这个时间间隔为500ms，这意味着运行时间过短的查询可能会绕过策略的检查。 

3 当前支持的负载类型包括select/insert select/stream load/broker load/routine load。

4 一个查询可能匹配到多个policy，但是只有优先级最高的policy会生效。

5 目前不支持action和condition的修改，只能通过删除新建的方式修改。

## 常见用法
1 将用户名为admin的所有session变量中的workload group修改为normal
```
create workload schedule policy test_set_var_policy
conditions(username='admin')
actions(set_session_variable 'workload_group=normal') 
```

2 cancel所有单个be上scan行数大于1000行的sql
```
create workload schedule policy test_cancel_query
conditions(be_scan_rows > 1000)
actions(cancel_query) 
```

3 cancel所有scan字节数大于5G且运行时间超过1s的sql
```
create workload schedule policy test_cancel_big_query
conditions(query_time > 1000, be_scan_bytes > 5368709120)
actions(cancel_query) 
```

4 修改属性
```
alter workload schedule policy test_cancel_big_query properties('enabled'='false');
```

5 查看已创建的policy
```
mysql [(none)]>show workload schedule policy;
+-------+----------------------+-------------------+--------------+----------+---------+---------+
| Id    | Name                 | Condition         | Action       | Priority | Enabled | Version |
+-------+----------------------+-------------------+--------------+----------+---------+---------+
| 41057 | test_cancel_3s_query | query_time > 3000 | cancel_query | 0        | true    | 0       |
+-------+----------------------+-------------------+--------------+----------+---------+---------+
1 row in set (0.00 sec)
```

## 效果测试
#### 1 session变量修改测试
尝试修改admin账户的session变量中的并发相关的参数
```
// 登录 admin账户查看并发参数
mysql [(none)]>show variables like '%parallel_fragment_exec_instance_num%';
+-------------------------------------+-------+---------------+---------+
| Variable_name                       | Value | Default_Value | Changed |
+-------------------------------------+-------+---------------+---------+
| parallel_fragment_exec_instance_num | 8     | 8             | 0       |
+-------------------------------------+-------+---------------+---------+
1 row in set (0.00 sec)

// 创建修改admin账户并发参数的policy
create workload schedule policy test_set_var_policy
conditions(username='admin')
actions(set_session_variable 'parallel_fragment_exec_instance_num=1') 


// 过段时间后再次查看admin账户的参数
mysql [(none)]>show variables like '%parallel_fragment_exec_instance_num%';
+-------------------------------------+-------+---------------+---------+
| Variable_name                       | Value | Default_Value | Changed |
+-------------------------------------+-------+---------------+---------+
| parallel_fragment_exec_instance_num | 1     | 8             | 1       |
+-------------------------------------+-------+---------------+---------+
1 row in set (0.01 sec)
```

#### 2 大查询熔断测试
测试对运行时间超过3s的查询进行熔断，以下是一个ckbench的q29运行成功时的审计日志，可以看到这个sql跑完需要4.5s的时间
```
User=root|Ctl=internal|Db=hits|State=EOF|ErrorCode=0|ErrorMessage=|Time(ms)=4543|ScanBytes=15573090304|ScanRows=81032736|ReturnRows=11|StmtId=102|QueryId=391b02b55fdf4f59-becf6c17dfff1a65|IsQuery=true|isNereids=true|feIp=127.0.0.1|Stmt=SELECT REGEXP_REPLACE(Referer, '^https?://(?:www\.)?([^/]+)/.*$', '\1') AS k, AVG(length(Referer)) AS l, COUNT(*) AS c, MIN(Referer) FROM hits WHERE Referer <> '' GROUP BY k HAVING COUNT(*) > 100000 ORDER BY l DESC LIMIT 25|CpuTimeMS=40454|ShuffleSendBytes=0|ShuffleSendRows=0|SqlHash=b03d48a7e6849912003ad1cff9519957|peakMemoryBytes=1748076928
```

创建一个运行时间超过3s就cancel查询的policy
```
create workload schedule policy test_cancel_3s_query
conditions(query_time > 3000)
actions(cancel_query) 
```

再次执行sql可以看到SQL执行会直接报错
```
mysql [hits]>SELECT REGEXP_REPLACE(Referer, '^https?://(?:www\.)?([^/]+)/.*$', '\1') AS k, AVG(length(Referer)) AS l, COUNT(*) AS c, MIN(Referer) FROM hits WHERE Referer <> '' GROUP BY k HAVING COUNT(*) > 100000 ORDER BY l DESC LIMIT 25;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.8)[CANCELLED]query canceled by workload scheduler
```

审计日志中也会有相关报错
```
Ctl=internal|Db=hits|State=ERR|ErrorCode=1105|ErrorMessage=errCode = 2, detailMessage = (127.0.0.1)[CANCELLED]query canceled by workload scheduler|Time(ms)=3118|ScanBytes=11013275648|ScanRows=59503712|ReturnRows=0|StmtId=107|QueryId=eee98eec821342a0-ac07ff18ea08026a|IsQuery=true|isNereids=true|feIp=10.16.10.8|Stmt=SELECT REGEXP_REPLACE(Referer, '^https?://(?:www\.)?([^/]+)/.*$', '\1') AS k, AVG(length(Referer)) AS l, COUNT(*) AS c, MIN(Referer) FROM hits WHERE Referer <> '' GROUP BY k HAVING COUNT(*) > 100000 ORDER BY l DESC LIMIT 25|CpuTimeMS=28318|ShuffleSendBytes=0|ShuffleSendRows=0|SqlHash=b03d48a7e6849912003ad1cff9519957|peakMemoryBytes=1230807350
```