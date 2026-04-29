---
{
    "title": "SQL Cache 查询缓存使用指南",
    "language": "zh-CN",
    "description": "如何在 Doris 中开启 SQL Cache 查询缓存？如何排查缓存未命中和失效原因？本指南覆盖原理、配置、监控与故障排查。",
    "keywords": ["Doris SQL Cache", "查询缓存", "查询加速", "缓存命中", "缓存失效", "enable_sql_cache", "T+1 查询优化"]
}
---

<!-- 知识类型：概念 + 操作指南 -->
<!-- 适用场景：希望通过缓存查询结果加速重复查询的用户 -->

## 一句话定义

SQL Cache 是 Doris 提供的查询结果缓存机制，将查询结果按 SQL 文本与数据版本等元数据缓存起来，使后续相同查询直接命中缓存返回，从而显著降低重复计算的开销。

## 阅读前 Checklist

在阅读本手册前，请确认你已了解或准备好以下内容：

- [ ] 你的查询场景是否适合缓存（例如 T+1 离线分析、低频更新的数据）
- [ ] 当前 Doris 版本是否支持 `explain plan` 查看 SQL Cache（建议 2.1.3+）
- [ ] 是否清楚 SQL Cache 仅支持 OlapTable 内部表与 Hive 外部表
- [ ] 是否了解非确定函数（如 `now()`、`random()`）会影响缓存命中率
- [ ] 是否拥有 FE/BE 的配置修改权限（用于内存控制与全局开关）

## 一、概念介绍

<!-- 知识类型：概念 -->
<!-- 适用场景：第一次了解 SQL Cache 的工作机制 -->

SQL Cache 适用于**数据更新频率较低**的查询场景，通过缓存查询结果避免重复计算。

### 缓存命中的关键因素

SQL Cache 基于以下因素的组合唯一确定一条缓存数据：

| 关键因素            | 说明                                 |
| ------------------- | ------------------------------------ |
| SQL 文本            | 完全一致的 SQL 字符串                |
| 视图定义            | 涉及视图的 DDL 定义                  |
| 表和分区的版本      | 数据是否发生过变更                   |
| 用户变量和结果值    | SQL 中引用的变量当前取值             |
| 非确定函数和结果值  | 例如 `now()`、`random()` 的运算结果  |
| 行策略定义          | Row Policy 配置                      |
| 数据脱敏定义        | Data Masking 配置                    |

> 任一因素发生变化（SQL 改写、查询字段或条件不同、数据更新导致版本变更等），缓存均不会命中。对于多表 Join 查询，**任一表更新**都会导致分区 ID 或版本号变更，进而无法命中缓存。

### 适用场景

- **强烈推荐**：T+1 更新场景。数据在凌晨更新，第一次查询从 BE 获取结果并写入缓存，后续相同查询直接从缓存返回。
- **可选使用**：实时更新数据。仍可启用 SQL Cache，但命中率较低。
- **支持范围**：当前支持 OlapTable 内部表与 Hive 外部表。

## 二、使用限制

<!-- 知识类型：限制说明 -->
<!-- 适用场景：编写 SQL 时优化缓存命中率 -->

### 非确定函数的影响

**定义**：非确定函数指其运算结果与输入参数之间无法形成固定关系的函数。

| 函数           | 行为说明                                                  | 是否可利用 Cache       |
| -------------- | --------------------------------------------------------- | ---------------------- |
| `now()`        | 返回当前秒级时间，每秒变化一次                            | 同一秒内可复用         |
| `date(now())`  | 将秒级时间转为日级粒度                                    | 同一天内可复用（推荐） |
| `random()`     | 每次调用结果都不同                                        | 几乎无法命中缓存       |

**优化建议**：将细粒度时间转为粗粒度时间，例如使用 `select * from tbl where dt = date(now())` 替代 `select * from tbl where dt = now()`，让同一天的查询都能命中缓存；尽量避免在查询中使用 `random()` 等强非确定函数。

## 三、实现原理

<!-- 知识类型：原理说明 -->
<!-- 适用场景：理解缓存命中行为，定位异常问题 -->

### FE 实现原理

FE 接收到查询请求后的处理流程：

