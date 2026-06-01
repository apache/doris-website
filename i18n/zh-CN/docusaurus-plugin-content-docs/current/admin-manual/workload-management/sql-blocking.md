---
{
    "title": "查询熔断：SQL Block Rule 与 Workload Policy 配置指南",
    "sidebar_label": "查询熔断",
    "language": "zh-CN",
    "description": "介绍如何通过 SQL Block Rule 和 Workload Policy 阻止全表扫描、限制查询资源占用，防止异常大查询拖垮集群。",
    "keywords": ["查询熔断", "SQL Block Rule", "Workload Policy", "全表扫描限制", "大查询治理", "集群稳定性"]
}
---

<!-- 知识类型: 概念说明 + 操作步骤 -->

查询熔断是一种保护机制，用于防止长时间运行或消耗过多资源的查询影响集群稳定性。当查询超过预设的资源或时间限制时，熔断机制自动终止该查询，避免单个查询耗尽系统资源、拖慢其他业务。

Doris 提供两种熔断策略，分别作用于查询生命周期的不同阶段：

| 对比维度 | SQL Block Rule（规划时熔断） | Workload Policy（运行时熔断） |
|---------|--------------------------|---------------------------|
| 生效阶段 | 查询规划阶段，执行前拦截 | 查询执行阶段，运行中熔断 |
| 判断依据 | 预估扫描量、SQL 模式匹配 | 实际执行时间、内存占用、扫描量等实时指标 |
| 准确性 | 基于代价估算，可能存在误判 | 基于实时监测，更加准确 |
| 适用场景 | 阻止已知危险 SQL 模式和全表扫描 | 熔断运行中超出预期的大查询 |
| 适用语句 | 任意语句（DDL、DML） | select、insert into select、stream load、routine load |

## SQL Block Rule

<!-- 知识类型: 概念说明 -->

SQL Block Rule（SQL 阻止规则）在查询**规划阶段**拦截符合特定模式的语句，阻止其进入执行阶段。通常由 DBA 配置，用于防止全表扫描、危险函数调用等已知风险操作。

### 规则属性说明

每条规则由以下属性定义其行为和作用范围：

| 属性 | 说明 | 取值 |
|------|------|------|
| `sql` | 匹配查询语句的正则表达式 | Java 正则表达式字符串 |
| `sqlHash` | 匹配查询语句的哈希值 | SQL 哈希值字符串 |
| `cardinality` | 允许扫描的最大行数 | 正整数 |
| `partition_num` | 允许扫描的最大分区数 | 正整数 |
| `tablet_num` | 允许扫描的最大分桶数 | 正整数 |
| `global` | 是否为全局规则 | `"true"`（全局生效）/ `"false"`（仅对绑定用户生效） |
| `enable` | 是否启用规则 | `"true"` / `"false"` |

### 使用场景与示例

<!-- 知识类型: 操作步骤 -->

#### 场景一：限制扫描行数

**问题**：`SELECT * FROM t` 等全表扫描操作会大量消耗 BE 的 IO 和 CPU 资源。

**方案**：设置单表扫描行数上限，超过阈值的查询将被阻止。

```sql
CREATE SQL_BLOCK_RULE rule_card 
PROPERTIES
(
    "cardinality" = "1000",
    "global" = "true",
    "enable" = "true"
);
```

单表扫描超过 1000 行时，查询将被拒绝执行。

#### 场景二：限制扫描分区数

**问题**：扫描过多分区会显著增加 BE 的 CPU 消耗；查询外表时还会带来额外的网络开销和元数据拉取开销，通常由遗漏或写错分区过滤条件导致。

**方案**：设置单次查询可扫描的最大分区数。

```sql
CREATE SQL_BLOCK_RULE rule_part_num 
PROPERTIES
(
    "partition_num" = "30",
    "global" = "true",
    "enable" = "true"
);
```

单表扫描分区数超过 30 个时，查询将被拒绝执行。

#### 场景三：限制扫描分桶数

**问题**：扫描过多分桶同样会显著增加 BE 的 CPU 消耗。

**方案**：设置单次查询可扫描的最大分桶数。

```sql
CREATE SQL_BLOCK_RULE rule_tablet_num 
PROPERTIES
(
    "tablet_num" = "200",
    "global" = "true",
    "enable" = "true"
);
```

单表扫描分桶数超过 200 个时，查询将被拒绝执行。

#### 场景四：阻止特定 SQL 模式

**问题**：某些查询模式（如调用特定函数、执行危险操作）可能导致计算复杂度过高或规划时间过长。

**方案**：通过正则表达式匹配阻止这类查询。

**示例 1：阻止使用特定函数**

以下规则阻止所有包含 `abs` 函数的查询：

