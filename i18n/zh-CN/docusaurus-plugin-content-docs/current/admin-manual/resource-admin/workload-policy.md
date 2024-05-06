---
{
"title": "Workload Policy",
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

## WORKLOAD POLICY

### 功能背景
Workload Group功能解决了不同负载间的隔离问题，但无法解决同一个Group内的大查询熔断的问题， 用户遇到大查询影响集群稳定性时只能手动处理。

因此Doris实现了Workload Policy的功能，支持查询负载管理的自动化，比如实现自动取消运行时间超过5s的查询这样的功能。

### 基础概念
给出一个创建Workload Policy的语法
```
create workload policy test_cancel_policy
conditions(query_time > 1000)
actions(cancel_query) 
properties('enabled'='true'); 
```
Workload Policy主要包含以下几个概念：
* policy，代表了用户定义的策略，包含触发策略的条件(conditions)和触发策略后的动作(actions)。
* conditions，代表了策略的触发条件，比如当查询时间大于3s，就触发当前policy的action。一个policy可以有多个condition，多个condition之间是“与”的关系。
* actions，当policy被触发时所采取的动作，比如可以取消查询，目前一个policy只能定义一个action(除了set_session_variable)。
* properties，定义了当前policy的属性，包括是否启用和优先级。

上面例子中policy的含义是，创建一个名为test_cancel_policy的policy，它会取消掉集群中运行时间超过1s的查询，当前状态为启用。

### 基本用法
由于action的行为有的只能在FE生效，有的只能在BE生效，因此policy本身也有FE和BE的区别。

#### 适用于FE的policy
1. Condition
* username，当一个查询的username为某个值时，就会触发相应的action
2. Action
* set_session_variable，这个action可以执行一条set session variable的语句。同一个policy可以有多个set_session_variable，也就是说一个policy可以执行多个修改session变量的语句。

适用于FE的policy主要是用于修改某个user的session变量，目前不支持set global的用法。

#### 适用于BE的policy
1. Condition
* be_scan_rows，一个sql在单个BE进程内scan的行数，如果有多个并发那就是多个并发的累加值。
* be_scan_bytes，一个sql在单个BE进程内scan的字节数，如果有多个并发那么就是多个并发的累加值。
* query_time，一个sql在单个BE进程上的运行时间，时间单位是毫秒。

2. Action
* cancel_query，取消查询。

目前BE的policy主要是用于BE负载的管理，比如当某个query的scan数据量过大或者查询时间过长，就取消这个query。

#### 属性
* enabled，取值为true或false，默认值为true，表示当前policy处于启用状态，false表示当前policy处于禁用状态。
* priority，取值范围为0到100的正整数，默认值为0，代表policy的优先级，该值越大，优先级越高。这个属性的主要作用是，当匹配到多个policy时，选择优先级最高的policy。
* workload_group，目前一个policy可以绑定一个workload group，代表这个policy只对某个workload group生效。默认为空，代表对所有查询生效。

#### 注意事项
* 同一个policy的condition和action要么都是FE的，要么都是BE的，比如set_session_variable和cancel_query无法配置到同一个policy中。condition be_scan_rows和condition username无法配置到同一个policy中。

* 由于目前的policy是异步线程以固定时间间隔执行的，因此策略的生效存在一定的滞后性。比如用户配置了scan行数大于100万就取消查询的策略，如果此时集群资源比较空闲，那么有可能在取消策略生效之前查询就已经结束了。目前这个时间间隔为500ms，这意味着运行时间过短的查询可能会绕过策略的检查。

* 当前支持的负载类型包括select/insert select/stream load/broker load/routine load。

* 一个查询可能匹配到多个policy，但是只有优先级最高的policy会生效。

* 目前不支持action和condition的修改，只能通过删除新建的方式修改。

### 常见用法
1 将用户名为admin的所有session变量中的workload group修改为normal
```
create workload policy test_set_var_policy
conditions(username='admin')
actions(set_session_variable 'workload_group=normal') 
```

2 取消所有单个be上scan行数大于1000行的sql
```
create workload policy test_cancel_query
conditions(be_scan_rows > 1000)
actions(cancel_query) 
```

3 取消所有scan字节数大于5G且运行时间超过1s的sql
```
create workload policy test_cancel_big_query
conditions(query_time > 1000, be_scan_bytes > 5368709120)
actions(cancel_query) 
```

4 修改属性
```
alter workload policy test_cancel_big_query properties('workload_group'='normal');
```

5 查看已创建的policy
```
mysql [information_schema]>select * from workload_policy;
+-------+-----------------------+----------------------------------------------+--------------+----------+---------+---------+----------------+
| ID    | NAME                  | CONDITION                                    | ACTION       | PRIORITY | ENABLED | VERSION | WORKLOAD_GROUP |
+-------+-----------------------+----------------------------------------------+--------------+----------+---------+---------+----------------+
| 35025 | test_cancel_big_query | query_time > 1000;be_scan_bytes > 5368709120 | cancel_query |        0 |       1 |       1 | normal         |
+-------+-----------------------+----------------------------------------------+--------------+----------+---------+---------+----------------+
1 row in set (0.03 sec)
```


6 删除policy
```
drop workload policy test_cancel_big_query;
```

### 效果测试
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
create workload policy test_set_var_policy
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

创建一个运行时间超过3s就取消查询的policy
```
create workload policy test_cancel_3s_query
conditions(query_time > 3000)
actions(cancel_query) 
```

再次执行sql可以看到SQL执行会直接报错
```
mysql [hits]>SELECT REGEXP_REPLACE(Referer, '^https?://(?:www\.)?([^/]+)/.*$', '\1') AS k, AVG(length(Referer)) AS l, COUNT(*) AS c, MIN(Referer) FROM hits WHERE Referer <> '' GROUP BY k HAVING COUNT(*) > 100000 ORDER BY l DESC LIMIT 25;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.8)[CANCELLED]query cancelled by workload policy,id:12345
```