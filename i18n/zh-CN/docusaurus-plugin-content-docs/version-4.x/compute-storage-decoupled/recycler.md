---
{
    "title": "数据回收",
    "language": "zh-CN",
    "description": "在大数据时代，数据生命周期管理已成为分布式数据库系统的核心挑战之一。随着业务数据量的爆炸式增长，如何在保证数据安全的前提下实现高效的存储空间回收，成为每个数据库产品必须解决的关键问题。"
}
---

# Doris 存算分离数据回收

## 引言

在大数据时代，数据生命周期管理已成为分布式数据库系统的核心挑战之一。随着业务数据量的爆炸式增长，如何在保证数据安全的前提下实现高效的存储空间回收，成为每个数据库产品必须解决的关键问题。

Apache Doris 作为新一代实时分析型数据库，在存算分离架构下采用了标记删除（Mark-for-Deletion）的数据回收策略，并在此基础上进行了深度优化和增强。通过引入精细化的分层回收机制、灵活可配的过期保护、多重数据一致性检查以及完善的可观测性体系，同时充分考虑分布式环境的复杂性，设计了独立的 Recycler 组件、智能的并发控制、完备的监控指标等，为用户提供了一个既高效又可控的企业级数据生命周期管理方案，实现了性能、安全性和可控性的最佳平衡。

本文将深入剖析 Doris 存算分离架构下的数据回收机制，从设计理念到技术实现，从核心原理到实践调优，全面展示这一成熟解决方案的技术细节与应用价值。

## 1. 常规数据回收策略对比

### 1.1 同步删除

最直接的删除方式。当数据被删除（例如drop table）时，立即将相关的meta以及对应文件删除，数据一旦删除就无法恢复，操作简单直接，但删除速度较慢，风险较高。

### 1.2 对账删除(反向）

这种方式通过定期对账机制来确定哪些数据可以删除。当数据被删除（例如drop table）时，仅仅删除meta数据，系统会定期进行数据对账，扫描文件数据，识别出不再被meta引用或已失效的数据，然后批量删除。

### 1.3 标记删除(正向)

这种方式通过定期扫描已删除的meta数据来确定哪些数据可以删除。当数据被删除（例如drop table）时，不直接删除数据，而是将要删除的meta标记为已删除，系统会定期扫描被标记的meta数据，找到对应的文件进行批量删除。

## 2. Doris 存算分离 标记删除 的好处

Doris 存算分离架构选择了标记删除方法，这一选择能够有效保证数据一致性，同时在性能、安全性和资源利用率之间达到最佳平衡。

以 drop table 为例，标记删除相比其他两种方式有以下显著优势：

### 2.1 性能优势

- **响应速度快**：drop table 操作只需要标记 meta kv数据为删除状态，无需等待文件 I/O 操作完成，用户可以立即得到响应。这在大表删除场景下尤为重要，避免了长时间阻塞。
- **批量处理效率高**：定期扫描删除标记的 meta kv，可以批量处理文件删除操作，减少系统调用次数，提高整体 I/O 效率。

### 2.2 安全性优势

- **误操作保护**：标记删除提供了一个缓冲期，在实际文件删除前可以恢复误删的表，显著降低了人为操作风险。
- **事务安全性**：标记操作是轻量级的 meta 修改，更容易保证原子性，减少了删除过程中系统故障导致的数据不一致问题。

### 2.3 资源管理优势

- **系统负载均衡**：文件删除操作可以在系统空闲时间进行，避免在业务高峰期占用大量 I/O 资源影响正常业务。
- **可控的删除节奏**：可以根据系统负载动态调整删除速度，避免大量删除操作对系统造成冲击。

### 2.4 对比其他方案

- **相比同步删除**：避免了删除大表时的长时间等待，提升用户体验，此外，还提供了一定的删除缓冲期，能够保证安全性，一定程度上防止人为操作事故。
- **相比对账删除**：只扫描标记删除的 meta，扫描数据更加明确，减少没有必要的I/O操作，效率更高，不需要遍历所有文件来判断是否被引用，删除更快速，效率更高。

## 3. Doris数据回收的原理

