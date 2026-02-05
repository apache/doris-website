---
{
    "title": "Release 4.0.3",
    "language": "zh-CN",
    "description": "Apache Doris 4.0.3 版本发布说明"
}
---

# 功能特性

## AI 与搜索

- 添加倒排索引 NORMALIZER 支持
- 实现类似 ES 的布尔查询 [[feature](inverted index) Implement es-like boolean query #58545](https://github.com/apache/doris/pull/58545)
- 为搜索函数引入 lucene 布尔模式 [[feature](https://claude.ai/chat/search) introduce lucene bool mode for search function #59394](https://github.com/apache/doris/pull/59394)

## 湖仓一体

- 支持通过 AwsCredentialsProviderChain 加载 Catalog 凭证 [[feat](https://claude.ai/chat/catalog)Support for Loading Catalog Credentials via AwsCredentialsProviderChain #58740](https://github.com/apache/doris/pull/58740)
- 支持使用 OSSHDFS 存储的 Paimon DLF Catalog [[feat](https://claude.ai/chat/Catalog)Support Paimon DLF Catalog Using OSSHDFS Storage #59245](https://github.com/apache/doris/pull/59245)
- 为 Iceberg 表添加 manifest 级别缓存 [[Feature](https://claude.ai/chat/iceberg) Add manifest-level cache for Iceberg tables to reduce I/O and parsing overhead #59056](https://github.com/apache/doris/pull/59056)

## 查询引擎

- 支持 INTERVAL 函数并修复 EXPORT_SET [[Feature](https://claude.ai/chat/func) Support INTERVAL function and fix EXPORT_SET constant process #58885](https://github.com/apache/doris/pull/58885)
- 支持 TIME_FORMAT 函数 [[Feature](https://claude.ai/chat/function) Support function TIME_FORMAT #58592](https://github.com/apache/doris/pull/58592)
- 支持 QUANTILE_STATE_TO/FROM_BASE64 函数 [[Feature](https://claude.ai/chat/func) Support function QUANTILE_STATE_TO/FROM_BASE64 #59664](https://github.com/apache/doris/pull/59664)

# 改进优化

- 引入加载作业系统表 [[feat](https://claude.ai/chat/load) introduce load job system table #57421](https://github.com/apache/doris/pull/57421)
- 使视图、物化视图、生成列和别名函数能够持久化会话变量 [[feature](https://claude.ai/chat/variable) enables views, materialized views, generated columns, and alias functions to persist session variables #58031](https://github.com/apache/doris/pull/58031)
- 将表查询计划操作接收的 SQL 添加到审计日志 [[feature](https://claude.ai/chat/QueryPlanAction)add sql received from table query plan action into audit log #58739](https://github.com/apache/doris/pull/58739)
- 启用流式加载记录到审计日志系统表 [[feat](https://claude.ai/chat/load) enable stream load record to audit log system table #57530](https://github.com/apache/doris/pull/57530)
- 通过列裁剪优化复杂类型列读取
- 兼容 MySQL MOD 语法 [[improve](https://claude.ai/chat/syntax) compatiable with mysql MOD syntax #58432](https://github.com/apache/doris/pull/58432)
- 为 sql_digest 生成添加动态配置 [[feature](https://claude.ai/chat/audit) add dynamic configuration for sql_digest generation #59102](https://github.com/apache/doris/pull/59102)
- 使用 Youngs-Cramer 算法实现 REGR_SLOPE/INTERCEPT 以与 PG 对齐 [[fix](https://claude.ai/chat/regr) Use Youngs-Cramer for REGR_SLOPE/INTERCEPT to align with PG #55940](https://github.com/apache/doris/pull/55940)

# 缺陷修复

- 修复 JdbcConnector 关闭时的 JNI 全局引用泄漏 [[fix](https://claude.ai/chat/jdbc) Fix JNI global reference leak in JdbcConnector close #58574](https://github.com/apache/doris/pull/58574)
- 修复由于 BE 统计信息上传不及时导致 CBO 无法稳定选择同步物化视图的问题 [[fix](https://claude.ai/chat/mv) Fix sync mv could not be chosen by cbo stable because stats upload from be not in time #58720](https://github.com/apache/doris/pull/58720)
- 用默认的 JSONB null 值替换无效的 JSONB [[fix](https://claude.ai/chat/json) Replace invalid JSONB with default JSONB null value #59007](https://github.com/apache/doris/pull/59007)
- 修复由于并发删除后端导致的 OlapTableSink.createPaloNodesInfo 空指针异常 [[Fix](https://claude.ai/chat/fe) Fix NPE in `OlapTableSink.createPaloNodesInfo` due to concurrent drop backend #58999](https://github.com/apache/doris/pull/58999)
- 修复 FROM DUAL 错误匹配以 dual 开头的表名 [[fix](https://claude.ai/chat/parser) Fix FROM DUAL incorrectly matching table names starting with dual #59003](https://github.com/apache/doris/pull/59003)
- 修复 BE 宕机时预热取消失败的问题 [[fix](https://claude.ai/chat/filecache) fix warm up cancel failure when BE is down #58035](https://github.com/apache/doris/pull/58035)
- 修复当物化视图被 LimitAggToTopNAgg 重写但查询未被重写时物化视图重写失败的问题 [[fix](https://claude.ai/chat/mtmv) Fix mv rewrite failed when mv is rewritten by LimitAggToTopNAgg but query is not #58974](https://github.com/apache/doris/pull/58974)
- 修复刷新时 lastUpdateTime 未更新的问题并添加定时刷新日志 [[fix](https://claude.ai/chat/catalog) Fix lastUpdateTime not updated on refresh and add scheduled refresh logs #58997](https://github.com/apache/doris/pull/58997)
- 修复 hll_from_base64 输入无效时的崩溃问题 [[fix](https://claude.ai/chat/core) fix core if hll_from_base64 input invalid #59106](https://github.com/apache/doris/pull/59106)
- 修复带表达式的加载列映射的敏感性问题 [[fix](https://claude.ai/chat/load) Fix the sensitivity issue of load column mapping with expressions #59149](https://github.com/apache/doris/pull/59149)
- 修复删除表时未删除约束相关信息的问题 [[fix](https://claude.ai/chat/pkfk) Fix drop table not drop constraint related info #58958](https://github.com/apache/doris/pull/58958)
- 修复 parquet topn 延迟物化复杂数据错误结果 [[fix](https://claude.ai/chat/parquet)fix parquet topn lazy mat complex data error result #58785](https://github.com/apache/doris/pull/58785)
- 始终创建数据和索引页缓存以避免空指针 [[fix](https://claude.ai/chat/cache) always create data and index page cache to avoid null pointer #59266](https://github.com/apache/doris/pull/59266)
- 修改 tablet cooldownConfLock 以减少内存占用 [[fix](https://claude.ai/chat/fe) modify tablet cooldownConfLock to reduce memory #59356](https://github.com/apache/doris/pull/59356)
- 修复读取 parquet footer 时缺失 profile 的问题
- 修复 Exception::to_string 中潜在的释放后使用问题 [[Fix](https://claude.ai/chat/Exception) Fix potential use-after-free because `Exception::to_string` is not thread safe #59558](https://github.com/apache/doris/pull/59558)
- 修复浮点字段 to_string 问题
- 修复读取 hudi parquet 导致 BE 崩溃的问题 [[fix](https://claude.ai/chat/parquet)fix hudi parquet read hoodie.datasource.write.drop.partition.columns prop table cause be core. #58532](https://github.com/apache/doris/pull/58532)
- 修复 Kerberos 认证配置检测 [[Fix](https://claude.ai/chat/Hdfs)Fix Kerberos auth config detection and auto-enable hive.metastore.sasl #59748](https://github.com/apache/doris/pull/59748)
- 修复空表下的同步失败问题 [[Fix](https://claude.ai/chat/Streamingjob) Fix the issue of synchronization failure under empty tables #59735](https://github.com/apache/doris/pull/59735)
- 修复 parquet 类型未处理 float16 的问题 [[bug](https://claude.ai/chat/parquet) fix parquet type not handle float16 type #58528](https://github.com/apache/doris/pull/58528)
- 修复 BM25 LENGTH_TABLE 范数解码问题 [[fix](inverted index) fix BM25 LENGTH_TABLE using byte4_to_int for correct norm decoding #59713](https://github.com/apache/doris/pull/59713)
- 避免某些日期类函数的误报 [[Fix](https://claude.ai/chat/function) avoid false alarm of some datelike functions #59897](https://github.com/apache/doris/pull/59897)