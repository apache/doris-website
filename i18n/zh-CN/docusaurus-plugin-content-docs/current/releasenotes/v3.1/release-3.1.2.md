---
{
    "title": "Release 3.1.2",
    "language": "zh-CN",
    "description": "Apache Doris 3.1.2版本发布，新增表级压缩配置、云模式查询新鲜度控制、AWS Glue Catalog IAM AssumeRole支持等核心功能。优化COUNT(*)查询性能、Variant列缓存、Iceberg/Paimon数据湖集成，修复数据湖连接、查询执行、存储导入等多处缺陷，显著提升云原生环境下的大数据分析效率和稳定性。"
}
---


## 新功能

  ### 存储与压缩

  - **可配置的表压缩类型** —— 支持为每张表单独指定压缩算法。[#56276](https://github.com/apache/doris/pull/56276)
  - **自适应压缩写缓存** —— 在基础压缩（base compaction）行集（rowset）刷写过程中动态调整写缓存策略。[#56278](https://github.com/apache/doris/pull/56278)

  ### 云与对象存储

  - **云模式查询新鲜度控制** —— 新增用户自定义的数据延迟与一致性之间的容忍度配置。[#56390](https://github.com/apache/doris/pull/56390)
  - **放宽对象存储端点验证** —— 支持私有或自定义存储端点。[#56641](https://github.com/apache/doris/pull/56641)

  ### 数据湖（Datalake）

  - **支持通过数据湖** **VPC** **端点（**`dlf/datalake-vpc`）访问 OSS**。[#56476](https://github.com/apache/doris/pull/56476)
  - **AWS Glue Catalog** 现支持通过 IAM AssumeRole 访问 S3。[#57036](https://github.com/apache/doris/pull/57036)
  - **S3 客户端** 已更新为使用 `CustomAwsCredentialsProviderChain`，以改进凭证管理。[#56943](https://github.com/apache/doris/pull/56943)

  ### 功能增强

  - **Java** **UDF** 现支持 IP 类型。[#56346](https://github.com/apache/doris/pull/56346)
  - **BE REST** **API** 新增 `RunningTasks` 输出项，用于任务监控。[#56781](https://github.com/apache/doris/pull/56781)
  - **事务监控** 新增 BRPC 写放大（write-amplification）指标。[#56832](https://github.com/apache/doris/pull/56832)

  ## 优化

  ### 查询执行与优化器

  - **`COUNT(\*)`** 优化** —— 自动选择最小的列以减少扫描负载。[#56483](https://github.com/apache/doris/pull/56483)
  - **压缩过程** 跳过空行集，以提升吞吐量。[#56768](https://github.com/apache/doris/pull/56768)
  - **预热（Warmup）统计信息** 新增“跳过的行集”指标，提升可观测性。[#56373](https://github.com/apache/doris/pull/56373)

  ### 存储层

  - **为稀疏列新增 Variant 列缓存**，以加速读取。[#56730](https://github.com/apache/doris/pull/56730)
  - **段（Segment）页脚** 现已缓存在索引页缓存（Index Page Cache）中，以降低延迟。[#56459](https://github.com/apache/doris/pull/56459)
  - **回收器（Recycler）** 支持并行清理任务，提高吞吐量。[#56573](https://github.com/apache/doris/pull/56573)

  ### 数据湖

  - **改进 Paimon 时间旅行（Time Travel）功能**，并修复了模式（schema）不匹配问题。[#56338](https://github.com/apache/doris/pull/56338)
  - **优化 Iceberg 扫描错误信息**，并支持嵌套命名空间。[#56370](https://github.com/apache/doris/pull/56370), [#57035](https://github.com/apache/doris/pull/57035)
  - **移除旧版 DLF Catalog 属性**。[#56196](https://github.com/apache/doris/pull/56196), [#56505](https://github.com/apache/doris/pull/56505)
  - **JSON** **导入** 默认采用逐行解析模式（row-by-row parsing mode）处理基于行的数据。[#56736](https://github.com/apache/doris/pull/56736)

  ## 缺陷修复

  ### 数据湖

  - 修复 **Iceberg 系统表类加载器（classloader）错误**。[#56220](https://github.com/apache/doris/pull/56220)
  - 修复 **Iceberg 分区表在无分区值时失败的问题**。[#57043](https://github.com/apache/doris/pull/57043)
  - 修复 **S3A Catalog 未正确使用 IAM AssumeRole 配置文件的问题**。[#56250](https://github.com/apache/doris/pull/56250)
  - 为多配置对象存储 Catalog **禁用 Hadoop FileSystem 缓存**。[#57153](https://github.com/apache/doris/pull/57153)

  ### 查询执行与 SQL 引擎

  - 修复 `COUNT` 下推逻辑错误。[#56482](https://github.com/apache/doris/pull/56482)
  - 修复 `UNION` 本地 shuffle 行为异常。[#56556](https://github.com/apache/doris/pull/56556)
  - 修复 OLAP 存储类型中 `IN` 谓词导致的崩溃问题。[#56834](https://github.com/apache/doris/pull/56834)
  - 修复 `datetimev1` 类型下 `timestampdiff` 计算错误。[#56893](https://github.com/apache/doris/pull/56893)
  - 修复 `explode()` 函数导致的崩溃问题。[#57002](https://github.com/apache/doris/pull/57002)

  ### 存储与导入

  - 修复源文件不存在时 S3 导入检查失败的问题。[#56376](https://github.com/apache/doris/pull/56376)
  - 修复 FileCache 清理时崩溃的问题。[#56584](https://github.com/apache/doris/pull/56584)
  - 修复 MOW 压缩模式下删除位图（delete bitmap）未被清除的问题。[#56785](https://github.com/apache/doris/pull/56785)
  - 修复小文件使用 Outfile 的 bz2 压缩时失败的问题。[#57041](https://github.com/apache/doris/pull/57041)

  ### 云与回收机制

  - 修复预热（Warmup）跳过多段（multi-segment）行集的问题。[#56680](https://github.com/apache/doris/pull/56680)
  - 修复 CloudTablet 预热过程中因引用捕获导致的 core dump 问题。[#56627](https://github.com/apache/doris/pull/56627)
  - 修复回收器（Recycler）清理任务中的空指针崩溃问题。[#56773](https://github.com/apache/doris/pull/56773)
  - 修复云模式下未捕获的分区边界错误。[#56968](https://github.com/apache/doris/pull/56968)

  ### 系统及其他

  - 修复 FE 中 Prometheus 指标格式错误的问题。[#57082](https://github.com/apache/doris/pull/57082)
  - 修复 FE 重启后自增列值不正确的问题。[#57118](https://github.com/apache/doris/pull/57118)
  - 修复 `SHOW CREATE VIEW` 语句缺失列定义的问题。[#57045](https://github.com/apache/doris/pull/57045)
  - 修复 HDFS Reader 在采样 Profile 数据时崩溃的问题。[#56950](https://github.com/apache/doris/pull/56950)