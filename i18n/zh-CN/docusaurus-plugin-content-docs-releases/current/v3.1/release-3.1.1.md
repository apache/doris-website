---
{
    "title": "Release 3.1.1",
    "language": "zh-CN",
    "description": "Apache Doris 3.1.1 是一个维护版本，重点在于关键性错误修复、性能优化和稳定性提升。此版本包含大量针对数据合并（compaction）、数据导入、查询处理和云功能的修复，使其在生产环境中更加稳健可靠。"
}
---

## 概述

Apache Doris 3.1.1 是一个维护版本，重点在于关键性错误修复、性能优化和稳定性提升。此版本包含大量针对数据合并（compaction）、数据导入、查询处理和云功能的修复，使其在生产环境中更加稳健可靠。

## 新特性

### 核心功能

- **`[feature](function)`** 支持 `count_substrings` 函数（[#42055](https://github.com/apache/doris/pull/42055), [#55847](https://github.com/apache/doris/pull/55847)）


### 数据集成与存储

- **`[feat](hdfs)`** 新增 HDFS 高可用（HA）配置验证（[#55675](https://github.com/apache/doris/pull/55675), [#55764](https://github.com/apache/doris/pull/55764)）
- **`[feat](checker)`** 为校验器增加 Tablet 统计键一致性检查（[#54754](https://github.com/apache/doris/pull/54754), [#55663](https://github.com/apache/doris/pull/55663)）
- **`[feat](outfile)`** 在 `outfile` 和导出中支持 CSV 格式的压缩类型（[#55392](https://github.com/apache/doris/pull/55392), [#55561](https://github.com/apache/doris/pull/55561)）
- **`[feat](cloud)`** 支持云环境下 Group Commit Stream Load 的 BE 转发模式（[#55326](https://github.com/apache/doris/pull/55326), [#55527](https://github.com/apache/doris/pull/55527)）


### 性能与优化

- **`[support](orc)`** 支持 ORC 文件元数据缓存（[#54591](https://github.com/apache/doris/pull/54591), [#55584](https://github.com/apache/doris/pull/55584)）
- **`[Exec](vec)`** 支持使用 SIMD 计算 KNN 距离（[#55275](https://github.com/apache/doris/pull/55275)）


## 改进

### 性能优化

- **`[opt](cloud)`** 减少元数据服务中空 Rowset 带来的压力（[#54395](https://github.com/apache/doris/pull/54395), [#55171](https://github.com/apache/doris/pull/55171), [#55604](https://github.com/apache/doris/pull/55604), [#55742](https://github.com/apache/doris/pull/55742), [#55837](https://github.com/apache/doris/pull/55837), [#55934](https://github.com/apache/doris/pull/55934)）
- **`[Opt](mow)`** 优化 MOW 导入性能和 CPU 使用率（[#55073](https://github.com/apache/doris/pull/55073), [#55733](https://github.com/apache/doris/pull/55733), [#55771](https://github.com/apache/doris/pull/55771), [#55767](https://github.com/apache/doris/pull/55767)）
- **`[opt](hive)`** 将 `hive.recursive_directories` 默认值设为 true（[#55737](https://github.com/apache/doris/pull/55737), [#55905](https://github.com/apache/doris/pull/55905)）
- **`[opt](recycler)`** 避免频繁发起 `Aws::Internal::GetEC2MetadataClient` HTTP 请求（[#55546](https://github.com/apache/doris/pull/55546), [#55682](https://github.com/apache/doris/pull/55682)）
- **`[opt](mow)`** 不再捕获调用栈以降低 CPU 开销（[#55368](https://github.com/apache/doris/pull/55368), [#55526](https://github.com/apache/doris/pull/55526)）
- **`[opt](txn lazy commit)`** 使临时 Rowset 批量转换逻辑更具自适应性（[#55035](https://github.com/apache/doris/pull/55035), [#55573](https://github.com/apache/doris/pull/55573)）
- **`[opt](nereids)`** 优化将大字符串转换为复杂类型时的性能（[#55476](https://github.com/apache/doris/pull/55476), [#55521](https://github.com/apache/doris/pull/55521)）
- **`[opt](nereids)`** 支持简化字符串范围（[#55378](https://github.com/apache/doris/pull/55378), [#55456](https://github.com/apache/doris/pull/55456)）
- **`[opt](nereids)`** 优化窗口函数的规范化逻辑（[#54947](https://github.com/apache/doris/pull/54947), [#55046](https://github.com/apache/doris/pull/55046)）
- **`[opt](nereids)`** 当 OLAP 表具有自动分区时，优化 INSERT 命令的并行度（[#54983](https://github.com/apache/doris/pull/54983), [#55030](https://github.com/apache/doris/pull/55030)）


### 系统增强

- **`[enhancement](Log)`** 将部分日志级别从 info 调整为 debug（[#55808](https://github.com/apache/doris/pull/55808), [#55841](https://github.com/apache/doris/pull/55841)）
- **`[enhancement](filecache)`** 支持多个缓存实例之间并行清理缓存（[#55259](https://github.com/apache/doris/pull/55259), [#55437](https://github.com/apache/doris/pull/55437)）
- **`[enhancement](sc)`** 禁止对隐藏列执行 Schema Change（[#53376](https://github.com/apache/doris/pull/53376), [#55385](https://github.com/apache/doris/pull/55385)）
- **`[enhancement](backup)`** 在备份过程中正确处理已被删除的表和分区（[#52935](https://github.com/apache/doris/pull/52935), [#54989](https://github.com/apache/doris/pull/54989)）
- **`[enhancement](cloud)`** 修复从 Doris 2.1 版本恢复到 3.1 版本时的云恢复问题（[#55110](https://github.com/apache/doris/pull/55110)）
- **`[enhancement](type)`** 支持 time 与 datetime 类型之间的相互转换（[#53734](https://github.com/apache/doris/pull/53734), [#54985](https://github.com/apache/doris/pull/54985)）


### 基础设施改进

- **`[refactor](credential)`** 使用统一架构重构临时凭证系统（[#55912](https://github.com/apache/doris/pull/55912)）
- **`[refactor](cloud)`** 将云恢复中创建 Tablet 的 RPC 拆分为多个批次（[#55691](https://github.com/apache/doris/pull/55691)）
- **`[opt](editlog)`** 在 FE 异常时增加跳过某些 editlog 异常的能力（[#54090](https://github.com/apache/doris/pull/54090), [#55204](https://github.com/apache/doris/pull/55204)）


## 关键性错误修复

### 合并与存储

- **`[fix](sc)`** 对于版本号 ≤ alter_version 的空 Rowset，跳过版本空洞填充（[#56209](https://github.com/apache/doris/pull/56209), [#56212](https://github.com/apache/doris/pull/56212)）
- **`[fix](compaction)`** 修复合并后输入 Rowset 被过早驱逐，导致查询失败的问题（[#55382](https://github.com/apache/doris/pull/55382), [#55966](https://github.com/apache/doris/pull/55966)）
- **`[fix](compaction)`** 使创建 Tablet 操作具有幂等性，从而保证合并任务的幂等性（[#56061](https://github.com/apache/doris/pull/56061), [#56108](https://github.com/apache/doris/pull/56108)）
- **`[fix](compaction)`** 在段合并（segcompaction）中使用 Rowset 元数据文件系统，并增加 RPC 客户端就绪检查（[#55951](https://github.com/apache/doris/pull/55951), [#55988](https://github.com/apache/doris/pull/55988)）
- **`[fix](compaction)`** 在合并过程中跳过合并分数为 0 的 Tablet（[#55550](https://github.com/apache/doris/pull/55550), [#55570](https://github.com/apache/doris/pull/55570)）


### 查询处理与函数

- **`[fix](fold constant)`** `abs` 函数的返回类型应与参数类型一致（[#56190](https://github.com/apache/doris/pull/56190), [#56210](https://github.com/apache/doris/pull/56210)）
- **`[fix](fold constant)`** 当 float/double 值为 NaN 时，不在 BE 端进行常量折叠（[#55425](https://github.com/apache/doris/pull/55425), [#55874](https://github.com/apache/doris/pull/55874)）
- **`[Fix](function)`** 修复 `unix_timestamp` 函数返回的小数位数错误（[#55013](https://github.com/apache/doris/pull/55013), [#55962](https://github.com/apache/doris/pull/55962)）
- **`[fix](nereids)`** 修复因精度丢失或空值转换导致的比较谓词简化错误（[#55884](https://github.com/apache/doris/pull/55884), [#56110](https://github.com/apache/doris/pull/56110)）
- **`[fix](nereids)`** 修复在 Join 重排时抛出“eq 函数不存在”异常的执行错误（[#54953](https://github.com/apache/doris/pull/54953), [#55667](https://github.com/apache/doris/pull/55667)）
- **`[fix](nereids)`** 修复窗口表达式别名复用时的表达式 ID 错误（[#55286](https://github.com/apache/doris/pull/55286), [#55486](https://github.com/apache/doris/pull/55486)）
- **`[fix](nereids)`** 在与 `count()` 聚合函数比较时，使用 bigint 字面量而非 int（[#55545](https://github.com/apache/doris/pull/55545), [#55590](https://github.com/apache/doris/pull/55590)）
- **`[fix](nereids)`** 在生成巨大表达式时停止合并投影（[#55293](https://github.com/apache/doris/pull/55293), [#55519](https://github.com/apache/doris/pull/55519)）


### 数据加载与导入

- **`[fix](load)`** 修复 S3 导入连接检查失败的问题（[#56123](https://github.com/apache/doris/pull/56123)）
- **`[fix](load)`** 修复已完成导入任务进度显示不正确的问题（[#55509](https://github.com/apache/doris/pull/55509), [#55530](https://github.com/apache/doris/pull/55530)）
- **`[fix](load)`** 修复特定导入错误场景导致 BE 崩溃（core dump）的问题（[#55500](https://github.com/apache/doris/pull/55500)）
- **`[fix](load)`** 修复 Routine Load 任务因 MEM_LIMIT_EXCEED 失败后无法再次调度的问题（[#55481](https://github.com/apache/doris/pull/55481), [#55616](https://github.com/apache/doris/pull/55616)）


### 云与分布式功能

- **`[fix](cloud)`** 在 `replayUpdateCloudReplica` 中移除无用的表锁（[#55579](https://github.com/apache/doris/pull/55579), [#55955](https://github.com/apache/doris/pull/55955)）
- **`[fix](cloud)`** `calc_sync_versions` 应考虑全量合并（full compaction）（[#55630](https://github.com/apache/doris/pull/55630), [#55710](https://github.com/apache/doris/pull/55710)）
- **`[fix](warmup)`** 修复 `CloudTablet::complete_rowset_segment_warmup` 导致的崩溃问题（[#55932](https://github.com/apache/doris/pull/55932)）


### 数据库操作

- **`[fix](database)`** 修复重命名数据库与创建表之间的竞态条件（[#55054](https://github.com/apache/doris/pull/55054), [#55991](https://github.com/apache/doris/pull/55991)）
- **`[fix](create table)`** 并发重命名数据库会导致建表及重放失败（[#54614](https://github.com/apache/doris/pull/54614), [#56039](https://github.com/apache/doris/pull/56039)）
- **`[fix](table)`** 将删除 editlog 操作移至表锁内执行（[#55705](https://github.com/apache/doris/pull/55705), [#55947](https://github.com/apache/doris/pull/55947)）
- **`[fix](schema change)`** 启用轻量级 Schema Change 后，Tablet 列未被重建（[#55909](https://github.com/apache/doris/pull/55909), [#55939](https://github.com/apache/doris/pull/55939)）


### 数据类型与序列化

- **`[fix](variant)`** 修复将空值序列化为 JSON 字符串时的处理逻辑（[#55876](https://github.com/apache/doris/pull/55876), [#56138](https://github.com/apache/doris/pull/56138)）
- **`[fix](variant)`** 修复稀疏列为空时的兼容性错误（[#55817](https://github.com/apache/doris/pull/55817)）
- **`[fix](variant)`** 增强 Variant 类型的 `max_sparse_column_statistics_size` 配置（[#55124](https://github.com/apache/doris/pull/55124), [#55752](https://github.com/apache/doris/pull/55752)）


### 外部数据源

- **`[fix](paimon)`** 修复 Paimon 原生读取器未使用延迟物化（late materialization）的问题（[#55894](https://github.com/apache/doris/pull/55894), [#55917](https://github.com/apache/doris/pull/55917)）
- **`[fix](paimon)`** 通过在缓存键中加入 `dlf.catalog.id` 修复 Paimon DLF Catalog 缓存问题（[#55875](https://github.com/apache/doris/pull/55875), [#55888](https://github.com/apache/doris/pull/55888)）
- **`[fix](paimon)`** 修复 Paimon 到 Doris 类型映射中 CHAR/VARCHAR 字段过大的处理问题（[#55051](https://github.com/apache/doris/pull/55051), [#55531](https://github.com/apache/doris/pull/55531)）
- **`[fix](maxcompute)`** 修复在下推 MaxCompute 谓词时因表列不存在而抛出 NereidsException 的问题（[#55635](https://github.com/apache/doris/pull/55635), [#55746](https://github.com/apache/doris/pull/55746)）
- **`[fix](maxcompute)`** 修复国际用户无法访问 MaxCompute Catalog 的问题（[#55256](https://github.com/apache/doris/pull/55256), [#55560](https://github.com/apache/doris/pull/55560)）
- **`[fix](hudi)`** 修复查询仅需分区列（无数据字段）的 Hudi JNI 表时的问题（[#55466](https://github.com/apache/doris/pull/55466), [#55662](https://github.com/apache/doris/pull/55662)）
- **`[fix](hive)`** 修复查询 `NULL DEFINED AS ''` 的 Hive Text 表时的问题（[#55626](https://github.com/apache/doris/pull/55626), [#55661](https://github.com/apache/doris/pull/55661)）
- **`[fix](iceberg)`** 为元数据扫描器补充缺失的 `iceberg-aws` 依赖（[#55741](https://github.com/apache/doris/pull/55741), [#55743](https://github.com/apache/doris/pull/55743)）
- **`[fix](iceberg rest)`** 使用 Iceberg 默认值刷新 OAuth2 Token（[#55578](https://github.com/apache/doris/pull/55578), [#55624](https://github.com/apache/doris/pull/55624)）


### 内存与资源管理

- **`[fix](memtracker)`** 内存未被 MemTracker 正确追踪的问题（[#55796](https://github.com/apache/doris/pull/55796), [#55823](https://github.com/apache/doris/pull/55823)）
- **`[fix](mow)`** 修复 `BaseTablet::get_rowset_by_ids()` 中 MOW 导致的崩溃（[#55539](https://github.com/apache/doris/pull/55539), [#55601](https://github.com/apache/doris/pull/55601)）
- **`[fix](mow)`** 修复 MOW 聚合缓存版本检查问题（[#55330](https://github.com/apache/doris/pull/55330), [#55475](https://github.com/apache/doris/pull/55475)）
- **`[fix](move-memtable)`** 修复因错误跳过段而引起的段数量不匹配问题（[#55092](https://github.com/apache/doris/pull/55092), [#55471](https://github.com/apache/doris/pull/55471)）
- **`[fix](filecache)`** 云模式下段缓存不再限制文件描述符数量（[#55610](https://github.com/apache/doris/pull/55610), [#55638](https://github.com/apache/doris/pull/55638)）


### 安全与加密

- **`[fix](tde)`** 修正加密密钥版本的显示（[#56092](https://github.com/apache/doris/pull/56092), [#56068](https://github.com/apache/doris/pull/56068)）
- **`[fix](tde)`** 修复与透明数据加密（TDE）相关的问题（[#55692](https://github.com/apache/doris/pull/55692)）


### 其他修复

- **`[fix](mtmv)`** 修复当分区表没有分区时 MTMV 无法刷新的问题（[#55468](https://github.com/apache/doris/pull/55468), [#56085](https://github.com/apache/doris/pull/56085)）
- **`[fix](plugin)`** 修复插件目录的兼容性问题（[#56060](https://github.com/apache/doris/pull/56060)）
- **`[fix](http stream)`** HTTP 流式接口在 SQL 解析失败时应抛出异常（[#55863](https://github.com/apache/doris/pull/55863), [#55891](https://github.com/apache/doris/pull/55891)）
- **`[fix](backup)`** 支持备份元数据/作业信息超过 2GB（[#55608](https://github.com/apache/doris/pull/55608), [#55867](https://github.com/apache/doris/pull/55867)）
- **`[fix](mysql protocol)`** 转发到 Master 时正确设置更多语句存在标志（[#55711](https://github.com/apache/doris/pull/55711), [#55871](https://github.com/apache/doris/pull/55871)）
- **`[fix](connection)`** 修复因超时断开连接时未清理会话相关数据的问题（[#55008](https://github.com/apache/doris/pull/55008), [#55809](https://github.com/apache/doris/pull/55809), [#55396](https://github.com/apache/doris/pull/55396)）
- **`[fix](wal)`** 执行失败时重放 WAL 中止事务失败的问题（[#55881](https://github.com/apache/doris/pull/55881), [#55924](https://github.com/apache/doris/pull/55924)）
- **`[fix](restore)`** 清理已恢复的表/分区/资源以降低开销（[#55757](https://github.com/apache/doris/pull/55757), [#55784](https://github.com/apache/doris/pull/55784)）
- **`[fix](index)`** 移除未使用的更新索引（[#55514](https://github.com/apache/doris/pull/55514), [#55704](https://github.com/apache/doris/pull/55704)）
- **`[fix](txn lazy commit)`** 修复事务延迟提交与 Schema Change 冲突的问题（[#55349](https://github.com/apache/doris/pull/55349), [#55701](https://github.com/apache/doris/pull/55701)）
- **`[fix](qe)`** 修复 SSL 模式下的查询错误（[#53134](https://github.com/apache/doris/pull/53134), [#55628](https://github.com/apache/doris/pull/55628)）
- **`[fix](catalog)`** 使用位与操作替代 `Math.abs` 以确保生成非负 ID（[#55183](https://github.com/apache/doris/pull/55183), [#55689](https://github.com/apache/doris/pull/55689)）
- **`[fix](function)`** 修复 `array_agg_foreach` 函数结果错误的问题（[#55075](https://github.com/apache/doris/pull/55075), [#55420](https://github.com/apache/doris/pull/55420)）


## 基础设施与开发

### 构建与依赖

- **`[chore](build)`** 优化构建脚本（[#56027](https://github.com/apache/doris/pull/56027), [#56028](https://github.com/apache/doris/pull/56028)）
- **`[chore](thirdparty)`** 将 aws-sdk-cpp 从 1.11.119 升级至 1.11.219（[#54780](https://github.com/apache/doris/pull/54780), [#54971](https://github.com/apache/doris/pull/54971)）
- **`[chore](build)`** 更新带 OpenSSL 的 libevent 依赖（[#54652](https://github.com/apache/doris/pull/54652), [#54857](https://github.com/apache/doris/pull/54857)）
- **`[chore](config)`** 添加 `brpc::usercode_in_pthread` 配置以支持 ASAN（[#54656](https://github.com/apache/doris/pull/54656), [#54829](https://github.com/apache/doris/pull/54829)）


### 测试与质量

- **`[chore](case)`** 修复若干失败的测试用例（[#56140](https://github.com/apache/doris/pull/56140), [#56167](https://github.com/apache/doris/pull/56167)）
- **`[fix](case)`** 修复若干失败的测试用例（[#56019](https://github.com/apache/doris/pull/56019), [#56035](https://github.com/apache/doris/pull/56035)）
- **`[fix](test)`** 修改回归测试以提高稳定性并调整预期日志级别（[#55169](https://github.com/apache/doris/pull/55169), [#55898](https://github.com/apache/doris/pull/55898)）
- **`[fix](case)`** 修复若干失败的测试用例（[#55739](https://github.com/apache/doris/pull/55739), [#55769](https://github.com/apache/doris/pull/55769)）
- **`[fix](case)`** 修复回归测试用例：cse.groovy（[#53434](https://github.com/apache/doris/pull/53434), [#55897](https://github.com/apache/doris/pull/55897)）
- **`[fix](cases)`** 修复 `test_hudi_snapshot` 测试失败问题（[#55761](https://github.com/apache/doris/pull/55761), [#55791](https://github.com/apache/doris/pull/55791)）
- **`[fix](case)`** 修复若干失败的测试用例（[#55811](https://github.com/apache/doris/pull/55811), [#55835](https://github.com/apache/doris/pull/55835)）
- **`[fix](case)`** 等待 MV 任务时应只关注最新任务（[#55802](https://github.com/apache/doris/pull/55802), [#55830](https://github.com/apache/doris/pull/55830)）
- **`[fix](case)`** 修复 Variant 构建索引的测试用例（[#55613](https://github.com/apache/doris/pull/55613), [#55648](https://github.com/apache/doris/pull/55648)）
- **`[Fix](case)`** 修复 show data p2 测试用例（[#55449](https://github.com/apache/doris/pull/55449), [#55494](https://github.com/apache/doris/pull/55494)）
- **`[fix](test)`** 修复异步物化视图的 `show create table` 显示失败问题（[#55278](https://github.com/apache/doris/pull/55278), [#55480](https://github.com/apache/doris/pull/55480)）
- **`[fix](test)`** 在云模式下跳过部分测试（[#55448](https://github.com/apache/doris/pull/55448), [#55535](https://github.com/apache/doris/pull/55535)）
- **`[Fix](case)`** 修复若干测试用例（[#55606](https://github.com/apache/doris/pull/55606), [#55656](https://github.com/apache/doris/pull/55656)）
- **`[test](export)`** 为包含表达式的导出用例增加并行度测试（[#55636](https://github.com/apache/doris/pull/55636), [#55659](https://github.com/apache/doris/pull/55659)）
- **`[test](iceberg)`** 新增 Polaris 测试（[#55484](https://github.com/apache/doris/pull/55484), [#55557](https://github.com/apache/doris/pull/55557)）
- **`[test](nereids)`** 为 SQL 缓存/有序分区缓存增加单元测试（[#55520](https://github.com/apache/doris/pull/55520), [#55536](https://github.com/apache/doris/pull/55536)）
- **`[test](docker)`** 适配 HMS 和 GCS 上的 Paimon（[#55473](https://github.com/apache/doris/pull/55473), [#55512](https://github.com/apache/doris/pull/55512)）
- **`[test](warmup)`** 修复不稳定的周期性预热测试用例（[#55365](https://github.com/apache/doris/pull/55365), [#55453](https://github.com/apache/doris/pull/55453)）


### 安全与配置

- **`[chore](sk)`** 对日志中的 `secret key` 进行加密，并隐藏 `access key`（[#55241](https://github.com/apache/doris/pull/55241), [#55619](https://github.com/apache/doris/pull/55619)）
- **`[chore](security)`** `user_files_secure_path` 配置项运行时不可更改（[#55395](https://github.com/apache/doris/pull/55395), [#55504](https://github.com/apache/doris/pull/55504)）
- **`[chore](tablet)`** `ignore_load_tablet_failure` 默认值设为 true（[#55109](https://github.com/apache/doris/pull/55109), [#55441](https://github.com/apache/doris/pull/55441)）


### 云基础设施

- **`[chore](cloud)`** 更新构建和启动脚本（[#56031](https://github.com/apache/doris/pull/56031), [#56064](https://github.com/apache/doris/pull/56064)）
- **`[chore](cloud)`** 支持在事务提交时上报冲突范围（[#55340](https://github.com/apache/doris/pull/55340), [#55714](https://github.com/apache/doris/pull/55714)）
- **`[chore](recycler)`** 改进回收器（recycler）指标（[#55455](https://github.com/apache/doris/pull/55455), [#55479](https://github.com/apache/doris/pull/55479)）
- **`[chore](logs)`** 打印导出任务拆分 Tablet ID 的日志（[#55170](https://github.com/apache/doris/pull/55170), [#55646](https://github.com/apache/doris/pull/55646)）


### 第三方与补丁

- **`[thirdparty](patch)`** BRPC 强制所有连接使用 SSL（[#55658](https://github.com/apache/doris/pull/55658), [#55696](https://github.com/apache/doris/pull/55696)）
- **`[thirdparty](patch)`** 修复启用 SSL 时 BRPC 崩溃的问题（[#55649](https://github.com/apache/doris/pull/55649), [#55695](https://github.com/apache/doris/pull/55695)）
- **`[fix](docker)`** 将 Kafka Docker 镜像更新为内部源（[#55460](https://github.com/apache/doris/pull/55460), [#55487](https://github.com/apache/doris/pull/55487)）


### CI 与性能

- **`[ci](perf)`** 更新目标分支的 Docker 镜像引用（[#55511](https://github.com/apache/doris/pull/55511)）


## 行为变更

### 配置变更

- **`[opt](hive)`** `hive.recursive_directories` 默认值变更为 `true`
- **`[chore](tablet)`** `ignore_load_tablet_failure` 默认值变更为 `true`
- **`[chore](security)`** `user_files_secure_path` 配置项运行时不可再修改


### 安全增强

- **`[chore](sk)`** 为提升安全性，日志中 secret key 现已加密，access key 已隐藏


## 兼容性说明

- 本版本与 Apache Doris 3.1.0 保持向后兼容
- 云恢复功能现已支持从 Doris 2.1 版本迁移至 3.1 版本
- 增强了 time 与 datetime 类型之间的类型转换支持