```sql
CREATE SQL_BLOCK_RULE rule_abs
PROPERTIES(
    "sql"="(?i)abs\\s*\\(.+\\)",
    "global"="true",
    "enable"="true"
);
```

正则说明：

- `(?i)`：大小写不敏感匹配
- `abs`：目标函数名
- `\\s*`：允许函数名与左括号之间有任意空白
- `\\(.+\\)`：匹配函数参数部分

**示例 2：阻止危险操作**

同理，可用正则阻止 `set global`（防止非预期的变量修改）或 `truncate table`（防止非预期的数据删除）。

> 正则表达式使用 Java 规范，详见 [Pattern 文档](https://docs.oracle.com/javase/8/docs/api/java/util/regex/Pattern.html)。

#### 场景五：针对特定用户设置规则

**问题**：默认规则全局生效，但某些场景下只需对特定用户启用限制。

**方案**：创建非全局规则并绑定到目标用户。

1. 创建规则时将 `global` 设为 `"false"`：

    ```sql
    CREATE SQL_BLOCK_RULE rule_001
    PROPERTIES (
        "sql"="select \\* from t",
        "global" = "false",
        "enable" = "true"
    );
    ```

2. 将规则绑定到目标用户：

    ```sql
    SET PROPERTY FOR 'root' 'SQL_block_rules' = 'rule_001';
    ```

3. 验证规则已生效：

    ```sql
    MySQL root@127.0.0.1:test> select * from t;
    (1105, 'errCode = 2, detailMessage = errCode = 2, detailMessage = SQL match regex SQL block rule: rule_001')
    ```

**多规则管理**：

- 为一个用户绑定多条规则：在规则列表中以英文逗号分隔所有规则名，例如 `'rule_001,rule_002'`。
- 移除用户的所有规则：将规则列表置为空字符串，例如 `SET PROPERTY FOR 'root' 'SQL_block_rules' = '';`。

### 注意事项

- **估算方式**：扫描行数、分区数、分桶数均在规划阶段基于最坏情况估算（仅考虑分区裁剪和分桶裁剪，不计其他过滤条件），实际扫描量小于设置值的查询也可能被阻止。
- **性能影响**：正则匹配是计算密集型操作，过多或过于复杂的正则规则会给 FE 的 CPU 带来显著压力，建议谨慎添加。
- **临时关闭规则**：将规则属性中的 `"enable"` 修改为 `"false"` 即可临时禁用，无需删除规则。

## Workload Policy

<!-- 知识类型: 概念说明 -->

Workload Policy（负载策略）在查询**运行时**对实时指标进行监测，并对超出预期的查询执行熔断或变量调整等动作。相比 SQL Block Rule 的静态规划估算，Workload Policy 基于实际运行数据，判断更加准确。

Workload Policy 自 Doris 2.1 版本起支持，各负载类型的支持情况如下：

| 负载类型 | 是否支持 |
|---------|---------|
| select | 支持 |
| insert into select | 支持 |
| insert into values | 不支持 |
| stream load | 支持 |
| routine load | 支持 |
| backup | 不支持 |
| compaction | 不支持 |

### 创建与配置

<!-- 知识类型: 操作步骤 -->

使用 `CREATE WORKLOAD POLICY` 命令创建策略，需要 `admin_priv` 权限。

**基本语法**：

```sql
CREATE WORKLOAD POLICY <policy_name>
CONDITIONS(<condition_expr>)
ACTIONS(<action_expr>) 
PROPERTIES('<key>'='<value>');
```

以下示例创建一个取消运行时间超过 1000 ms 的查询的策略：

```sql
CREATE WORKLOAD POLICY test_cancel_policy
CONDITIONS(query_time > 1000)
ACTIONS(cancel_query) 
PROPERTIES('enabled'='true'); 
```

#### 触发条件（Conditions）

Conditions 表示策略的触发条件，多个条件之间以逗号 `,` 分隔，表示"与"关系。

| Condition | 说明 |
|-----------|------|
| `username` | 查询携带的用户名，只会在 FE 触发 `set_session_variable` Action |
| `be_scan_rows` | 一个 SQL 在单个 BE 进程内扫描的行数，多并发执行时为累加值 |
| `be_scan_bytes` | 一个 SQL 在单个 BE 进程内扫描的字节数，多并发执行时为累加值（单位：字节） |
| `query_time` | 一个 SQL 在单个 BE 进程上的运行时间（单位：毫秒） |
| `query_be_memory_bytes` | 一个 SQL 在单个 BE 进程内使用的内存量，多并发执行时为累加值（单位：字节） |

#### 执行动作（Actions）

Actions 表示条件触发时采取的动作。目前一个 Policy 只能定义一个 Action（`set_session_variable` 除外）。

| Action | 说明 |
|--------|------|
| `cancel_query` | 取消查询 |
| `set_session_variable` | 执行 set session variable 语句；同一个 Policy 可包含多个该选项，目前只会在 FE 由 `username` Condition 触发 |

#### 策略属性（Properties）

| Property | 说明 | 默认值 |
|----------|------|--------|
| `enabled` | 是否启用，取值为 `true` 或 `false` | `true` |
| `priority` | 优先级，取值范围 0～100，值越大优先级越高；多个 Policy 匹配时只有优先级最高的生效 | `0` |
| `workload_group` | 绑定的 Workload Group 名称，指定后 Policy 仅对该 Workload Group 的查询生效；为空时对所有查询生效 | 空（全局） |

#### 绑定 Workload Group

如需将策略限定在某个 Workload Group 内，通过 `workload_group` 属性绑定：

```sql
CREATE WORKLOAD POLICY test_cancel_big_query
CONDITIONS(query_time > 1000)
ACTIONS(cancel_query) 
PROPERTIES('workload_group'='normal');
```

:::caution 存算分离模式必须使用完整限定形式
上例中的 `'workload_group'='normal'` 仅适用于**存算一体模式**。**存算分离模式（Cloud 模式）下必须使用 `<compute_group>.<workload_group>` 完整限定形式**，例如 `'workload_group'='compute_group_a.normal'`，否则会报错：`workload_group must be '<compute_group>.<workload_group>' in cloud mode`。详见 [CREATE WORKLOAD POLICY](../../sql-manual/sql-statements/cluster-management/compute-management/CREATE-WORKLOAD-POLICY)。
:::

### 使用示例

<!-- 知识类型: 操作步骤 -->

#### 示例一：熔断超时查询

以下审计日志显示，某个 SQL 正常执行需要 4.5 秒：

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

创建一个运行时间超过 3 秒即取消查询的策略：

```sql
CREATE WORKLOAD POLICY test_cancel_3s_query
CONDITIONS(query_time > 3000)
ACTIONS(cancel_query); 
```

再次执行同一 SQL，查询被熔断：

```sql
MySQL [hits]> SELECT REGEXP_REPLACE(Referer, '^https?://(?:www\\.)?([^/]+)/.*$', '\\1') AS k, AVG(length(Referer)) AS l, COUNT(*) AS c, MIN(Referer) FROM hits WHERE Referer <> '' GROUP BY k HAVING COUNT(*) > 100000 ORDER BY l DESC LIMIT 25;
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[CANCELLED]query cancelled by workload policy,id:12345
```

#### 示例二：自动调整用户 Session 变量

通过 Workload Policy 可自动修改特定用户的 session 变量，例如降低其并发度以减少资源占用：

```sql
-- 查看 admin 用户当前并发参数
MySQL [(none)]> show variables like '%parallel_fragment_exec_instance_num%';
+-------------------------------------+-------+---------------+---------+
| Variable_name                       | Value | Default_Value | Changed |
+-------------------------------------+-------+---------------+---------+
| parallel_fragment_exec_instance_num | 8     | 8             | 0       |
+-------------------------------------+-------+---------------+---------+
1 row in set (0.00 sec)

-- 创建策略：将 admin 用户的并发参数调整为 1
CREATE WORKLOAD POLICY test_set_var_policy
CONDITIONS(username='admin')
ACTIONS(set_session_variable 'parallel_fragment_exec_instance_num=1');

-- 稍后再次查看，参数已生效
MySQL [(none)]> show variables like '%parallel_fragment_exec_instance_num%';
+-------------------------------------+-------+---------------+---------+
| Variable_name                       | Value | Default_Value | Changed |
+-------------------------------------+-------+---------------+---------+
| parallel_fragment_exec_instance_num | 1     | 8             | 1       |
+-------------------------------------+-------+---------------+---------+
1 row in set (0.01 sec)
```

### 注意事项

- **FE/BE 侧隔离**：同一个 Policy 的 Condition 和 Action 必须属于同一侧（FE 或 BE）。例如，`set_session_variable`（FE 侧）和 `cancel_query`（BE 侧）不能配置在同一 Policy 中；`username`（FE 侧）和 `be_scan_rows`（BE 侧）同理。
- **异步执行延迟**：Policy 由异步线程每 500 ms 执行一次检查，策略生效存在一定滞后。运行时间极短的查询可能会在检查触发前已完成，从而绕过策略。
- **优先级机制**：一个查询可能匹配多个 Policy，但只有优先级最高（`priority` 值最大）的 Policy 会生效。
- **修改限制**：目前不支持直接修改已有 Policy 的 Action 和 Condition，需删除后重新创建。