recycler是一个单独部署的组件，负责周期性对过期的垃圾文件进行回收，一个recycler可以同时回收多个instance，并且一个instance同一时间只能被一个recycler回收。

### 3.1 标记删除

每当一个执行一个drop命令或者系统有垃圾数据（例如compacted rowset）产生时，对应的meta kv会被标记为recycled，recycler会定期对instance中的recycle kv进行扫描，删除对应的对象文件，后面再将recycle kv删除，确保删除顺序的安全性。

### 3.2 分层结构

在recycler对instance数据进行回收时，多个任务会并发进行，例如recycle_indexes，recycle_partition，recycle_compacted_rowsets，recycle_txn等等任务。

数据在回收过程中按照分层结构进行删除：删除table是会删除对应的partitions，删除partition时会删除对应tablets，删除tablet的时候又会删除tablet对应的rowsets，删除rowset会删除对应的segment文件，最终的执行对象是doris的最小文件单位即segment文件。

以drop table为例子，回收过程中，系统会首先删除segment对象文件，成功后删除recycle rowset kv，tablet的rowset全部删除成功后会删除recycle tablet kv，以此类推最终删除table中所有的对象文件以及recycle kv。

### 3.3 过期机制

每个需要回收的对象都在其kv中记录有对应的过期时间，系统通过扫描各种recycle kv并且计算过期时间来识别要删除的对象，如果出现了用户误操作将某个table drop，这时由于过期机制的存在，recycler不会立刻对其数据进行删除，而是会等待一个retition time，这为用户恢复数据提供了可能。

### 3.4 可靠性保证

1. **分阶段删除**：先删除数据文件，再删除元数据，最后删除索引或分区的key，确保删除顺序的安全性。

2. **Lease保护机制**：每个recycler在开始回收前都要获取lease，启动后台线程定期续lease，只有lease过期或状态为IDLE时，新的recycler才能接管，保证了同一时间一个instance只能由一个recycler回收，避免并发回收导致的数据不一致问题。

### 3.5 多重检查机制

Recycler 实现了 FE 元数据、MS kv与对象文件的多重相互检查机制（checker）。checker 在后台对所有的 Recycler kv、对象文件、FE 内存元数据三方进行正反向检查。

以 segment 文件 KV 与对象文件检查为例：
- 正向检查：扫描所有 kv，检查是否都有对应的 segment 文件存在，以及 FE 内存中是否存在相应的 segment 信息。
- 反向检查：扫描所有 segment 文件，验证是否都有对应的 kv，以及 FE 内存中是否存在相应的 segment 信息。

多重检查机制能够保证 recycler 删除数据的正确性。如果在某种情况下出现未回收或多回收的情况，checker 会捕获相关信息，运维人员可以根据 checker 的信息手动删除多余垃圾文件，也可以依靠对象的多版本来恢复误删的文件，提供了有效的兜底机制。

当前已实现了 segment 文件、idx 文件、delete bitmap 元数据等的正反向检查，后续将实现所有元数据的检查，进一步保证 recycler 的正确性与可靠性。

## 4. 观测机制

recycler回收效率进度是用户非常关心的问题，因此我们大大提高了recycler的可观测性，添加了大量可视化监控指标以及必要的日志，可视化指标能够让用户直观的看到回收的进度，效率，异常等基础信息，我们也提供了更多指标可以让用户看到更加详细的信息，例如估算下一次某个instance做 recycle 的时间；添加的日志也可以让运维及研发更快的定位问题。

### 4.1 解答用户关心的问题

**基础问题：**
- 仓库粒度的回收速度：每秒回收多少字节，各类对象每秒回收数量
- 仓库粒度每次回收的数据量和耗时
- 仓库粒度的回收进度：已回收数据量，待回收数据量

**高级问题：**
- 每个存储后端的回收情况
- Recycler 回收成功时间、失败时间
- 下一次 Recycler 的预计回收时间

这些信息都可以通过 MS 面板进行实时观测。

### 4.2 观测指标

