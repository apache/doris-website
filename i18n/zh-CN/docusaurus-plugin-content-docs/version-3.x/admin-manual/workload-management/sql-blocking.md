---
{
    "title": "查询熔断",
    "language": "zh-CN",
    "description": "Apache Doris 查询熔断机制，支持 SQL Block Rule（规划时阻止）和 Workload Policy（运行时熔断）两种策略，通过限制扫描行数、分区数、执行时间、内存等指标，自动终止异常查询，保障集群稳定性。"
}
---

查询熔断是一种保护机制，用于防止长时间运行或消耗过多资源的查询对系统产生负面影响。当查询超过预设的资源或时间限制时，熔断机制会自动终止该查询，以避免对系统性能、资源使用以及其他查询造成不利影响。这种机制确保了集群在多用户环境下的稳定性，防止单个查询导致系统资源耗尽、响应变慢，从而提高整体的可用性和效率。

Doris 提供了两种熔断策略，分别在查询生命周期的不同阶段发挥作用：

| 对比维度 | SQL Block Rule（规划时熔断） | Workload Policy（运行时熔断） |
|---------|--------------------------|---------------------------|
| 生效阶段 | 查询规划阶段，执行前拦截 | 查询执行阶段，运行中熔断 |
| 判断依据 | 预估扫描量、SQL 模式匹配 | 实际执行时间、内存占用、扫描量等实时指标 |
| 准确性 | 基于代价估算，可能存在误判 | 基于实时监测，更加准确 |
| 适用场景 | 阻止已知的危险 SQL 模式和全表扫描 | 熔断运行中超出预期的大查询 |
| 适用语句 | 任意语句（DDL、DML） | select、insert into select、stream load、routine load |

## SQL Block Rule

SQL Block Rule 用于在查询规划阶段阻止符合特定模式的语句执行，通常由数据库管理员（DBA）配置，用以提升集群稳定性。

每条规则通过以下属性来定义其行为和作用范围：

| 属性 | 说明 | 取值 |
|------|------|------|
| `sql` | 用于匹配查询语句的正则表达式 | Java 正则表达式字符串 |
| `sqlHash` | 用于匹配查询语句的哈希值 | SQL 哈希值字符串 |
| `cardinality` | 允许扫描的最大行数 | 正整数 |
| `partition_num` | 允许扫描的最大分区数 | 正整数 |
| `tablet_num` | 允许扫描的最大分桶数 | 正整数 |
| `global` | 是否为全局规则 | `"true"`（全局生效）或 `"false"`（仅对绑定用户生效） |
| `enable` | 是否启用规则 | `"true"` 或 `"false"` |

### 使用场景与示例

#### 场景一：限制扫描行数

日常使用中，经常会出现盲目的全表扫描操作，例如 `SELECT * FROM t`。扫描数据会显著消耗 BE 的 IO 和 CPU 资源，对集群稳定性带来较大挑战。可以通过设置单个查询扫描单表行数的上限来防止此类操作：

```sql
CREATE SQL_BLOCK_RULE rule_card 
PROPERTIES
(
   "cardinality" = "1000",
   "global" = "true",
   "enable" = "true"
);
```

当单表扫描超过 1000 行时，将禁止此查询的执行。

#### 场景二：限制扫描分区数

对过多分区的扫描会显著增加 BE 的 CPU 消耗。同时，如果查询的是外表，还可能带来显著的网络开销和元数据拉取开销。这多是由于忘记写分区列上的过滤条件或者写错导致的。可以通过设置分区数上限来避免此类问题：

```sql
CREATE SQL_BLOCK_RULE rule_part_num 
PROPERTIES
(
   "partition_num" = "30",
   "global" = "true",
   "enable" = "true"
);
```

当单表扫描分区数超过 30 个时，则禁止此查询的执行。

#### 场景三：限制扫描分桶数

对过多分桶的扫描同样会显著增加 BE 的 CPU 消耗。可以通过设置分桶数上限来避免此类问题：

```sql
CREATE SQL_BLOCK_RULE rule_teblet_num 
PROPERTIES
(
   "tablet_num" = "200",
   "global" = "true",
   "enable" = "true"
);
```

当单表扫描分桶数量超过 200 个时，则禁止此查询的执行。

#### 场景四：阻止特定 SQL 模式

某些查询模式可能导致计算复杂度高、规划时间长等问题，可以通过正则表达式匹配来阻止这些查询。

**示例一：阻止使用特定函数**

以阻止函数 `abs` 为例：

