---
{
    "title": "查询熔断",
    "language": "zh-CN",
    "description": "查询熔断是一种保护机制，用于防止长时间运行或消耗过多资源的查询对系统产生负面影响。当查询超过预设的资源或时间限制时，熔断机制会自动终止该查询，以避免对系统性能、资源使用以及其他查询造成不利影响。这种机制确保了集群在多用户环境下的稳定性，防止单个查询导致系统资源耗尽、响应变慢，"
}
---

查询熔断是一种保护机制，用于防止长时间运行或消耗过多资源的查询对系统产生负面影响。当查询超过预设的资源或时间限制时，熔断机制会自动终止该查询，以避免对系统性能、资源使用以及其他查询造成不利影响。这种机制确保了集群在多用户环境下的稳定性，防止单个查询导致系统资源耗尽、响应变慢，从而提高整体的可用性和效率。

在 Doris 内，有两种熔断策略：

- 规划时熔断，即 SQL Block Rule，用于阻止符合特定模式的语句执行。阻止规则对任意的语句生效，包括 DDL 和 DML。通常，阻止规则由数据库管理员（DBA）进行配置，用以提升集群的稳定性。比如，
    
    - 阻止一个查询扫描过多行的数据
    
    - 阻止一个查询扫描过多的分区
    
    - 阻止一个修改全局变量的语句，以防止集群配置被意外的修改。
    
    - 阻止一个通常会占用非常多资源的查询模式

- 运行时熔断，即 Workload Policy，它是在运行时，实时监测查询的执行时间，扫描的数据量，消耗的内存，实现基于规则的查询熔断。

## SQL Block Rule
按照阻止模式，可以分为：

- 扫描行数阻止规则
- 扫描分区数阻止规则
- 扫描分桶数阻止规则
- 查询语句正则匹配阻止规则
- 查询语句哈希值匹配阻止规则

阻止规则按照阻止范围，可以分为：

- 全局级别阻止规则
- 用户级别阻止规则

### 使用方法

#### 全局级别阻止规则

```sql
CREATE SQL_BLOCK_RULE rule_001
PROPERTIES (
  "sql"="select \\* from t",
  "global" = "true",
  "enable" = "true"
)
```

这样，我们就创建了一个全局级别的阻止规则。规则名为 rule_001。配置了查询语句正则匹配规则，用于阻止所有可以被正则 `select \\* from t` 所匹配的查询语句。

由于是全局级别的阻止规则，所以任意用户执行可以被上述正则匹配的语句都会被阻止。例如：

```sql
MySQL root@127.0.0.1:test> select * from t;
(1105, 'errCode = 2, detailMessage = errCode = 2, detailMessage = SQL match regex SQL block rule: rule_001')
```

#### 用户级别阻止规则

```sql
CREATE SQL_BLOCK_RULE rule_001
PROPERTIES (
  "sql"="select * from t",
  "global" = "false",
  "enable" = "true"
)
```

不同于全局级别的阻止规则。用户级别的阻止规则只对指定用户生效。当我们创建阻止规则时，设置属性"global"为"false"。那么这个阻止规则，将被视为用户级别的阻止规则。

为了使得用户级别的阻止规则生效。还需要为需要使用此规则的用户设置相应的属性。例如：

```sql
set property for 'root' 'SQL_block_rules' = 'rule_001';
```

这样，经过上面的配置，root 用户在执行查询时，将被应用名为 rule_001 的阻止规则。

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
- 如果想对一个用户添加多个用户级别的阻止规则。在规则列表中列举所有的规则名字，以英文逗号隔开。
- 如果想移除一个用户的所有用户级别阻止规则。将规则列表置为空字符串即可。

#### 其他操作
如果需要修改或者删除阻止规则，可以参考阻止规则的 SQL 手册。

### 使用场景
可以在以下几种场景使用：

* 阻止扫描超过指定行数的数据

* 阻止扫描超过指定分区数量的数据

* 阻止扫描超过指定分桶数量的数据