| 变量名 | Metrics name | 维度/标签 | 含义 | 例子 |
|--------|--------------|-----------|------|------|
| g_bvar_recycler_vault_recycle_status | recycler_vault_recycle_status | instance_id, resource_id, status | 按实例ID、资源ID和状态记录回收存储库操作的状态计数 | recycler_vault_recycle_status{instance_id="default_instance_id",resource_id="1",status="normal"} 8 |
| g_bvar_recycler_vault_recycle_task_concurrency | recycler_vault_recycle_task_concurrency | instance_id, resource_id | 按实例ID和资源ID统计 vault 回收文件任务的并发数 | recycler_vault_recycle_task_concurrency{instance_id="default_instance_id",resource_id="1"} 2 |
| g_bvar_recycler_instance_last_round_recycled_num | recycler_instance_last_round_recycled_num | instance_id, resource_type | 按实例ID和对象类型统计最近一轮已回收的对象数量 | recycler_instance_last_round_recycled_num{instance_id="default_instance_id",resource_type="recycle_rowsets"} 13 |
| g_bvar_recycler_instance_last_round_to_recycle_num | recycler_instance_last_round_to_recycle_num | instance_id, resource_type | 按实例ID和对象类型统计最近一轮需要回收的对象数量 | recycler_instance_last_round_to_recycle_num{instance_id="default_instance_id",resource_type="recycle_rowsets"} 13 |
| g_bvar_recycler_instance_last_round_recycled_bytes | recycler_instance_last_round_recycled_bytes | instance_id, resource_type | 按实例ID和对象类型统计最近一轮已回收的数据大小（bytes） | recycler_instance_last_round_recycled_bytes{instance_id="default_instance_id",resource_type="recycle_rowsets"} 13509 |
| g_bvar_recycler_instance_last_round_to_recycle_bytes | recycler_instance_last_round_to_recycle_bytes | instance_id, resource_type | 按实例ID和对象类型统计最近一轮需要回收的数据大小（bytes） | recycler_instance_last_round_to_recycle_bytes{instance_id="default_instance_id",resource_type="recycle_rowsets"} 13509 |
| g_bvar_recycler_instance_last_round_recycle_elpased_ts | recycler_instance_last_round_recycle_elpased_ts | instance_id, resource_type | 按实例ID和对象类型统计最近一轮上最近一轮回收操作的耗时 (ms) | recycler_instance_last_round_recycle_elpased_ts{instance_id="default_instance_id",resource_type="recycle_rowsets"} 62 |
| g_bvar_recycler_instance_recycle_round | recycler_instance_recycle_round | instance_id, resource_type | 按实例ID和对象类型统计回收操作的轮次 | recycler_instance_recycle_round{instance_id="default_instance_id_2",object_type="recycle_rowsets"} 2 |
| g_bvar_recycler_instance_recycle_time_per_resource | recycler_instance_recycle_time_per_resource | instance_id, resource_type | 按实例ID和对象类型记录回收操作的速度 (代表每个资源回收需要的时间(ms)，如果为 -1 代表没有回收) | recycler_instance_recycle_time_per_resource{instance_id="default_instance_id",resource_type="recycle_rowsets"} 4.76923 |
| g_bvar_recycler_instance_recycle_bytes_per_ms | recycler_instance_recycle_bytes_per_ms | instance_id, resource_type | 按实例ID和对象类型记录回收操作的速度 (代表每毫秒能回收的 bytes，如果为 -1 代表没有回收) | recycler_instance_recycle_bytes_per_ms{instance_id="default_instance_id",resource_type="recycle_rowsets"} 217.887 |
| g_bvar_recycler_instance_recycle_total_num_since_started | recycler_instance_recycle_total_num_since_started | instance_id, resource_type | 按实例ID和对象类型，从recycler 启动以来统计回收操作的总回收数量 | recycler_instance_recycle_total_num_since_started{instance_id="default_instance_id",resource_type="recycle_rowsets"} 49 |
| g_bvar_recycler_instance_recycle_total_bytes_since_started | recycler_instance_recycle_total_bytes_since_started | instance_id, resource_type | 按实例ID和对象类型，从recycler 启动以来统计回收操作的总回收大小 (bytes) | recycler_instance_recycle_total_bytes_since_started{instance_id="default_instance_id",resource_type="recycle_rowsets"} 40785 |
| g_bvar_recycler_instance_running_counter | recycler_instance_running_counter | - | 统计现在有多少个 instance 在做 recycle | recycler_instance_running_counter 0 |
| g_bvar_recycler_instance_last_recycle_duration | recycler_instance_last_round_recycle_duration | instance_id | 按实例ID，统计最近一轮回收的总用时 | recycler_instance_last_recycle_duration{instance_id="default_instance_id"} 64 |
| g_bvar_recycler_instance_next_ts | recycler_instance_next_ts | instance_id | 按实例ID，根据 config 的 recycle_interval_seconds 估算下一次做 recycle 的时间 | recycler_instance_next_ts{instance_id="default_instance_id"} 1750400266781 |
| g_bvar_recycler_instance_recycle_st_ts | recycler_instance_recycle_start_ts | instance_id | 按实例ID，统计总回收流程的开始时间 | recycler_instance_recycle_st_ts{instance_id="default_instance_id"} 1750400236717 |
| g_bvar_recycler_instance_recycle_ed_ts | recycler_instance_recycle_end_ts | instance_id | 按实例ID，统计总回收流程的结束时间 | recycler_instance_recycle_ed_ts{instance_id="default_instance_id"} 1750400236781 |
| g_bvar_recycler_instance_recycle_last_success_ts | recycler_instance_recycle_last_success_ts | instance_id | 按实例ID，统计上一次回收成功的时间 | recycler_instance_recycle_last_success_ts{instance_id="default_instance_id"} 1750400236781 |