```sql
CREATE SQL_BLOCK_RULE rule_abs
PROPERTIES(
  "sql"="(?i)abs\\s*\\(.+\\)",
  "global"="true",
  "enable"="true"
);
```

上述正则表达式中：

- `(?i)` 表示大小写不敏感
- `abs` 为想要阻止的目标函数
- `\\s*` 表示在 abs 和左括号之间可以有任意个空白
- `\\(.+\\)` 匹配函数参数

**示例二：阻止其他危险操作**

同理，也可以使用类似的方法阻止 `set global`，以防止非预期的变量改变。或者阻止 `truncate table`，以防止非预期的删除数据。

#### 场景五：针对特定用户设置规则

默认情况下，阻止规则全局生效（`"global" = "true"`）。如需仅对特定用户生效，可以创建用户级别的阻止规则：

1. 创建规则时设置 `"global"` 为 `"false"`：

    ```sql
    CREATE SQL_BLOCK_RULE rule_001
    PROPERTIES (
      "sql"="select * from t",
      "global" = "false",
      "enable" = "true"
    )
    ```

2. 将规则绑定到目标用户：

    ```sql
    SET PROPERTY FOR 'root' 'SQL_block_rules' = 'rule_001';
    ```

3. 验证规则生效：

    ```sql
    MySQL root@127.0.0.1:test> select * from t;
    (1105, 'errCode = 2, detailMessage = errCode = 2, detailMessage = SQL match regex SQL block rule: rule_001')
    ```

- 如果想对一个用户添加多个规则，在规则列表中列举所有的规则名字，以英文逗号隔开。
- 如果想移除一个用户的所有规则，将规则列表置为空字符串即可：`SET PROPERTY FOR 'root' 'SQL_block_rules' = '';`

如果需要修改或者删除阻止规则，可以参考阻止规则的 SQL 手册。

### 注意事项

- 扫描行数、分区数、分桶数的计算均在规划阶段完成，只会考虑分区和分桶裁剪，不会考虑其他过滤条件的影响（即按最坏情况估算）。因此，实际扫描量小于设置值的查询也有可能被阻止。
- 正则匹配是计算密集型操作，过多或过于复杂的正则规则会给 FE 的 CPU 带来显著压力。建议谨慎添加，除非必要，尽量不要使用复杂的正则表达式。
- 如需临时关闭某条规则，修改其属性中的 `"enable"` 为 `"false"` 即可。
- 阻止规则的正则表达式使用 Java 的正则表达式规范，完整手册可参考 https://docs.oracle.com/javase/8/docs/api/java/util/regex/Pattern.html

## Workload Policy

SQL Block Rule 在规划阶段进行熔断，但由于规划中的代价估算可能不准确（尤其是复杂查询），可能导致规则不生效或误判。Workload Policy 弥补了这一缺陷，它在查询运行时对实时指标进行监测，对不符合预期的查询进行熔断，避免大查询占用过多资源从而影响集群稳定性。

自 Doris 2.1 版本起支持 Workload Policy，各负载类型的支持情况如下：

| 负载类型           | 是否支持 |
|-------------------|---------|
| select             | 支持    |
| insert into select | 支持    |
| insert into values | 不支持  |
| stream load        | 支持    |
| routine load       | 支持    |
| backup             | 不支持  |
| compaction         | 不支持  |

### 创建与配置

使用 `CREATE WORKLOAD POLICY` 命令创建策略。创建 Workload Policy 需要 admin_priv 权限。

以下示例创建一个名为 test_cancel_policy 的策略，它会取消运行时间超过 1000 ms 的查询：

```sql
CREATE WORKLOAD POLICY test_cancel_policy
CONDITIONS(query_time > 1000)
ACTIONS(cancel_query) 
PROPERTIES('enabled'='true'); 
```

创建 Workload Policy 时需要指定以下三个部分：

#### 触发条件（Conditions）

Conditions 表示策略的触发条件，多个 Condition 之间以逗号 `,` 分隔，表示"与"的关系。

| Condition             | 说明                                                                                          |
|-----------------------|-----------------------------------------------------------------------------------------------|
| username              | 查询携带的用户名，只会在 FE 触发 set_session_variable Action                                       |
| be_scan_rows          | 一个 SQL 在单个 BE 进程内 scan 的行数，多并发执行时为累加值                                           |
| be_scan_bytes         | 一个 SQL 在单个 BE 进程内 scan 的字节数，多并发执行时为累加值，单位是字节                                  |
| query_time            | 一个 SQL 在单个 BE 进程上的运行时间，单位是毫秒                                                      |
| query_be_memory_bytes | 一个 SQL 在单个 BE 进程内使用的内存用量，多并发执行时为累加值，单位是字节                                    |

