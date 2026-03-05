---
{
    "title": "Release 3.0.5",
    "language": "zh-CN",
    "description": "亲爱的社区小伙伴们，Apache Doris 3.0.5 版本已于 2025 年 04 月 28 日正式发布。 该版本进一步提升了系统的性能及稳定性，欢迎大家下载体验。"
}
---

亲爱的社区小伙伴们，**Apache Doris 3.0.5 版本已于 2025 年 04 月 28 日正式发布。** 该版本进一步提升了系统的性能及稳定性，欢迎大家下载体验。

- [GitHub 下载](https://github.com/apache/doris/releases)

- [官网下载](https://doris.apache.org/download)


## 新特性

### Lakehouse

- FE Metrics 新增 Catalog/Database/Table 数量监控指标（[#47891](https://github.com/apache/doris/pull/47891)）
- MaxCompute Catalog 支持 Timestamp 类型（[#48768](https://github.com/apache/doris/pull/48768)）

### 查询执行

- 新增 URL 处理函数：`top_level_domain`、`first_significant_subdomain`、`cut_to_first_significant_subdomain`（[#42488](https://github.com/apache/doris/pull/42488)）
- 新增 `year_of_week` 函数，兼容 Trino 语法实现（[#48870](https://github.com/apache/doris/pull/48870)）
- `percentile_array` 函数支持 Float 和 Double 数据类型（[#48094](https://github.com/apache/doris/pull/48094)）

### 存算分离

- 支持重命名计算组（Rename Compute Group）（[#46221](https://github.com/apache/doris/pull/46221)）

## 改进

### 存储

- 优化主键表（MOW）高频导入场景的查询性能（[#48968](https://github.com/apache/doris/pull/48968)）
- 优化 Key Range 查询的 Profile 信息展示（[#48191](https://github.com/apache/doris/pull/48191)）
- Stream Load 支持 JSON 压缩文件导入（[#49044](https://github.com/apache/doris/pull/49044)）
- 优化多个导入场景的错误提示信息（[#48436](https://github.com/apache/doris/pull/48436) [#47721](https://github.com/apache/doris/pull/47721) [#47804](https://github.com/apache/doris/pull/47804) [#48638](https://github.com/apache/doris/pull/48638) [#48344](https://github.com/apache/doris/pull/48344) [#49287](https://github.com/apache/doris/pull/49287) [#48009](https://github.com/apache/doris/pull/48009)）
- 新增 Routine Load 多项监控指标（[#49045](https://github.com/apache/doris/pull/49045) [#48764](https://github.com/apache/doris/pull/48764)）
- 优化 Routine Load 调度算法，避免单任务异常影响整体调度（[#47847](https://github.com/apache/doris/pull/47847)）
- 新增 Routine Load 系统表（[#49284](https://github.com/apache/doris/pull/49284)）
- 优化 Compaction 任务生成速度以提升性能（[#49547](https://github.com/apache/doris/pull/49547)）

### 存算分离

- 修复多个 File Cache 稳定性及性能问题（[#48786](https://github.com/apache/doris/pull/48786) [#48623](https://github.com/apache/doris/pull/48623) [#48687](https://github.com/apache/doris/pull/48687) [#49050](https://github.com/apache/doris/pull/49050) [#48318](https://github.com/apache/doris/pull/48318)）
- 优化 Storage Vault 创建校验逻辑（[#48073](https://github.com/apache/doris/pull/48073) [#48369](https://github.com/apache/doris/pull/48369)）

### Lakehouse

- 优化 Trino Connector Catalog 的 BE 端 Scanner 关闭逻辑，加速内存释放（[#47857](https://github.com/apache/doris/pull/47857)）
- ClickHouse JDBC Catalog 自动兼容新旧版本驱动（[#46026](https://github.com/apache/doris/pull/46026)）

### 异步物化视图

- 优化透明改写（Transparent Rewrite）的规划性能（[#48782](https://github.com/apache/doris/pull/48782)）
- 优化 `tvf mv_infos` 性能（[#47415](https://github.com/apache/doris/pull/47415)）
- 基于外部表的物化视图构建时取消 Catalog 元数据刷新，减少内存占用（[#48767](https://github.com/apache/doris/pull/48767)）

### 查询优化器

- 优化 Key 列与分区列的统计信息收集性能（[#46534](https://github.com/apache/doris/pull/46534)）
- 查询结果别名与用户输入保持严格一致（[#47093](https://github.com/apache/doris/pull/47093)）
- 优化聚合算子中公共子表达式抽取后的列裁剪逻辑（[#46627](https://github.com/apache/doris/pull/46627)）
- 增强函数绑定失败及子查询不支持的报错信息（[#47919](https://github.com/apache/doris/pull/47919) [#47985](https://github.com/apache/doris/pull/47985)）

### 半结构化数据管理

- `json_object` 函数支持复杂类型参数（[#47779](https://github.com/apache/doris/pull/47779)）
- 支持将 UInt128 写入 IPv6 类型（[#48802](https://github.com/apache/doris/pull/48802)）
- 支持 VARIANT 类型中 ARRAY 字段的倒排索引（[#47688](https://github.com/apache/doris/pull/47688) [#48117](https://github.com/apache/doris/pull/48117)）

### 权限

- 提升 Ranger 鉴权性能（[#49352](https://github.com/apache/doris/pull/49352)）

### 其他

- 优化 JVM Metrics 接口性能（[#49380](https://github.com/apache/doris/pull/49380)）

## Bug 修复

### 存储

- 修复若干极端场景下的数据正确性问题（[#48056](https://github.com/apache/doris/pull/48056) [#48399](https://github.com/apache/doris/pull/48399) [#48400](https://github.com/apache/doris/pull/48400) [#48748](https://github.com/apache/doris/pull/48748) [#48775](https://github.com/apache/doris/pull/48775) [#48867](https://github.com/apache/doris/pull/48867) [#49165](https://github.com/apache/doris/pull/49165) [#49193](https://github.com/apache/doris/pull/49193) [#49350](https://github.com/apache/doris/pull/49350) [#49710](https://github.com/apache/doris/pull/49710) [#49825](https://github.com/apache/doris/pull/49825)）
- 修复已完成事务未及时清理的问题（[#49564](https://github.com/apache/doris/pull/49564)）
- 部分列更新时 JSONB 类型默认值改用 `{}`（[#49066](https://github.com/apache/doris/pull/49066)）
- 修复存算分离主键模型 Compaction 未释放 Delete Bitmap 锁导致导入卡顿的问题（[#47766](https://github.com/apache/doris/pull/47766)）
- 修复 ARM 架构下 Stream Load 数据丢失问题（[#49666](https://github.com/apache/doris/pull/49666)）
- 修复 Insert Into Select 遇到数据质量错误未返回错误 URL 的问题（[#49687](https://github.com/apache/doris/pull/49687)）
- 修复 Routine Load 多表导入时数据质量错误未返回错误 URL 的问题（[#49130](https://github.com/apache/doris/pull/49130)）
- 修复 Schema Change 期间 Insert Into Values 导入结果异常问题（[#49338](https://github.com/apache/doris/pull/49338)）
- 修复 Tablet Commit 信息上报导致的 Core Dump 问题（[#48732](https://github.com/apache/doris/pull/48732)）
- 修复 S3 Load 导入不支持 Azure 中国区域名的问题（[#48642](https://github.com/apache/doris/pull/48642)）
- 修复 K8s 环境下 FE 报 "get image failed" 错误（[#49072](https://github.com/apache/doris/pull/49072)）
- 优化动态分区调度的 CPU 消耗（[#48577](https://github.com/apache/doris/pull/48577)）
- 修复重命名物化视图（MV）导致列异常的问题（[#48328](https://github.com/apache/doris/pull/48328)）
- 修复 Schema Change 失败后未释放内存和 File Cache 的问题（[#48426](https://github.com/apache/doris/pull/48426)）
- 修复含空分区表的 Base Compaction 失败问题（[#49062](https://github.com/apache/doris/pull/49062)）
- 修复复杂类型变更导致的数据正确性问题（[#49452](https://github.com/apache/doris/pull/49452)）
- 修复 Cold Compaction 导致 Core Dump 的问题（[#48329](https://github.com/apache/doris/pull/48329)）
- 修复存在 Delete 操作时 Cumulative Point 未提升的问题（[#47282](https://github.com/apache/doris/pull/47282)）
- 修复大数据量 Full Compaction 内存不足问题（[#48958](https://github.com/apache/doris/pull/48958)）

### 存算分离

- 修复 K8s 环境下 File Cache 清除失败问题（[#49199](https://github.com/apache/doris/pull/49199)）
- 修复高频导入时读写锁导致的 FE CPU 飙升问题（[#48564](https://github.com/apache/doris/pull/48564)）

### Lakehouse

**Data Lakes**

- 修复并发写入 Hive/Iceberg 表可能引发的 BE Core Dump（[#49842](https://github.com/apache/doris/pull/49842)）
- 修复 AWS S3 存储的 Hive/Iceberg 表写入失败问题（[#47162](https://github.com/apache/doris/pull/47162)）
- 修复 Iceberg Position Deletion 读取结果错误（[#47977](https://github.com/apache/doris/pull/47977)）
- 修复腾讯云 COS 无法创建 Iceberg 表的问题（[#49885](https://github.com/apache/doris/pull/49885)）
- 修复 Kerberos 认证 HDFS 访问 Paimon 数据失败问题（[#47192](https://github.com/apache/doris/pull/47192)）
- 修复 Hudi Jni Scanner 内存泄漏问题（[#48955](https://github.com/apache/doris/pull/48955)）
- 修复 MaxCompute Catalog 多分区列表读取错误（[#48325](https://github.com/apache/doris/pull/48325)）

**JDBC**

- 修复 JDBC Catalog 表行数查询空指针问题（[#49442](https://github.com/apache/doris/pull/49442)）
- 修复 OceanBase Oracle 模式连接测试失败（[#49442](https://github.com/apache/doris/pull/49442)）
- 修复 JDBC Catalog 并发场景下列类型长度错误（[#48541](https://github.com/apache/doris/pull/48541)）
- 修复 JDBC Catalog BE 端 Classloader 泄漏（[#46912](https://github.com/apache/doris/pull/46912)）
- 修复 PostgreSQL JDBC Catalog 连接线程泄漏（[#49568](https://github.com/apache/doris/pull/49568)）

**Export**

- 修复 EXPORT 作业卡在 EXPORTING 状态（[#47974](https://github.com/apache/doris/pull/47974)）
- 禁止 OUTFILE 自动重试以防止重复文件导出（[#48095](https://github.com/apache/doris/pull/48095)）

**其他**

- 修复 FE WebUI 执行 TVF 查询空指针问题（[#49213](https://github.com/apache/doris/pull/49213)）
- 修复 Hadoop Libhdfs Thread Local 空指针异常（[#48280](https://github.com/apache/doris/pull/48280)）
- 修复 FE 访问 Hadoop Filesystem 报 "Filesystem already closed"（[#48351](https://github.com/apache/doris/pull/48351)）
- 修复 Catalog Comment 未持久化问题（[#46946](https://github.com/apache/doris/pull/46946)）
- 修复 Parquet 复杂类型读取报错（[#47734](https://github.com/apache/doris/pull/47734)）

### 异步物化视图

- 修复极端场景下物化视图构建任务卡顿问题（[#48074](https://github.com/apache/doris/pull/48074)）
- 修复嵌套物化视图透明改写失效问题（[#48222](https://github.com/apache/doris/pull/48222)）

### 查询优化器

- 修复函数常量折叠计算结果错误（[#49225](https://github.com/apache/doris/pull/49225) [#47966](https://github.com/apache/doris/pull/47966) [#49416](https://github.com/apache/doris/pull/49416) [#49087](https://github.com/apache/doris/pull/49087) [#49033](https://github.com/apache/doris/pull/49033) [#49061](https://github.com/apache/doris/pull/49061) [#48895](https://github.com/apache/doris/pull/48895) [#48957](https://github.com/apache/doris/pull/48957) [#47288](https://github.com/apache/doris/pull/47288) [#48641](https://github.com/apache/doris/pull/48641) [#49413](https://github.com/apache/doris/pull/49413) [#48783](https://github.com/apache/doris/pull/48783)）
- 修复嵌套窗口函数使用 ORDER BY 子句意外报错（[#48492](https://github.com/apache/doris/pull/48492)）

### 查询执行

- 修复 Pipeline 任务调度导致的卡死/性能问题（[#49976](https://github.com/apache/doris/pull/49976) [#49007](https://github.com/apache/doris/pull/49007)）
- 修复 FE 连接失败时的内存越界问题（[#48370](https://github.com/apache/doris/pull/48370) [#48313](https://github.com/apache/doris/pull/48313)）
- 修复 Lambda 函数与数组函数共用导致的内存越界（[#49140](https://github.com/apache/doris/pull/49140)）
- 修复 String 与 JSONB 类型转换空值导致 BE Core（[#49810](https://github.com/apache/doris/pull/49810)）
- 规范 `parse_url` 未定义行为（[#49149](https://github.com/apache/doris/pull/49149)）
- 修复 `array_overlap` 函数空值结果异常（[#49403](https://github.com/apache/doris/pull/49403)）
- 修复非 ASCII 字符大小写转换错误（[#49763](https://github.com/apache/doris/pull/49763)）
- 修复 `percentile` 函数部分场景 BE Core（[#48563](https://github.com/apache/doris/pull/48563)）
- 修复多个内存越界问题（[#48288](https://github.com/apache/doris/pull/48288) [#49737](https://github.com/apache/doris/pull/49737) [#48018](https://github.com/apache/doris/pull/48018) [#47964](https://github.com/apache/doris/pull/47964)）
- 修复 SET 算子结果错误（[#48001](https://github.com/apache/doris/pull/48001)）
- 降低 Arrow Flight 默认线程池大小以避免句柄耗尽（[#48530](https://github.com/apache/doris/pull/48530)）
- 修复窗口函数内存越界导致 BE Core（[#48458](https://github.com/apache/doris/pull/48458)）

### 半结构化数据管理

- 修复 Transfer-Encoding: chunked 的 Stream Load JSON 导入异常（[#48474](https://github.com/apache/doris/pull/48474)）
- 增强 JSONB 格式合法性校验（[#48731](https://github.com/apache/doris/pull/48731)）
- 修复 STRUCT 类型字段过多导致的 Crash（[#49552](https://github.com/apache/doris/pull/49552)）
- 支持复杂类型 VARCHAR 长度扩展（[#48025](https://github.com/apache/doris/pull/48025)）
- 修复 `array_avg` 函数在特定参数下的 Crash（[#48691](https://github.com/apache/doris/pull/48691)）
- 修复 VARIANT 类型 `ColumnObject::pop_back` Crash（[#48935](https://github.com/apache/doris/pull/48935) [#48978](https://github.com/apache/doris/pull/48978)）
- 禁用 VARIANT 类型的索引构建操作（[#49844](https://github.com/apache/doris/pull/49844)）
- 禁用 VARIANT 类型倒排索引 V1 格式（[#49890](https://github.com/apache/doris/pull/49890)）
- 修复 VARIANT 多层 CAST 结果错误（[#47954](https://github.com/apache/doris/pull/47954)）
- 优化 VARIANT 多子列倒排索引元数据查询性能（[#48153](https://github.com/apache/doris/pull/48153)）
- 优化存算分离模式下 VARIANT Schema 内存消耗（[#47629](https://github.com/apache/doris/pull/47629) [#48463](https://github.com/apache/doris/pull/48463)）
- 修复 PreparedStatement ID 溢出问题（[#48116](https://github.com/apache/doris/pull/48116)）
- 修复行存与 Delete 操作结合问题（[#49609](https://github.com/apache/doris/pull/49609)）

### 倒排索引

- 修复 ARRAY 类型倒排索引 Null Bitmap 错误（[#48052](https://github.com/apache/doris/pull/48052)）
- 修复 Date/Datetimev1 类型 Bloomfilter 索引比较错误（[#47005](https://github.com/apache/doris/pull/47005)）
- 修复 UTF-8 四字节字符截断问题（[#48792](https://github.com/apache/doris/pull/48792)）
- 修复新增列后立即创建倒排索引导致丢失的问题（[#48547](https://github.com/apache/doris/pull/48547)）
- 修复 ARRAY 倒排索引空数据处理异常（[#48264](https://github.com/apache/doris/pull/48264)）
- 修复倒排索引 FE 元数据升级兼容性（[#49283](https://github.com/apache/doris/pull/49283)）
- 修复 `match_phrase_prefix` 缓存错误（[#46517](https://github.com/apache/doris/pull/46517)）
- 修复 Compaction 后倒排索引 File Cache 未清理（[#49738](https://github.com/apache/doris/pull/49738)）

### 权限

- DELETE 操作不再检查 Select_Priv 权限（[#49239](https://github.com/apache/doris/pull/49239)）
- 禁止非 root 用户修改 root 权限（[#48752](https://github.com/apache/doris/pull/48752)）
- 修复 LDAP 偶发 Partial Result Exception（[#47858](https://github.com/apache/doris/pull/47858)）

### 其他

- 修复 JDK17 环境 JAVA_OPTS 识别异常（[#48170](https://github.com/apache/doris/pull/48170)）
- 修复 InterruptException 导致 BDB 元数据写入失败（[#47874](https://github.com/apache/doris/pull/47874)）
- 优化多语句请求的 SQL Hash 生成（[#48242](https://github.com/apache/doris/pull/48242)）
- 用户属性变量优先级高于 Session 变量（[#48548](https://github.com/apache/doris/pull/48548)）