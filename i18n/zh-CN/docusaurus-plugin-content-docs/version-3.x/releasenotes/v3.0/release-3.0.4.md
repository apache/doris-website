---
{
    "title": "Release 3.0.4",
    "language": "zh-CN",
    "description": "亲爱的社区小伙伴们，Apache Doris 3.0.4 版本已于 2025 年 02 月 28 日正式发布。 该版本进一步提升了系统的性能及稳定性，欢迎大家下载体验。"
}
---

亲爱的社区小伙伴们，**Apache Doris 3.0.4 版本已于 2025 年 02 月 28 日正式发布。** 该版本进一步提升了系统的性能及稳定性，欢迎大家下载体验。

- GitHub 下载：https://github.com/apache/doris/releases

- 官网下载：https://doris.apache.org/download


## 行为变更

- 在 Audit Log 中，`drop table` 和 `drop database` 语句保持 `force` 标志。 [#43227](https://github.com/apache/doris/pull/43227) 

- 导出数据至 Parquet/ORC 格式时，`bitmap`、`quantile_state` 和 `hll` 类型将以 Binary 格式导出。同时新增支持导出 `jsonb` 和 `variant` 类型，导出格式为 `string`。 [#44041](https://github.com/apache/doris/pull/44041) 

  - 更多内容，参考文档：[Export Overview - Apache Doris](https://doris.apache.org/docs/3.0/data-operate/export/export-overview)
- 当通过 External Catalog 查询表名大小写不敏感的数据源（如 Hive）时，在之前版本中，可以使用任意大小写进行表名查询，但是在 3.0.4 版本中，将严格遵循 Doris 自身的表名大小写敏感策略。
- 将 Hudi JNI Scanner 从 Spark API 替换为 Hadoop API，以增强兼容性。用户可以通过设置会话变量 `set hudi_jni_scanner=spark/hadoop` 进行切换。[#44267](https://github.com/apache/doris/pull/44267) 
- 禁止在 Colocate 表中使用 `auto bucket`。 [#44396](https://github.com/apache/doris/pull/44396) 
- 为 Catalog 增加 Paimon 缓存，不再进行实时数据查询。 [#44911 ](https://github.com/apache/doris/pull/44911)
- 增大 `max_broker_concurrency` 的默认值，以提升 Broker Load 在大规模数据导入时的性能。 [#44929](https://github.com/apache/doris/pull/44929) 
- 将 Auto Partition 分区的 `storage medium` 默认值修改为当前表的 `storage medium` 属性值，而非系统默认值。 [#45955](https://github.com/apache/doris/pull/45955) 
- 禁止在修改 Key 列的 Schema Change 执行期间进行列更新。 [#46347](https://github.com/apache/doris/pull/46347) 
- 对于包含自增列的 Key 列表，支持在列更新时不提供自增列。 [#44528](https://github.com/apache/doris/pull/44528) 
- FE ID 生成器策略切换为与物理时间相关的策略，ID 不再从 10000 开始。 [#44790](https://github.com/apache/doris/pull/44790) 
- 在存算分离模式下，Compaction 产生的 stale rowset 默认回收延迟时间减小至 1800 秒，以减少回收间隔。某些极端场景下可能会导致超大查询失败，如遇问题可按需调整。 [#45460](https://github.com/apache/doris/pull/45460) 
- 在存算分离模式下禁用 `show cache hotspot` 语句，需直接访问系统表。 [#47332](https://github.com/apache/doris/pull/47332) 
- 禁止删除系统创建的 `admin` 用户。 [#44751](https://github.com/apache/doris/pull/44751) 

## 改进优化

### 存储

- 优化 Routine Load 因 `max_match_interval` 设置过小导致任务频繁超时的问题。 [#46292](https://github.com/apache/doris/pull/46292) 
- 提升 Broker Load 在导入多个压缩文件时的性能。 [#43975](https://github.com/apache/doris/pull/43975) 
- 增大 `webserver_num_workers` 的默认值以提升 Stream Load 性能。 [#46593](https://github.com/apache/doris/pull/46593) 
- 优化 Routine Load 导入任务在 BE 节点扩容时负载不均衡的问题。 [#44798](https://github.com/apache/doris/pull/44798) 
- 优化 Routine Load 线程池使用，防止 Routine Load 超时失败影响查询。 [#45039](https://github.com/apache/doris/pull/45039) 

### 存算分离

- 加强 Meta-service 的稳定性和可观测性。 [#44036](https://github.com/apache/doris/pull/44036), [#45617](https://github.com/apache/doris/pull/45617), [#45255](https://github.com/apache/doris/pull/45255), [#45068](https://github.com/apache/doris/pull/45068) 
- 优化 File Cache，增加提前淘汰策略，减小持锁时间，提升查询性能。 [#47473](https://github.com/apache/doris/pull/47473), [#45678](https://github.com/apache/doris/pull/45678), [#47472](https://github.com/apache/doris/pull/47472) 
- 优化 File Cache 初始化检查以及队列转换，提升稳定性。 [#44004](https://github.com/apache/doris/pull/44004), [#44429](https://github.com/apache/doris/pull/44429), [#45057](https://github.com/apache/doris/pull/45057), [#47229](https://github.com/apache/doris/pull/47229) 
- 优化 HDFS 数据回收速度。 [#46393](https://github.com/apache/doris/pull/46393) 
- 优化超高频导入时 FE 获取计算组可能存在的性能问题。 [#47203](https://github.com/apache/doris/pull/47203) 
- 优化存算分离主键表的若干导入相关参数，提升实时高并发导入的稳定性。 [#47295](https://github.com/apache/doris/pull/47295), [#46750](https://github.com/apache/doris/pull/46750), [#46365](https://github.com/apache/doris/pull/46365) 

### Lakehouse

- 支持读取 Hive Json 格式的表数据。 [#43469](https://github.com/apache/doris/pull/46393) 

  - 更多内容，参考文档：[Text/CSV/JSON - Apache Doris](https://doris.apache.org/docs/dev/lakehouse/file-formats/text#json)

- 支持会话变量 `enable_text_validate_utf8`，可忽略 CSV 格式中的 UTF-8 编码检测。 [#45537](https://github.com/apache/doris/pull/45537) 

  - 更多内容，参考文档：[Text/CSV/JSON - Apache Doris](https://doris.apache.org/docs/dev/lakehouse/file-formats/text#character-set)

- 将 Hudi 版本更新至 0.15，并优化 Hudi 表的查询规划性能。
- 优化 MaxCompute 分区表的读取性能。 [#45148](https://github.com/apache/doris/pull/45148) 
- 优化在高过滤率情况下，Parquet 文件延迟物化的性能。 [#46183](https://github.com/apache/doris/pull/46183) 
- 支持 Parquet 复杂类型的延迟物化。 [#44098](https://github.com/apache/doris/pull/44098) 
- 优化 ORC 类型的谓词下推逻辑，支持更多谓词条件用于索引过滤。 [#43255](https://github.com/apache/doris/pull/43255) 

### 异步物化视图

- 支持更多场景下的聚合上卷改写。 [#44412](https://github.com/apache/doris/pull/44412) 

### 查询优化器

- 优化分区裁剪性能。 [#46261](https://github.com/apache/doris/pull/46261) 
- 增加利用数据特征消除 `group by` key 的规则。 [#43391](https://github.com/apache/doris/pull/43391) 
- 根据目标表的数据量自适应调整 Runtime Filter 的等待时间。 [#42640](https://github.com/apache/doris/pull/42640) 
- 优化聚合下压连接的能力，以适应更多场景。 [#43856](https://github.com/apache/doris/pull/43856), [#43380](https://github.com/apache/doris/pull/43380) 
- 优化 Limit 下压聚合，以适应更多场景。 [#44042](https://github.com/apache/doris/pull/44042) 

### 其他

- 优化 FE、BE、MS 进程启动脚本，使输出内容更明确。 [#45610](https://github.com/apache/doris/pull/45610), [#45490](https://github.com/apache/doris/pull/45490), [#45883](https://github.com/apache/doris/pull/45883) 
- `show tables` 显示的表名大小写现在与 MySQL 行为一致。 [#46030](https://github.com/apache/doris/pull/46030) 
- `show index` 支持任意目标表类型。 [#45861](https://github.com/apache/doris/pull/45861) 
- `information_schema.columns` 支持显示默认值。 [#44849](https://github.com/apache/doris/pull/44849) 
- `information_schema.views` 支持显示视图定义。 [#45857](https://github.com/apache/doris/pull/45857) 
- 支持 MySQL 协议的 `COM_RESET_CONNECTION` 命令。 [#44747](https://github.com/apache/doris/pull/44747) 

## 缺陷修复

### 存储

- 修复聚合表模型导入过程中可能出现的内存错误。 [#46997](https://github.com/apache/doris/pull/46997) 
- 修复存算分离模式下 FE 主节点重启时导致 Routine Load offset 丢失的问题。 [#46566](https://github.com/apache/doris/pull/46566) 
- 修复存算模式下 FE Observer 节点在批量导入场景中的内存泄漏问题。 [#47244](https://github.com/apache/doris/pull/47244) 
- 修复 Full Compaction 进行 Order Data Compaction 导致 Cumulative Point 回退的问题。 [#44359](https://github.com/apache/doris/pull/44359) 
- 修复 Delete 操作可能导致 Tablet Compaction 短暂无法调度的问题。 [#43466](https://github.com/apache/doris/pull/43466) 
- 修复多计算集群时，Schema Change 后 Tablet 状态不正确的问题。 [#45821](https://github.com/apache/doris/pull/45821) 
- 修复在有 `sequence_type` 的主键表上进行 Column Rename Schema Change 时可能报 NPE 错误的问题。 [#46906](https://github.com/apache/doris/pull/46906) 
- **数据正确性：**修复主键表在部分列更新导入包含 DELETE SIGN 列时的正确性问题。 [#46194](https://github.com/apache/doris/pull/46194) 
- 修复主键表 Publish 任务持续卡住时，FE 可能存在内存泄漏的问题。 [#44846](https://github.com/apache/doris/pull/44846) 

### 存算分离

- 修复 File Cache 可能导致缓存大小大于表数据大小的问题。 [#46561](https://github.com/apache/doris/pull/46561), [#46390](https://github.com/apache/doris/pull/46390) 
- 修复数据上传至 5MB 边界值时可能导致上传失败的问题。 [#47333](https://github.com/apache/doris/pull/47333) 
- 修复 Storage Vault 若干 `alter` 相关操作，增加更多参数检查，提升鲁棒性。 [#45155](https://github.com/apache/doris/pull/45155), [#45156](https://github.com/apache/doris/pull/45156), [#46625](https://github.com/apache/doris/pull/46625), [#47078](https://github.com/apache/doris/pull/47078), [#45685](https://github.com/apache/doris/pull/45685), [#46779](https://github.com/apache/doris/pull/46779) 
- 修复因 Storage Vault 配置不当导致数据无法回收或回收缓慢的问题。 [#46798](https://github.com/apache/doris/pull/46798), [#47536](https://github.com/apache/doris/pull/47536), [#47475](https://github.com/apache/doris/pull/47475), [#47324](https://github.com/apache/doris/pull/47324), [#45072](https://github.com/apache/doris/pull/45072) 
- 修复回收过程中可能卡住导致数据无法及时回收的问题。 [#45760](https://github.com/apache/doris/pull/45760) 
- 修复存算分离下 MTTM-230 错误时未正确重试的问题。 [#47370](https://github.com/apache/doris/pull/47370), [#47326](https://github.com/apache/doris/pull/47326) 
- 修复存算分离模式下 Decommission BE 时，Group Commit WAL 未回放完成的问题。 [#47187](https://github.com/apache/doris/pull/47187) 
- 修复超过 2GB 的 Tablet Meta 导致 MS 不可用的问题。 [#44780](https://github.com/apache/doris/pull/44780) 
- **数据正确性**：修复存算分离主键表的两个重复 Key 问题。 [#46039](https://github.com/apache/doris/pull/46039), [#44975](https://github.com/apache/doris/pull/44975) 
- 修复存算分离主键表在高频实时导入下，可能因 Delete Bitmap 过大导致 Base Compaction 持续失败的问题。 [#46969](https://github.com/apache/doris/pull/46969) 
- 修改 Schema Change 在存算分离主键表上的一些错误重试逻辑，提高 Schema Change 的健壮性。 [#46748](https://github.com/apache/doris/pull/46748) 

### Lakehouse

#### Hive

- 修复无法查询 Spark 创建的 Hive 视图的问题。 [#43553](https://github.com/apache/doris/pull/43553) 
- 修复无法正确读取某些 Hive Transaction 表的问题。 [#45753](https://github.com/apache/doris/pull/45753) 
- 修复 Hive 表分区存在特殊字符时，无法进行正确分区裁剪的问题。 [#42906](https://github.com/apache/doris/pull/42906) 

#### Iceberg

- 修复在 Kerberos 认证环境下，无法创建 Iceberg 表的问题。 [#43445](https://github.com/apache/doris/pull/43445) 
- 修复某些情况下，Iceberg 表存在 dangling delete 情况下，`count*` 查询不准确的问题。 [#44039](https://github.com/apache/doris/pull/44039) 
- 修复某些情况下，Iceberg 表列名不匹配导致查询错误的问题。 [#44470](https://github.com/apache/doris/pull/44470) 
- 修复某些情况下，Iceberg 表分区被修改后无法读取的问题。 [#45367](https://github.com/apache/doris/pull/45367) 

#### Paimon

- 修复 Paimon Catalog 无法访问阿里云 OSS-HDFS 的问题。 [#42585](https://github.com/apache/doris/pull/42585) 

#### Hudi

- 修复某些情况下，Hudi 表分区裁剪失效的问题。 [#44669](https://github.com/apache/doris/pull/44669) 

#### JDBC

- 修复某些情况下，开启表名大小写不敏感功能后，使用 JDBC Catalog 无法获取表的问题。

#### MaxCompute

- 修复某些情况下，MaxCompute 表分区裁剪失效的问题。 [#44508](https://github.com/apache/doris/pull/44508) 

#### 其他

- 修复某些情况下，Export 任务导致 FE 内存泄漏的问题。 [#44019](https://github.com/apache/doris/pull/44019) 
- 修复某些情况下，无法使用 HTTPS 协议访问 S3 对象存储的问题。 [#44242](https://github.com/apache/doris/pull/44242) 
- 修复某些情况下，Kerberos 认证票据无法自动刷新的问题。 [#44916](https://github.com/apache/doris/pull/44916) 
- 修复某些情况下，读取 Hadoop Block 压缩格式文件出错的问题。 [#45289](https://github.com/apache/doris/pull/45289) 
- 查询 ORC 格式的数据时，不再下推 CHAR 类型的谓词，以避免可能的结果错误。 [#45484](https://github.com/apache/doris/pull/45484) 

### 异步物化视图

- 修复极端场景下查询透明改写可能导致规划或结果错误的问题。 [#44575](https://github.com/apache/doris/pull/44575), [#45744](https://github.com/apache/doris/pull/45744) 
- 修复极端场景下异步物化视图调度可能多产生构建任务的问题。 [#46020](https://github.com/apache/doris/pull/46020), [#46280](https://github.com/apache/doris/pull/46280) 

### 查询优化器

- 修复部分表达式改写可能产生错误表达式的问题。 [#44770](https://github.com/apache/doris/pull/44770), [#44920](https://github.com/apache/doris/pull/44920), [#45922](https://github.com/apache/doris/pull/45922), [#45596](https://github.com/apache/doris/pull/45596) 
- 修复偶现的 SQL Cache 结果错误问题。 [#44782](https://github.com/apache/doris/pull/44782), [#44631](https://github.com/apache/doris/pull/44631), [#46443](https://github.com/apache/doris/pull/46443), [#47266](https://github.com/apache/doris/pull/47266) 
- 修复部分场景下 Limit 下压聚合算子可能导致错误结果的问题。 [#45369](https://github.com/apache/doris/pull/45369) 
- 修复部分场景下延迟物化优化产生错误执行计划的问题。 [#45693](https://github.com/apache/doris/pull/45693), [#46551](https://github.com/apache/doris/pull/46551) 

### 查询执行

- 修复正则表达式和 `like` 函数在特殊字符时结果不正确的问题。 [#44547](https://github.com/apache/doris/pull/44547) 
- 修复 SQL Cache 在切换 DB 时结果可能不正确的问题。 [#44782](https://github.com/apache/doris/pull/44782) 
- 修复一系列 Arrow Flight 相关问题。 [#45023](https://github.com/apache/doris/pull/45023), [#43929](https://github.com/apache/doris/pull/43929) 
- 修复当 HashJoin 的 Hash 表超过 4G 时，部分情况下结果错误的问题。 [#46461](https://github.com/apache/doris/pull/46461) 
- 修复 `convert_to` 函数在中文字符时溢出的问题。 [#46405](https://github.com/apache/doris/pull/46405) 
- 修复 `group by` 带 Limit 时，在极端情况下结果可能出错的问题。 [#47844](https://github.com/apache/doris/pull/47844) 
- 修复访问某些系统表结果可能不正确的问题。 [#47498](https://github.com/apache/doris/pull/47498) 
- 修复 `percentile` 函数可能导致系统崩溃的问题。 [#47068](https://github.com/apache/doris/pull/47068) 
- 修复单表查询带 Limit 时性能退化的问题。 [#46090](https://github.com/apache/doris/pull/46090) 
- 修复 `StDistanceSphere` 和 `StAngleSphere` 函数导致系统崩溃的问题。 [#45508](https://github.com/apache/doris/pull/45508) 
- 修复 `map_agg` 结果错误的问题。 [#40454](https://github.com/apache/doris/pull/40454) 

### 半结构化数据管理

#### BloomFilter Index

- 修复 BloomFilter Index 参数过大导致的异常。 [#45780](https://github.com/apache/doris/pull/45780) 
- 修复 BloomFilter Index 写入时内存占用过高的问题。 [#45833](https://github.com/apache/doris/pull/45833) 
- 修复删除列时 BloomFilter Index 没有正确删除的问题。 [#44361](https://github.com/apache/doris/pull/44361), [#43378](https://github.com/apache/doris/pull/43378) 

#### Inverted Index

- 修复倒排索引构建过程中偶发崩溃的问题。 [#43246](https://github.com/apache/doris/pull/43246) 
- 修复倒排索引合并时，出现次数为 0 的词占用空间的问题。 [#43113](https://github.com/apache/doris/pull/43113) 
- 避免 Index Size 统计出现超大异常值。 [#46549](https://github.com/apache/doris/pull/46549) 
- 修复 VARIANT 类型字段的倒排索引异常。 [#43375](https://github.com/apache/doris/pull/43375) 
- 优化倒排索引的本地缓存局部性，提高缓存命中率。 [#46518](https://github.com/apache/doris/pull/46518) 
- 在查询 Profile 中增加倒排索引读远程存储的指标 `NumInvertedIndexRemoteIOTotal`。 [#45675](https://github.com/apache/doris/pull/45675), [#44863](https://github.com/apache/doris/pull/44863) 

#### 其他

- 修复 `ipv6_cidr_to_range` 函数在特殊 NULL 数据时崩溃的问题。 [#44700](https://github.com/apache/doris/pull/44700) 

### 权限

- 赋予 `CREATE_PRIV` 时，不再检查对应资源是否存在。 [#45125](https://github.com/apache/doris/pull/45125) 
- 修复在极端场景下，可能出现的查询有权限的视图，但报错没有视图中引用的表的权限的问题。 [#44621](https://github.com/apache/doris/pull/44621) 
- 修复 `use db` 时检查权限时不区分内外 Catalog 的问题。 [#45720](https://github.com/apache/doris/pull/45720) 
