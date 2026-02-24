---
{
    "title": "Release 4.0.1",
    "language": "zh-CN",
    "description": "Apache Doris 4.0.1版本发布，包含多项重要更新：新增mmh64_v2函数、json_hash函数、binary数据类型及MySQL兼容时间函数；优化SEARCH函数支持短语查询、通配符和正则查询；增强倒排索引和分词器功能；修复SHOW PARTITIONS命令、Lakehouse外表查询、JOIN算法优化等多处缺陷，提升系统稳定性和查询性能。"
}
---

## 行为变更

- `SHOW PARTITIONS` 命令不再支持 Iceberg 表，请直接使用 Iceberg 的 `$partitions` 系统表查看 [#56985](https://github.com/apache/doris/pull/56985)

## New Features

- 增加了mmh64_v2 函数，用于生成跟其他三方库相同的hash 结果。[#57180](https://github.com/apache/doris/pull/57180)
- 增加了json_hash 函数，用于对一个jsonb 类型生成hash值。[#56962](https://github.com/apache/doris/pull/56962)
- 增加了binary 数据类型，同时增加了一系列函数length, from_base64_binary, to_base64_bianry, sub_binary。[#56648](https://github.com/apache/doris/pull/56648)
- 增加了sort_json_object_keys/normalize_json_numbers_to_double 函数用于对jsonb的key 进行排序。
- 增加了一些跟mysql 兼容的时间函数UTC_DATE & UTC_TIME, and UTC_TIMESTAMP。[#57443](https://github.com/apache/doris/pull/57443)
- 新增对 MaxCompute Schema 层级的支持 [#56874](https://github.com/apache/doris/pull/56874)
  -  文档：https://doris.apache.org/docs/3.x/lakehouse/catalogs/maxcompute-catalog#hierarchical-mapping
- JSON_OBJECT 函数支持使用 * 作为参数 [#57256](https://github.com/apache/doris/pull/57256)

## Improvement

### AI & search

- 为 SEARCH 函数新增短语查询、通配符查询和正则查询支持。[#57372](https://github.com/apache/doris/pull/57372) [#57007](https://github.com/apache/doris/pull/57007)
- 扩展 SEARCH 函数新增2个参数，新增可选的 default_field 参数（默认列）和 default_operator 参数（指定多列查询的布尔运算符为 "and" 或 "or"）。[#57312](https://github.com/apache/doris/pull/57312)
- SEARCH函数新增对 variant 类型子列的搜索支持，可通过点号语法（如 variantColumn.subcolumn:关键词）直接搜索 JSON 路径中的特定字段。
- 将倒排索引的默认存储格式由 V2 升级为 V3 版本。[#57140](https://github.com/apache/doris/pull/57140)
- 完善自定义分词器 pipeline 支持，新增 char_filter 组件；在 analyzer 框架中新增 basic tokenizer 和 ICU tokenizer 两种内置分词器支持；新增内置分词器别名并支持组件同名配置，优化统一 analyzer 框架。[#56243](https://github.com/apache/doris/pull/56243) [#57055](https://github.com/apache/doris/pull/57055)

### Lakehouse

- 新增会话变量 `merge_io_read_slice_size_bytes` 来解决某些情况下，外表 Merge IO 读放大严重的问题。
  -  文档：https://doris.apache.org/docs/3.x/lakehouse/best-practices/optimization#merge-io-optimization

### 查询

- 优化了 JOIN shuffle 选择算法 [#56279](https://github.com/apache/doris/pull/56279)

### 其他

- 优化了物理计划中 Runtime Filter 序列化信息的大小 [#57108](https://github.com/apache/doris/pull/57108) [#56978](https://github.com/apache/doris/pull/56978)

## 缺陷修复

### AI & search

- 修复非分词字段的 search 查询结果问题，支持在MOW表上执行 search 函数查询。[#56914](https://github.com/apache/doris/pull/56914) [#56927](https://github.com/apache/doris/pull/56927)
- 修复倒排索引在执行 IS NULL 谓词过滤时的计算错误问题。[#56964](https://github.com/apache/doris/pull/56964)

### Lakehouse

- 修复某些情况下，谓词下推无法使用 Parquet Page Index 的问题 [#55795](https://github.com/apache/doris/pull/55795)
- 修复某些情况下外表查询分片读取丢失的问题 [#57071](https://github.com/apache/doris/pull/57071)
- 修复某些情况下，Hadoop 文件系统缓存开启导致修改 Catalog 属性不生效的问题 [#57063](https://github.com/apache/doris/pull/57063) 
- 修复某些情况下，从旧版本升级时，连接属性校验导致元数据回放失败的问题 [#56929](https://github.com/apache/doris/pull/56929)
- 修复某些情况下，Refresh Catalog 导致 FE 线程死锁的问题[#56639](https://github.com/apache/doris/pull/56639)
- 修复无法读取由 Hive 转换生成的 Iceberg 表的问题 [#56918](https://github.com/apache/doris/pull/56918)
- 修复某些情况下收集 Query Profile 导致 BE 宕机的问题 [#56806](https://github.com/apache/doris/pull/56806)

### 查询

- 修复datetime 类型在timezone 相关cast 时在边界条件下结果不对的问题。[#57422](https://github.com/apache/doris/pull/57422)
- 修复了部分 datetime 相关函数结果精度推导不正确的问题 [#56671](https://github.com/apache/doris/pull/56671)
- 修复了inf 作为float的谓词条件时core的问题。[#57100](https://github.com/apache/doris/pull/57100)
- 修复了explode 函数在可变参数下core的问题。[#56991](https://github.com/apache/doris/pull/56991)
- 修复了decimal256 到float 类型的cast 不稳定的问题。[#56848](https://github.com/apache/doris/pull/56848)
- 修复了spill disk 时可能出现重复调度导致core的问题。[#56755](https://github.com/apache/doris/pull/56755)
- 修复了偶发的错误调整 mark join 和其他 join 顺序的问题 [#56837](https://github.com/apache/doris/pull/56837)
- 修复了部分命令没有被正确的转发到 master frontend 执行的问题 [#55185](https://github.com/apache/doris/pull/55185)
- 修复了偶现的窗口函数错误的生成 partition topn 的问题 [#56622](https://github.com/apache/doris/pull/56622)
- 修复当同步 mv 定义中存在关键字时，查询可能报错的问题 [#57052](https://github.com/apache/doris/pull/57052)

### 其他

- 禁止基于同步 mv 创建另外一个同步 mv [#56912](https://github.com/apache/doris/pull/56912)
- 修复 profile 中存在的内存未及时释放问题 [#57257](https://github.com/apache/doris/pull/57257)