1. **元数据查找**：在内存中以 SQL 字符串为 Key 查找元数据（包含表/分区版本）。
2. **版本比对**：若元数据未变化，说明数据未变更，可复用缓存。
3. **跳过解析**：跳过 SQL 解析与优化流程，依据一致性哈希定位到对应 BE。
4. **结果返回**：
    - 命中 BE 缓存：直接返回结果给客户端。
    - 未命中：执行完整的 SQL 解析、优化与计算流程。
5. **结果回写**：BE 计算完成后，FE 将结果存入对应 BE，并在自身内存中记录元数据，供下次查询复用。

> 特殊优化：若 SQL 优化阶段判断结果仅含 0 行或 1 行数据，FE 会将结果直接保存在自身内存中，以加速后续相同查询。

### BE 实现原理

- 通过**一致性哈希**选择一个 BE 存放结果，结果以 **HashMap** 结构存储于 BE 内存中。
- 读写 Cache 时，使用 SQL 字符串等元数据信息的摘要作为 Key，快速检索结果数据。

## 四、快速上手

<!-- 知识类型：操作指南 -->
<!-- 适用场景：开启 SQL Cache 并验证命中情况 -->

### 步骤 1：开启或关闭 SQL Cache

**目的**：在 Session 或全局级别启用 SQL Cache（默认关闭）。

```sql
-- 在当前 Session 打开 SQL Cache，默认是关闭状态
set enable_sql_cache=true;
-- 在当前 Session 关闭 SQL Cache
set enable_sql_cache=false;

-- 全局打开 SQL Cache，默认是关闭状态
set global enable_sql_cache=true;
-- 全局关闭 SQL Cache
set global enable_sql_cache=false;
```

**说明**：Session 级配置仅对当前会话生效；全局配置对所有新建 Session 生效。

### 步骤 2：检查查询是否命中 SQL Cache

#### 方法 A：使用 `explain plan`（适用于 Doris 2.1.3+）

**目的**：通过查询计划判断是否命中。
**命令**：执行 `explain plan <你的 SQL>`。
**说明**：当查询计划树中出现 `LogicalSqlCache` 或 `PhysicalSqlCache` 节点时，即表明查询命中了 SQL Cache。

```sql
> explain plan select * from t2;

+------------------------------------------------------------------------------------------------------------+
| Explain String(Nereids Planner)                                                                            |
+------------------------------------------------------------------------------------------------------------+
| ========== PARSED PLAN (time: 28ms) ==========                                                             |
| LogicalSqlCache[1] ( queryId=711dea740e4746e6-8bc11afe08f6542c )                                           |
| +--PhysicalResultSink[39] ( outputExprs=[id#0, name#1] )                                                   |
|    +--PhysicalOlapScan[t2]@0 ( stats=12 )                                                                  |
|                                                                                                            |
| ========== ANALYZED PLAN  ==========                                                                       |
| LogicalSqlCache[1] ( queryId=711dea740e4746e6-8bc11afe08f6542c )                                           |
| +--PhysicalResultSink[39] ( outputExprs=[id#0, name#1] )                                                   |
|    +--PhysicalOlapScan[t2]@0 ( stats=12 )                                                                  |
|                                                                                                            |
| ========== REWRITTEN PLAN  ==========                                                                      |
| LogicalSqlCache[1] ( queryId=711dea740e4746e6-8bc11afe08f6542c )                                           |
| +--PhysicalResultSink[39] ( outputExprs=[id#0, name#1] )                                                   |
|    +--PhysicalOlapScan[t2]@0 ( stats=12 )                                                                  |
|                                                                                                            |
| ========== OPTIMIZED PLAN  ==========                                                                      |
| PhysicalSqlCache[3] ( queryId=711dea740e4746e6-8bc11afe08f6542c, backend=192.168.126.3:9051, rowCount=12 ) |
| +--PhysicalResultSink[39] ( outputExprs=[id#0, name#1] )                                                   |
|    +--PhysicalOlapScan[t2]@0 ( stats=12 )                                                                  |
+------------------------------------------------------------------------------------------------------------+
```

#### 方法 B：查看 Profile（适用于 Doris 2.1.3 以前版本）

