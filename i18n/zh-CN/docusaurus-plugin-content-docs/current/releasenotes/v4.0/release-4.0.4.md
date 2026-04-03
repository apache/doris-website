---
{
    "title": "Release 4.0.4",
    "language": "zh-CN",
    "description": "Apache Doris 4.0.4 版本发布说明"
}
---

### Features

- 为Iceberg表启用系统表all_manifests ([#60279](https://github.com/apache/doris/pull/60279))
- 支持为OSS配置bucket-domain-name ([#59755](https://github.com/apache/doris/pull/59755))
- 支持Routine Load的灵活部分更新 ([#60128](https://github.com/apache/doris/pull/60128))
- 为Iceberg表实现expire_snapshots过程 ([#59979](https://github.com/apache/doris/pull/59979))
- 支持PREVIOUS_DAY函数 ([#60680](https://github.com/apache/doris/pull/60680))
- 支持3个空间函数：ST_Distance、ST_GeometryType、ST_Length ([#60170](https://github.com/apache/doris/pull/60170))
- 支持更多INTERVAL时间单位 ([#60347](https://github.com/apache/doris/pull/60347))
- 添加OzoneProperties以支持Apache Ozone ([#60809](https://github.com/apache/doris/pull/60809))
- 支持MaxCompute的ram_role_arn和ecs_ram_role认证 ([#60649](https://github.com/apache/doris/pull/60649))
- 支持Iceberg外表复杂类型的schema变更 ([#60169](https://github.com/apache/doris/pull/60169))
- 支持分数范围过滤下推（min_score语义） ([#60997](https://github.com/apache/doris/pull/60997))
- 支持在同一列上创建多个分词索引 ([#60415](https://github.com/apache/doris/pull/60415))
- 添加基于x509证书的认证框架 ([#60098](https://github.com/apache/doris/pull/60098))
- 为libhdfs3支持dfs.client.use.datanode.hostname配置 ([#59915](https://github.com/apache/doris/pull/59915))

### Improvements

- 改进密码验证以对齐MySQL STRONG策略 ([#60188](https://github.com/apache/doris/pull/60188))
- 优化parquet字典解码器性能 ([#59681](https://github.com/apache/doris/pull/59681))
- 支持动态修改速率限制器配置 ([#59465](https://github.com/apache/doris/pull/59465))
- 按split拆分元数据扫描范围 ([#60257](https://github.com/apache/doris/pull/60257))
- 优化Iceberg rewrite_data_files以避免生成过多小文件 ([#60063](https://github.com/apache/doris/pull/60063))
- 在variant子列上使用COUNT_ON_INDEX ([#60404](https://github.com/apache/doris/pull/60404))
- 优化多源catalog的文件拆分大小 ([#60637](https://github.com/apache/doris/pull/60637))
- 限制预热任务的下载速率 ([#60180](https://github.com/apache/doris/pull/60180))
- 优化与FROM_UNIXTIME联用的某些时间字段函数性能 ([#60843](https://github.com/apache/doris/pull/60843))
- 为PREVIOUS_DAY添加常量折叠优化 ([#60755](https://github.com/apache/doris/pull/60755))
- 支持流式任务同步PostgreSQL分区表 ([#60560](https://github.com/apache/doris/pull/60560))

### Bugfixes

- 修复并发compaction访问共享sample_infos导致的崩溃 ([#60376](https://github.com/apache/doris/pull/60376))
- 修复lazy commit中不必要的范围冲突 ([#60274](https://github.com/apache/doris/pull/60274))
- 修复创建任务失败后Routine Load任务调度卡住的问题 ([#60143](https://github.com/apache/doris/pull/60143))
- 修复表别名使用AS关键字时DELETE/UPDATE无法解析列的问题 ([#60335](https://github.com/apache/doris/pull/60335))
- 修复布尔查询中AllScorer组合处理问题 ([#60438](https://github.com/apache/doris/pull/60438))
- 修复使用排序和单阶段聚合时查询缓存不命中的问题 ([#60298](https://github.com/apache/doris/pull/60298))
- 修改ORC读取器使错误报告更准确 ([#60234](https://github.com/apache/doris/pull/60234))
- 修复裁剪嵌套列时可能抛出NullPointerException的问题 ([#60395](https://github.com/apache/doris/pull/60395))
- 修复查询内部表未指定catalog条件时partitions函数报错的问题（与show partitions命令不兼容） ([#60247](https://github.com/apache/doris/pull/60247))
- 修复backends UDF返回行与show backends命令不兼容的问题 ([#60210](https://github.com/apache/doris/pull/60210))
- 修复AggregateNode计算查询缓存摘要时应考虑sortByGroupKey的问题 ([#60431](https://github.com/apache/doris/pull/60431))
- 修复当谓词包含针对Variant的CAST时未能下推的问题 ([#60485](https://github.com/apache/doris/pull/60485))
- 修复S3列出对象时将“no such key”视为空响应（第二部分） ([#60286](https://github.com/apache/doris/pull/60286))
- 修复空字符串在keyword索引上MATCH返回错误结果的问题 ([#60500](https://github.com/apache/doris/pull/60500))
- 修复PhysicalDictionarySink.resetLogicalProperties()未正确重置逻辑属性的问题 ([#60495](https://github.com/apache/doris/pull/60495))
- 修复str_to_date中%f（微秒）格式说明符的处理 ([#60632](https://github.com/apache/doris/pull/60632))
- 修复date_floor/ceil返回NULL的问题，改为抛出异常 ([#60633](https://github.com/apache/doris/pull/60633))
- 修复在catalog级别配置了厂商凭证时，S3兼容存储必须支持临时凭证的问题 ([#60232](https://github.com/apache/doris/pull/60232))
- 修复InsertIntoDictionaryCommand的originSql为空的问题 ([#60631](https://github.com/apache/doris/pull/60631))
- 修复width_bucket未强制要求第四个参数为常量的情况 ([#60643](https://github.com/apache/doris/pull/60643))
- 验证search() DSL选项中的mode参数 ([#60785](https://github.com/apache/doris/pull/60785))
- 修复ANN范围搜索在NULL字面量上准备失败的问题 ([#60564](https://github.com/apache/doris/pull/60564))
- 使regexp_fn默认将点号匹配换行符 ([#60831](https://github.com/apache/doris/pull/60831))
- 修复Azure Storage Vault端点始终使用HTTP而非HTTPS的问题 ([#60854](https://github.com/apache/doris/pull/60854))
- 为Paimon添加REST外部catalog以解决gson兼容性问题 ([#60917](https://github.com/apache/doris/pull/60917))
- 为Variant内部类型转换禁用严格模式，修复INSERT INTO SELECT返回全NULL的问题 ([#60900](https://github.com/apache/doris/pull/60900))
- 修复当设置S3 role_arn但未指定provider_type时，默认使用Default链 ([#60822](https://github.com/apache/doris/pull/60822))
- 修复parquet reader惰性物化无法过滤的问题 ([#60474](https://github.com/apache/doris/pull/60474))
- 修复点查询忽略会话时区影响from_unixtime等函数的问题 ([#60913](https://github.com/apache/doris/pull/60913))
- 使search DSL中的AND/OR/NOT运算符区分大小写 ([#59747](https://github.com/apache/doris/pull/59747))
- 解耦最小pipeline执行器大小与ConnectContext ([#60958](https://github.com/apache/doris/pull/60958))
- 修复启用了force-global配置时Azure sovereign云的端点检测问题 ([#60903](https://github.com/apache/doris/pull/60903))
- search()函数的改进和bug修复 ([#61028](https://github.com/apache/doris/pull/61028))
- 修复加密密钥未区分大小写的问题 ([#60288](https://github.com/apache/doris/pull/60288))
- 使Hive压缩split断言在BE端可感知 ([#60947](https://github.com/apache/doris/pull/60947))
- 支持CLIENT_DEPRECATE_EOF标志，修复MySQL驱动9.5.0返回空结果的问题 ([#61050](https://github.com/apache/doris/pull/61050))
- 修复自定义分析器中basic和icu分词器无法定制的问题 ([#60506](https://github.com/apache/doris/pull/60506))