* 阻止特定模式的查询

#### 阻止扫描超过指定行数的数据
由于扫描数据会显著消耗 BE 的 IO 资源和 CPU 资源。所以，不必要的数据扫描会对集群的稳定性带来比较大的挑战。日常使用中，经常会出现盲目的全表扫描操作。例如 `SELECT * FROM t`。为了防止这种查询对集群产生破坏。可以设置单个查询扫描单表行数的上限。

```sql
CREATE SQL_BLOCK_RULE rule_card 
PROPERTIES
(
   "cardinality" = "1000",
   "global" = "true",
   "enable" = "true"
);
```
当设置了如上的规则，当单表扫描超过 1000 行时，将禁止此查询的执行。
需要注意，由于扫描行数的计算是在规划阶段，而非执行阶段完成的。所以计算行数时，只会考虑分区和分桶裁剪，而不会考虑其他过滤条件对于扫描行数的影响。也就是考虑最坏情况。所以，实际扫描的行数小于设置值的查询也有可能被阻止。

#### 阻止扫描超过指定分区数量的数据
对过多分区的扫描会显著的增加 BE 的 CPU 消耗。同时，如果查询的外表，那更有可能带来显著的网络开销和元数据拉取的开销。在日常使用中，这多是由于忘记写分区列上的过滤条件或者写错导致的。为了防止这种查询对集群产生破坏。可以设置单个查询扫描单表的分区数的上限。

```sql
CREATE SQL_BLOCK_RULE rule_part_num 
PROPERTIES
(
   "partition_num" = "30",
   "global" = "true",
   "enable" = "true"
);
```
当设置了如上的规则，当单表扫描分区数超过 30 个时，则禁止此查询的执行。
需要注意的是，由于扫描分区数的计算是在规划阶段，而非执行阶段完成的。所以有可能出现因为分区裁剪不完全，而保留了更多分区的情况。所以，实际扫描的分区数小于设置值的查询也有可能被阻止。

#### 阻止扫描超过指定分桶数量的数据
对过多分桶的扫描会显著的增加 BE 的 CPU 消耗。为了防止这种查询对集群产生破坏。可以设置单个查询扫描单表的分区数的上限。

```sql
CREATE SQL_BLOCK_RULE rule_teblet_num 
PROPERTIES
(
   "tablet_num" = "200",
   "global" = "true",
   "enable" = "true"
);
```
当设置了如上的规则，当单表扫描分桶数量超过 200 个时，则禁止此查询的执行。
需要注意的是，由于扫描分桶数的计算是在规划阶段，而非执行阶段完成的。所以有可能出现因为分桶裁剪不完全，而保留了更多分区的情况。所以，实际扫描的分桶数小于设置值的查询也有可能被阻止。

#### 阻止特定模式的查询
由于各种原因，比如计算复杂度高，规划时间长等，可能会希望阻止使用模式的查询。
以阻止函数 abs 举例。可以使用如下的正则表达式阻止规则，完成此目的。

```sql
CREATE SQL_BLOCK_RULE rule_abs
PROPERTIES(
  "sql"="(?i)abs\\s*\\(.+\\)",
  "global"="true",
  "enable"="true"
);
```

上述正则表达式中

- (?i) 表示大小写不敏感

- abs 为想要阻止的目标函数

- \\s*表示在 abs 和左括号之间可以有任意个空白

- \\(.+\\) 匹配函数参数
  同理，也可以使用类似的方法阻止 set global，以防止非预期的变量改变。或者阻止 truncate table，以防止非预期的删除数据。

### 常见问题

#### Q：正则匹配阻止规则会对集群产生副作用吗？
A：是的。由于正则匹配是计算密集型的。当使用复杂的正则表达式，或者正则匹配规则过多时。会给 FE 的 CPU 带来显著的压力提升。所以，要谨慎添加正则匹配的阻止规则。除非必要，尽量不要使用复杂的正则表达式。

