---
{
    "title": "Release 3.1.3",
    "language": "zh-CN",
    "description": "Apache Doris 3.1.3版本发布，新增MaxCompute Catalog项目级模式、Azure Blob Storage支持、EXPLODE函数struct展开功能。优化云原生架构的balance同步预热、peer cache读取性能，升级libhdfs至3.4.2，修复存储、Catalog连接、SQL引擎等多项关键问题，全面提升多云环境下的稳定性和数据湖集成能力。"
}
---

## 新功能

### 存储与文件系统

- 升级 **libhdfs 至 3.4.2**（[#57638](https://github.com/apache/doris/pull/57638)）
- 为 **S3 Reader** 增加 `TotalGetRequestTime` 性能指标（[#57636](https://github.com/apache/doris/pull/57636)）

### Catalog

- 支持 **MaxCompute Catalog（project-schema-table 模式）**（[#57286](https://github.com/apache/doris/pull/57286)）
- 支持 **Azure Blob Storage**（[#57219](https://github.com/apache/doris/pull/57219)）
- 支持 **在转换方言后的 SQL 执行错误后，重试原始 SQL**（[#57498](https://github.com/apache/doris/pull/57498)）

### 云模式

- 支持 **balance sync 热身机制**（[#57666](https://github.com/apache/doris/pull/57666)）
- 支持 **同一集群内 BE 间的 peer cache 读取**（[#57672](https://github.com/apache/doris/pull/57672)）

### SQL 引擎与优化器

- 在生成执行计划前检查 **SQL 正则屏蔽规则**（[#57706](https://github.com/apache/doris/pull/57706)）
- **EXPLODE 函数** 支持 **struct 类型展开**（[#57827](https://github.com/apache/doris/pull/57827)）

## 优化

### 查询执行与优化器

- 优化 **variant 类型仅含 NULL 值时的 cast 性能**（[#57161](https://github.com/apache/doris/pull/57161)）
- 优化 **FROM_UNIXTIME 函数性能**（[#57573](https://github.com/apache/doris/pull/57573)）
- 改进 **优雅下线行为与查询重试逻辑**（[#57805](https://github.com/apache/doris/pull/57805)）

### 存储与 Compaction

- **MergeIO 读取切片大小** 支持配置化（[#57159](https://github.com/apache/doris/pull/57159)）
- 为冷数据 **Compaction 增加评分阈值**（[#57217](https://github.com/apache/doris/pull/57217)）
- 为小内存任务保护机制增加 **可配置阈值**（[#56994](https://github.com/apache/doris/pull/56994)）
- 优化 **jemalloc 配置**，减少缺页中断（[#57152](https://github.com/apache/doris/pull/57152)）

### 云模式

- 暴露 **云端 rebalance 指标**（[#57352](https://github.com/apache/doris/pull/57352)）
- 优化 **warm-up 任务创建逻辑**（[#57865](https://github.com/apache/doris/pull/57865)）
- 提升 **warm-up 与 peer read 效率**（[#57554](https://github.com/apache/doris/pull/57554)，[#57807](https://github.com/apache/doris/pull/57807)）

### 索引与搜索

- 支持 **自定义分词器（char_filter、basic 和 ICU tokenizer）**（[#57137](https://github.com/apache/doris/pull/57137)）
- 自定义分词器支持 **内置 analyzer 名称**（[#57727](https://github.com/apache/doris/pull/57727)）

## Bug 修复

### 存储与文件 I/O

- 修复 **添加 key 列时 segcompaction 崩溃问题**（[#57212](https://github.com/apache/doris/pull/57212)）
- 修复 **Parquet RLE_DICTIONARY 解码性能问题**（[#57614](https://github.com/apache/doris/pull/57614)）
- 修复 **schema change 表达式缓存误用问题**（[#57517](https://github.com/apache/doris/pull/57517)）
- 使用 **ForkJoinPool 重构 tablet report 实现**（[#57927](https://github.com/apache/doris/pull/57927)）

### 云模式

- 修复 **pipeline 任务数量计算错误**（[#57261](https://github.com/apache/doris/pull/57261)）
- 修复 **rebalance 残留指标未清理问题**（[#57438](https://github.com/apache/doris/pull/57438)）
- 在 rebalance 未初始化时 **跳过 tablet report**（[#57393](https://github.com/apache/doris/pull/57393)）
- 修复 **domain 用户默认集群上报错误**（[#57555](https://github.com/apache/doris/pull/57555)）
- 修复 **私有 endpoint 配置错误**（[#57675](https://github.com/apache/doris/pull/57675)）
- 修复 **peer read 错误与线程处理问题**（[#57910](https://github.com/apache/doris/pull/57910)，[#57807](https://github.com/apache/doris/pull/57807)）
- 修复 **filecache 指标与 microbench 问题**（[#57535](https://github.com/apache/doris/pull/57535)，[#57536](https://github.com/apache/doris/pull/57536)）

### Catalog

- 修复 **MaxCompute 谓词下推空指针错误**（[#57567](https://github.com/apache/doris/pull/57567)）
- 修复 **Iceberg client.region 与 REST 认证问题**（[#57539](https://github.com/apache/doris/pull/57539)）
- 修复 **Iceberg Catalog NPE 与查询异常**（[#57796](https://github.com/apache/doris/pull/57796)，[#57790](https://github.com/apache/doris/pull/57790)）
- 修复 **Paimon S3 前缀与配置不一致问题**（[#57526](https://github.com/apache/doris/pull/57526)）
- 修复 **JDBC Catalog** **`zeroDateTimeBehavior`** **参数兼容性问题**（[#57731](https://github.com/apache/doris/pull/57731)）
- 修复 **Parquet Schema 分析错误**（[#57500](https://github.com/apache/doris/pull/57500)）
- 修复 **Parquet 所有 row group 被过滤问题**（[#57646](https://github.com/apache/doris/pull/57646)）
- 修复 **CSV 读取 escape=enclose 时的结果错误**（[#57762](https://github.com/apache/doris/pull/57762)）
- 防止 **Catalog 被误删出刷新队列**（[#57671](https://github.com/apache/doris/pull/57671)）
- 修复 **max_meta_object_cache_num 必须大于 0 的配置问题**（[#57793](https://github.com/apache/doris/pull/57793)）

### SQL 引擎与优化器

- 修复 **FROM_UNIXTIME + decimal 常量折叠错误**（[#57606](https://github.com/apache/doris/pull/57606)）
- 修复 **MV 重写在 group sets + filter 下失败问题**（[#57674](https://github.com/apache/doris/pull/57674)）
- 修复 **prepare statement 仅 explain SQL 的问题**（[#57504](https://github.com/apache/doris/pull/57504)）
- 在 **Profile.releaseMemory()** 中释放物理计划内存（[#57316](https://github.com/apache/doris/pull/57316)）
- 修复 **group sets 下聚合消除错误**（[#57885](https://github.com/apache/doris/pull/57885)）
- 修复 **LargeInt 溢出（max_value+1）问题**（[#57351](https://github.com/apache/doris/pull/57351)）
- 修复 **decimal256 转 float 溢出问题**（[#57503](https://github.com/apache/doris/pull/57503)）

### 网络与平台

- 修复 **MySQL SSL unwrap 无限循环问题**（[#57599](https://github.com/apache/doris/pull/57599)）
- 禁用 **MySQL TLS renegotiation**（[#57748](https://github.com/apache/doris/pull/57748)）
- 修复 **uint128 构造未对齐问题**（[#57430](https://github.com/apache/doris/pull/57430)）
- 修复 **JNI 本地/全局引用泄漏**（[#57597](https://github.com/apache/doris/pull/57597)）
- **Scanner.close()** 增加线程安全保护（[#57644](https://github.com/apache/doris/pull/57644)）
- 修复 **Exchange 节点空指针导致的崩溃问题**（[#57698](https://github.com/apache/doris/pull/57698)）

## 杂项

- 废弃 **LakeSoul 外部 Catalog 支持**（[#57163](https://github.com/apache/doris/pull/57163)）

## 总结

Apache Doris **3.1.3** 带来了以下主要改进：

- **存储兼容性增强**（支持 Azure Blob、Hadoop 3.4.2、S3 性能指标）
- **云端性能与可靠性提升**（warm-up、rebalance、peer cache）
- **SQL 优化器稳定性增强**
- **依赖升级与安全性改进**

本次版本显著提升了 Doris 在 **稳定性、性能与云原生融合能力** 方面的整体表现