**目的**：在没有 `explain plan` 支持的版本中确认命中情况。
**命令**：开启 Profile 后查看 Execution Summary。
**说明**：若 `Is Cached:` 字段显示为 `Yes`，则表明该查询命中了 SQL Cache。

```sql
Execution  Summary:
      -  Parse  SQL  Time:  18ms
      -  Nereids  Analysis  Time:  N/A
      -  Nereids  Rewrite  Time:  N/A
      -  Nereids  Optimize  Time:  N/A
      -  Nereids  Translate  Time:  N/A
      -  Workload  Group:  normal
      -  Analysis  Time:  N/A
      -  Wait  and  Fetch  Result  Time:  N/A
      -  Fetch  Result  Time:  0ms
      -  Write  Result  Time:  0ms
      -  Doris  Version:  915138e801
      -  Is  Nereids:  Yes
      -  Is  Cached:  Yes
      -  Total  Instances  Num:  0
      -  Instances  Num  Per  BE:  
      -  Parallel  Fragment  Exec  Instance  Num:  1
      -  Trace  ID:  
      -  Transaction  Commit  Time:  N/A
      -  Nereids  Distribute  Time:  N/A
```

## 五、指标监控

<!-- 知识类型：可观测性 -->
<!-- 适用场景：监控缓存使用情况、评估优化效果 -->

### FE 监控指标

**接口**：`http://${FE_IP}:${FE_HTTP_PORT}/metrics`
**说明**：指标统计**只增不减**，FE 重启后从 0 重新计数。

```Plain
# 已经把 1 个 SQL 写入到缓存中
doris_fe_cache_added{type="sql"} 1

# 命中了 2 次 SQL Cache
doris_fe_cache_hit{type="sql"} 2
```

### BE 监控指标

**接口**：`http://${BE_IP}:${BE_HTTP_PORT}/metrics`
**说明**：不同 Cache 可能存放在不同 BE 中，需收集**所有 BE** 的 Metrics 才能得到完整信息。

```Plain
# 当前 BE 内存中存在 1205 个 Cache
doris_be_query_cache_sql_total_count 1205

# 当前所有 Cache 占用 BE 内存约 44KB
doris_be_query_cache_memory_total_byte 44101
```

## 六、内存控制

<!-- 知识类型：参数配置 -->
<!-- 适用场景：限制 SQL Cache 占用的内存资源 -->

### FE 内存控制

FE 中的 Cache 元数据使用**弱引用**：当 FE 内存不足时，自动释放最近最久未使用的元数据。同时支持以下参数限制：

| 参数                              | 默认值 | 含义                                                            |
| --------------------------------- | ------ | --------------------------------------------------------------- |
| `sql_cache_manage_num`            | 100    | 元数据条目上限，超过后自动释放最近最久未使用项                  |
| `expire_sql_cache_in_fe_second`   | 300    | 元数据过期时间（秒），超过未访问则自动释放                      |
| `cache_result_max_row_count`      | 3000   | 结果行数上限，超过则不创建 SQL Cache                            |
| `cache_result_max_data_size`      | 31457280 (30MB) | 结果大小上限（字节），超过则不创建 SQL Cache         |

**配置命令**（实时生效，每个 FE 都需配置；持久化需写入 `fe.conf`）：

```sql
-- 最多存放 100 个 Cache 元数据
ADMIN SET FRONTEND CONFIG ('sql_cache_manage_num'='100');

-- 300 秒未访问该 Cache 元数据后自动释放
ADMIN SET FRONTEND CONFIG ('expire_sql_cache_in_fe_second'='300');

-- 默认超过 3000 行结果时不创建 SQL Cache
ADMIN SET FRONTEND CONFIG ('cache_result_max_row_count'='3000');

-- 默认超过 30MB 时不创建 SQL Cache
ADMIN SET FRONTEND CONFIG ('cache_result_max_data_size'='31457280');
```

### BE 内存控制

| 参数                              | 默认值 (示例) | 含义                                                            |
| --------------------------------- | ------------- | --------------------------------------------------------------- |
| `query_cache_max_size_mb`         | 256           | Cache 占用内存的稳定上限                                        |
| `query_cache_elasticity_size_mb`  | 128           | 弹性扩展空间，超过 max+elasticity 时触发淘汰至 max 之下         |