#### Q：可以临时关闭一个阻止规则吗？
A：可以。修改阻止规则，将其属性中的"enable"改为"false"即可。

#### Q：阻止规则中的正则表达式使用哪种规范？
A：阻止规则的正则表达式使用 java 的正则表达式规范。常用表达式可以参考 SQL 语法手册。完整的手册可以参考 https://docs.oracle.com/javase/8/docs/api/java/util/regex/Pattern.html

## Workload Policy

SQL Block Rule 是一种在规划时进行熔断的配置，但是由于规划中代价的计算可能不准确（尤其是针对一些非常复杂的查询时，更加难以准确估算），所以会导致规则不生效或者误判。Workload Policy 弥补了这个缺陷，它可以在查询运行时对一些指标进行实时的监测，对运行时状态不符合预期的查询进行熔断，避免不符合预期的大查询占用过多资源从而影响集群的稳定性，常用的运行时监控指标如下：

* 查询执行时间
* 查询在单 BE 上的扫描行数
* 查询在单 BE 上的扫描行数扫描字节数
* 查询的在单 BE 上的内存使用

### 版本说明

自 Doris 2.1 版本起，可以通过 Workload Policy 可以实现大查询的熔断。

| 版本                 | 自2.1起 |
|--------------------|-------|
| select             | 支持    |
| insert into select | 支持    |
| insert into values | 不支持   |
| stream load        | 支持    |
| routine load       | 支持    |
| backup             | 不支持   |
| compaction         | 不支持   |

### 创建熔断策略
使用 `CREATE WORKLOAD Policy` 命令可以创建资源管理策略。

在下面的例子中创建一个名为 test_cancel_Policy 的 Policy，它会取消掉集群中运行时间超过 1000ms 的查询，当前状态为启用。创建 Workload Policy 需要 admin_priv 权限。

```sql
create workload Policy test_cancel_Policy
Conditions(query_time > 1000)
Actions(cancel_query) 
properties('enabled'='true'); 
```

在创建 Workload Policy 时需要指定以下内容：
- Condition 表示策略触发条件，可以多个 Condition 串联，使用逗号“,”隔开，表示“与”的关系。在上例中 query_time > 1000 表示在查询时间大于 1s 时触发 Policy；目前支持的 Conditions 有：

| Conditions            | 说明                                                                  |
|-----------------------|---------------------------------------------------------------------|
| username              | 查询携带的用户名，只会在 FE 触发 set_session_variable Action                        |
| be_scan_rows          | 一个 SQL 在单个 BE 进程内 scan 的行数，如果这个 SQL 在 BE 上是多并发执行，那么就是多个并发的累加值。      |
| be_scan_bytes         | 一个 SQL 在单个 BE 进程内 scan 的字节数，如果这个 SQL 在 BE 上是多并发执行，那么就是多个并发的累加值，单位是字节。 |
| query_time            | 一个 SQL 在单个 BE 进程上的运行时间，时间单位是毫秒。                                     |
| query_be_memory_bytes | 一个 SQL 在单个 BE 进程内使用的内存用量，如果这个 SQL 在 BE 上是多并发执行，那么就是多个并发的累加值，单位是字节。  |

- Action 表示条件触发时采取的动作，目前一个 Policy 只能定义一个 Action（除 set_session_variable）。在上例中，cancel_query 表示取消查询；目前支持的 Actions 有：

| Actions               | 说明                                                                                                   |
|-----------------------|------------------------------------------------------------------------------------------------------|
| cancel_query              | 取消查询。                                                                                                |
| set_session_variable          | 触发 set session variable 语句。同一个 policy 可以有多个 set_session_variable 选项，目前只会在 FE 由 username Condition 触发 |


- Properties，定义了当前 Policy 的属性，包括是否启用和优先级。