## 5. 参数调优

recycler的常见参数以及说明如下：

```
// recycler回收间隔，单位秒
CONF_mInt64(recycle_interval_seconds, "3600");

// 公共的留存时间，适用于所有没有自己retition time的对象的回收
CONF_mInt64(retention_seconds, "259200");

// 一个recycler同时可以回收的instance的最大数量
CONF_Int32(recycle_concurrency, "16");

// 被compacted的rowset的留存时间，单位秒
CONF_mInt64(compacted_rowset_retention_seconds, "1800");

// 被drop的index的留存时间，单位秒
CONF_mInt64(dropped_index_retention_seconds, "10800");

// 被drop的partition的留存时间，单位秒
CONF_mInt64(dropped_partition_retention_seconds, "10800");

// recycle的白名单，填写instance id，用逗号隔开，不填写默认回收所有instance
CONF_Strings(recycle_whitelist, "");

// recycle的黑名单，填写instance id，用逗号隔开，不填写默认回收所有instance
CONF_Strings(recycle_blacklist, "");

// 对象IO worker的并发度: 例如object list, delete
CONF_mInt32(instance_recycler_worker_pool_size, "32");

// recycle对象的并发度：例如recycle_tablet，recycle_rowset
CONF_Int32(recycle_pool_parallelism, "40");

// 是否开启checker
CONF_Bool(enable_checker, "false");

// 是否开启反向checker
CONF_Bool(enable_inverted_check, "false");

// checker的间隔
CONF_mInt32(check_object_interval_seconds, "43200");

// 是否开启recycler的观测指标
CONF_Bool(enable_recycler_stats_metrics, "false");

// recycle存储后端的白名单，填写vault name，用逗号隔开，不填写默认回收所有vault
CONF_Strings(recycler_storage_vault_white_list, "");
```

### 常见调优场景 Q&A

#### 1. 回收性能调优

**Q1: 回收速度太慢怎么办？**

A1: 可以从以下几个方面进行调优：
- 增加并发度：
  - 调大 recycle_concurrency（默认16）：增加同时回收的instance数量
  - 调大 instance_recycler_worker_pool_size（默认32）：增加对象IO操作的并发度
  - 调大 recycle_pool_parallelism（默认40）：增加回收对象的并发度
- 缩短回收间隔：将 recycle_interval_seconds 从默认3600秒调小，如1800秒
- 使用白名单机制：通过 recycle_whitelist 优先回收重要的instance

**Q2: 回收压力过大，影响业务怎么调整？**

A2: 可以采用以下策略降低回收压力：
- 降低并发度：
  - 适当减小 recycle_concurrency，避免同时回收过多instance
  - 减小 instance_recycler_worker_pool_size 和 recycle_pool_parallelism