**配置文件**：`be.conf`（修改后需重启 BE 生效）。

```conf
-- 当 Cache 内存空间超过 query_cache_max_size_mb + query_cache_elasticity_size_mb 时，
-- 释放最近最久未使用的 Cache，直至占用内存低于 query_cache_max_size_mb。
query_cache_max_size_mb = 256
query_cache_elasticity_size_mb = 128
```

## 七、Troubleshooting：排查缓存失效原因

<!-- 知识类型：故障排查 -->
<!-- 适用场景：发现查询未命中 SQL Cache 时定位原因 -->

下表汇总了常见的缓存未命中或失效原因，以及对应的检查方向：

| 序号 | 失效原因               | 典型操作                                              | 排查建议                                  |
| ---- | ---------------------- | ----------------------------------------------------- | ----------------------------------------- |
| 1    | 表/视图结构变化        | `drop table`、`replace table`、`alter table`、`alter view` | 检查表与视图的近期 DDL 历史               |
| 2    | 表数据变化             | `insert`、`delete`、`update`、`truncate`              | 检查导入与变更日志，确认数据版本是否变化  |
| 3    | 用户权限被移除         | `revoke`                                              | 核对查询账户的权限变更                    |
| 4    | 使用了非确定函数       | `select random()`、`select now()` 等                  | 改用粗粒度函数或常量参数                  |
| 5    | 变量值变化             | `select * from tbl where dt = @dt_var`                | 检查会话变量的取值是否一致                |
| 6    | Row Policy / Data Masking 变化 | 调整了行策略或脱敏策略                        | 核对策略最近的变更记录                    |
| 7    | 结果行数超限           | 超过 `cache_result_max_row_count`（默认 3000 行）     | 调整阈值或缩小查询结果集                  |
| 8    | 结果大小超限           | 超过 `cache_result_max_data_size`（默认 30MB）        | 调整阈值或减少返回字段                    |

## 八、FAQ

<!-- 知识类型：常见问答 -->
<!-- 适用场景：解答使用过程中常见疑问 -->

**Q1：SQL Cache 默认是否开启？**
A：默认关闭。需通过 `set enable_sql_cache=true` 在 Session 级开启，或 `set global enable_sql_cache=true` 全局开启。

**Q2：SQL Cache 支持哪些表类型？**
A：当前支持 OlapTable 内部表与 Hive 外部表。

**Q3：实时更新的数据可以使用 SQL Cache 吗？**
A：可以，但每次数据更新都会导致分区版本变化，使缓存失效，命中率较低。更适合 T+1 离线分析场景。

**Q4：多表 Join 查询的缓存如何失效？**
A：只要 Join 中的**任一表**发生数据变更，分区 ID 或版本号即变化，整条查询缓存均无法命中。

**Q5：`now()` 函数会让缓存完全失效吗？**
A：不会完全失效。`now()` 返回秒级时间，同一秒内的相同查询可复用缓存；建议使用 `date(now())` 转为日级粒度以扩大缓存命中范围。

**Q6：缓存数据存放在哪里？**
A：绝大多数结果存放在 BE 内存（HashMap 结构）；当结果仅 0 行或 1 行时，FE 会直接保存在自身内存中。

**Q7：FE 重启后缓存是否还在？**
A：FE 中的元数据会丢失，监控指标也会重置为 0；BE 内存中的结果同样在重启后失效。

## 九、对比与延伸

<!-- 知识类型：横向对比 -->
<!-- 适用场景：选择合适的缓存策略 -->

| 维度          | SQL Cache                            | Partition Cache（如适用）            |
| ------------- | ------------------------------------ | ------------------------------------ |
| 缓存粒度      | 整条 SQL 的结果集                    | 按分区缓存中间结果                   |
| 适用更新模式  | T+1、低频更新                        | 部分分区频繁更新、其他分区稳定       |
| 命中条件      | SQL 文本 + 全部依赖元数据未变        | 涉及的分区版本未变                   |
| 失效粒度      | 任一依赖变更即整体失效               | 仅未命中分区需重新计算               |

> 提示：本表中 Partition Cache 仅作对比参考，具体可用性以当前 Doris 版本特性为准。