#### 执行动作（Actions）

Actions 表示条件触发时采取的动作，目前一个 Policy 只能定义一个 Action（set_session_variable 除外）。

| Action               | 说明                                                                                                     |
|----------------------|------------------------------------------------------------------------------------------------------------|
| cancel_query         | 取消查询                                                                                                    |
| set_session_variable | 触发 set session variable 语句。同一个 Policy 可以有多个 set_session_variable 选项，目前只会在 FE 由 username Condition 触发 |

#### 策略属性（Properties）

| Property       | 说明                                                                                                         |
|----------------|--------------------------------------------------------------------------------------------------------------|
| enabled        | 是否启用，取值为 true 或 false，默认值为 true                                                                      |
| priority       | 优先级，取值范围为 0 到 100 的正整数，默认值为 0。值越大优先级越高，当查询匹配到多个 Policy 时，只有优先级最高的 Policy 生效 |
| workload_group | 绑定的 Workload Group 名称，指定后 Policy 仅对该 Workload Group 的查询生效。默认为空，表示对所有查询生效                  |

#### 绑定 Workload Group

默认情况下，Workload Policy 对所有支持的查询生效。如需仅针对某个 Workload Group 生效，可通过 `workload_group` 属性绑定：

```sql
CREATE WORKLOAD POLICY test_cancel_big_query
CONDITIONS(query_time > 1000)
ACTIONS(cancel_query) 
PROPERTIES('workload_group'='normal')
```

### 使用示例

#### 示例一：熔断超时查询

以下是一个 ckbench 的 q29 运行成功时的审计日志，可以看到该 SQL 需要 4.5s 完成：

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

创建一个运行时间超过 3s 就取消查询的 Policy：

```sql
CREATE WORKLOAD POLICY test_cancel_3s_query
CONDITIONS(query_time > 3000)
ACTIONS(cancel_query) 
```

再次执行 SQL，可以看到查询被熔断：

```sql
MySQL [hits]> SELECT REGEXP_REPLACE(Referer, '^https?://(?:www\\.)?([^/]+)/.*$', '\\1') AS k, AVG(length(Referer)) AS l, COUNT(*) AS c, MIN(Referer) FROM hits WHERE Referer <> '' GROUP BY k HAVING COUNT(*) > 100000 ORDER BY l DESC LIMIT 25;
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[CANCELLED]query cancelled by workload policy,id:12345
```

#### 示例二：修改用户 session 变量

通过 Workload Policy 可以自动修改特定用户的 session 变量，例如调整并发参数：

```sql
-- 登录 admin 账户查看并发参数
MySQL [(none)]> show variables like '%parallel_fragment_exec_instance_num%';
+-------------------------------------+-------+---------------+---------+
| Variable_name                       | Value | Default_Value | Changed |
+-------------------------------------+-------+---------------+---------+
| parallel_fragment_exec_instance_num | 8     | 8             | 0       |
+-------------------------------------+-------+---------------+---------+
1 row in set (0.00 sec)

-- 创建修改 admin 账户并发参数的 Policy
CREATE WORKLOAD POLICY test_set_var_policy
CONDITIONS(username='admin')
ACTIONS(set_session_variable 'parallel_fragment_exec_instance_num=1') 

-- 过段时间后再次查看 admin 账户的参数
MySQL [(none)]> show variables like '%parallel_fragment_exec_instance_num%';
+-------------------------------------+-------+---------------+---------+
| Variable_name                       | Value | Default_Value | Changed |
+-------------------------------------+-------+---------------+---------+
| parallel_fragment_exec_instance_num | 1     | 8             | 1       |
+-------------------------------------+-------+---------------+---------+
1 row in set (0.01 sec)
```

### 注意事项

- 同一个 Policy 的 Condition 和 Action 必须属于同一侧（FE 或 BE）。例如，set_session_variable 和 cancel_query 无法配置到同一个 Policy 中；Condition be_scan_rows 和 Condition username 也无法配置到同一个 Policy 中。
- Policy 由异步线程以固定时间间隔（当前为 500 ms）执行，因此策略生效存在一定滞后性。运行时间过短的查询可能会绕过策略检查。
- 一个查询可能匹配到多个 Policy，但只有优先级最高的 Policy 会生效。
- 目前不支持直接修改 Action 和 Condition，只能通过删除后重新创建的方式修改。