| Properties               | 说明                                                                                                 |
|-----------------------|----------------------------------------------------------------------------------------------------|
| enabled              | 取值为 true 或 false，默认值为 true，表示当前 Policy 处于启用状态，false 表示当前 Policy 处于禁用状态                             |
| priority          | 取值范围为 0 到 100 的正整数，默认值为 0，代表 Policy 的优先级，该值越大，优先级越高。这个属性的主要作用是，当查询匹配到多个 Policy 时，只选择优先级最高的 Policy。 |
| workload_group         | 目前一个 Policy 可以绑定一个 workload group，代表这个 Policy 只对某个 Workload Group 的查询生效。默认为空，代表对所有查询生效。            |

### 将熔断策略绑定 Workload Group
默认情况下，Workload Policy 会对所有支持的查询生效。如果想指定 Policy 只针对与某一个 Workload Group，需要通过 workload_group 选项绑定 Workload Group。语句如下：

```sql
create workload Policy test_cancel_big_query
Conditions(query_time > 1000)
Actions(cancel_query) 
properties('workload_group'='normal')
```

### 注意事项
- 同一个 Policy 的 Condition 和 Action 要么都是 FE 的，要么都是 BE 的，比如 set_session_variable 和 cancel_query 无法配置到同一个 Policy 中。Condition be_scan_rows 和 Condition username 无法配置到同一个 Policy 中。
- 由于目前的 Policy 是异步线程以固定时间间隔执行的，因此策略的生效存在一定的滞后性。比如用户配置了 scan 行数大于 100 万就取消查询的策略，如果此时集群资源比较空闲，那么有可能在取消策略生效之前查询就已经结束了。目前这个时间间隔为 500ms，这意味着运行时间过短的查询可能会绕过策略的检查。
- 当前支持的负载类型包括 select/insert select/stream load/broker load/routine load。
- 一个查询可能匹配到多个 Policy，但是只有优先级最高的 Policy 会生效。
- 目前不支持 Action 和 Condition 的修改，只能通过删除新建的方式修改。

### Workload Policy 效果演示

#### 1 session 变量修改测试
尝试修改 Admin 账户的 session 变量中的并发相关的参数

```sql
// 登录 admin账户查看并发参数
mySQL [(none)]>show variables like '%parallel_fragment_exec_instance_num%';
+-------------------------------------+-------+---------------+---------+
| Variable_name                       | Value | Default_Value | Changed |
+-------------------------------------+-------+---------------+---------+
| parallel_fragment_exec_instance_num | 8     | 8             | 0       |
+-------------------------------------+-------+---------------+---------+
1 row in set (0.00 sec)

// 创建修改admin账户并发参数的Policy
create workload Policy test_set_var_Policy
Conditions(username='admin')
Actions(set_session_variable 'parallel_fragment_exec_instance_num=1') 

// 过段时间后再次查看admin账户的参数
mySQL [(none)]>show variables like '%parallel_fragment_exec_instance_num%';
+-------------------------------------+-------+---------------+---------+
| Variable_name                       | Value | Default_Value | Changed |
+-------------------------------------+-------+---------------+---------+
| parallel_fragment_exec_instance_num | 1     | 8             | 1       |
+-------------------------------------+-------+---------------+---------+
1 row in set (0.01 sec)
```

#### 2 大查询熔断测试
测试对运行时间超过 3s 的查询进行熔断，以下是一个 ckbench 的 q29 运行成功时的审计日志，可以看到这个 SQL 跑完需要 4.5s 的时间

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

创建一个运行时间超过 3s 就取消查询的 Policy
```sql
create workload Policy test_cancel_3s_query
Conditions(query_time > 3000)
Actions(cancel_query) 
```

再次执行 SQL 可以看到 SQL 执行会直接报错
```sql
mySQL [hits]>SELECT REGEXP_REPLACE(Referer, '^https?://(?:www\.)?([^/]+)/.*$', '\1') AS k, AVG(length(Referer)) AS l, COUNT(*) AS c, MIN(Referer) FROM hits WHERE Referer <> '' GROUP BY k HAVING COUNT(*) > 100000 ORDER BY l DESC LIMIT 25;
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[CANCELLED]query cancelled by workload Policy,id:12345
```