- 延长回收间隔：增大 recycle_interval_seconds，如调整为7200秒
- 使用黑名单：通过 recycle_blacklist 暂时排除高负载的instance
- 错峰回收：在业务低峰期进行回收操作

#### 2. 存储空间调优

**Q3: 存储空间不足，需要加快垃圾清理怎么办？**

A3: 可以调整各类对象的留存时间：
- 缩短通用留存时间：将 retention_seconds 从默认259200秒（3天）调小
- 针对性调整特定对象：
  - compacted_rowset_retention_seconds（默认1800秒）可适当缩短
  - dropped_index_retention_seconds 和 dropped_partition_retention_seconds（默认10800秒）可根据需求调整
- 选择性回收存储后端：通过 recycler_storage_vault_white_list 优先清理特定存储

**Q4: 需要保留更长时间的数据以防误删怎么办？**

A4: 延长相应的留存时间：
- 增大 retention_seconds 为更长时间，如604800秒
- 根据不同对象的重要性调整对应的retention参数
- 重要的partition可以通过 dropped_partition_retention_seconds 设置更长留存时间

#### 3. 监控与排查调优

**Q5: 如何开启更好的监控和排查能力？**

A5: 建议开启以下监控功能：
- 开启观测指标：设置 enable_recycler_stats_metrics = true
- 开启检查机制：
  - 设置 enable_checker = true 开启正向检查
  - 设置 enable_inverted_check = true 开启反向检查
  - 调整 check_object_interval_seconds（默认43200秒/12小时）为合适的检查频率

**Q6: 怀疑数据一致性问题怎么排查？**

A6: 利用checker机制进行检查：
- 确保 enable_checker 和 enable_inverted_check 都为true
- 适当缩短 check_object_interval_seconds 增加检查频率
- 通过MS面板观察checker发现的异常情况
- 根据checker报告手动处理多余的垃圾文件或补充误删文件

#### 4. 特殊场景调优

**Q7: 某些instance回收异常，如何临时处理？**

A7: 使用白名单和黑名单机制：
- 临时跳过问题instance：将异常instance ID加入 recycle_blacklist
- 优先处理特定instance：将需要优先处理的instance ID加入 recycle_whitelist
- 存储后端选择：通过 recycler_storage_vault_white_list 选择性回收特定存储后端

**Q8: 大表删除导致回收任务堆积怎么办？**

A8: 综合调优策略：
- 临时增大并发度参数应对积压
- 适当缩短大对象的retention时间
- 使用白名单优先处理积压严重的instance
- 必要时可以部署多个recycler分担压力

**Q9: 长时间查询遇到对象存储"404 file not found"错误怎么办？**

A9: 当查询执行时间很长，而查询期间tablet进行了compaction操作，对象存储上被合并的rowset可能已经被回收，导致查询失败并出现"404 file not found"错误。解决方案：
- 增加compacted rowset留存时间：将 compacted_rowset_retention_seconds 从默认1800秒调大，如：
  - 对于有长查询的场景，建议调整为7200秒（或更长）
  - 根据最长查询时间来设定合适的留存时间

这样可以确保长查询在执行过程中所需的rowset不会被提前回收，避免查询失败。

---

**注意**：以上调优建议需要根据实际的集群规模、存储容量、业务特点等因素进行具体调整。建议在调优过程中密切关注系统负载和业务影响，逐步调整参数以找到最佳配置。

## 结语

Apache Doris 存算分离架构下的标记删除机制，通过巧妙平衡性能、安全性和资源利用率，Doris 不仅解决了传统数据回收方式的固有缺陷，更为用户提供了一套完整、可靠、可观测的数据管理解决方案。

从精细化的分层回收设计，到智能的过期保护机制，从完善的多重检查体系，到丰富的可观测性指标，Doris 的数据回收机制在每一个细节上都体现了对用户需求的深入理解和对技术品质的不懈追求。特别是其提供的灵活参数调优能力，使得不同规模、不同场景的用户都能找到最适合自己的配置方案。

未来，我们将继续优化和完善这一机制，在保持现有优势的基础上，进一步提升回收效率、增强智能化水平、丰富监控维度，为用户构建更加高效、可靠的实时数据分析平台。欢迎广大用户在实践中探索更多可能，与我们一起推动 Apache Doris 不断向前发展。