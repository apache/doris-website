---
{
    "title": "Release 4.0.1",
    "language": "zh-CN",
    "description": "Apache Doris 4.0.1版本发布，包含多项重要更新：新增mmh64_v2函数、json_hash函数、binary数据类型及MySQL兼容时间函数；优化SEARCH函数支持短语查询、通配符和正则查询；增强倒排索引和分词器功能；修复SHOW PARTITIONS命令、Lakehouse外表查询、JOIN算法优化等多处缺陷，提升系统稳定性和查询性能。"
}
---

# 行为变更

- `SHOW PARTITIONS` 命令不再支持 Iceberg 表，请直接使用 Iceberg 的 `$partitions` 系统表查看分区。[#56985](https://github.com/apache/doris/pull/56985)

# 新功能

- 新增 `mmh64_v2` 函数，用于生成与其他三方库一致的 hash 结果。[#57180](https://github.com/apache/doris/pull/57180)
- 新增 `json_hash` 函数，用于对 jsonb 类型生成 hash 值。[#56962](https://github.com/apache/doris/pull/56962)
- 新增 binary 数据类型，以及一系列相关函数：`length`、`from_base64_binary`、`to_base64_binary`、`sub_binary`。[#56648](https://github.com/apache/doris/pull/56648)
- 新增 `sort_json_object_keys` / `normalize_json_numbers_to_double` 函数，用于对 jsonb 的 key 进行排序。
- 新增多个 MySQL 兼容的时间函数：`UTC_DATE`、`UTC_TIME`、`UTC_TIMESTAMP`。[#57443](https://github.com/apache/doris/pull/57443)
- 新增对 MaxCompute Schema 层级的支持。[#56874](https://github.com/apache/doris/pull/56874) 文档：https://doris.apache.org/docs/3.x/lakehouse/catalogs/maxcompute-catalog#hierarchical-mapping
- `JSON_OBJECT` 函数支持使用 `*` 作为参数。[#57256](https://github.com/apache/doris/pull/57256)

# 改进

## AI 与搜索

- 为 SEARCH 函数新增短语查询、通配符查询和正则查询支持。[#57372](https://github.com/apache/doris/pull/57372) [#57007](https://github.com/apache/doris/pull/57007)
- 扩展 SEARCH 函数新增 2 个参数：可选的 `default_field` 参数（默认列）和 `default_operator` 参数（指定多列查询的布尔运算符为 "and" 或 "or"）。[#57312](https://github.com/apache/doris/pull/57312)
- SEARCH 函数新增对 variant 类型子列的搜索支持，可通过点号语法（如 `variantColumn.subcolumn:关键词`）直接搜索 JSON 路径中的特定字段。
- 将倒排索引的默认存储格式由 V2 升级为 V3。[#57140](https://github.com/apache/doris/pull/57140)
- 完善自定义分词器 pipeline 支持，新增 `char_filter` 组件；在 analyzer 框架中新增 basic tokenizer 和 ICU tokenizer 两种内置分词器；新增内置分词器别名并支持同名组件配置，优化统一 analyzer 框架。[#56243](https://github.com/apache/doris/pull/56243) [#57055](https://github.com/apache/doris/pull/57055)

## 湖仓一体

- 新增会话变量 `merge_io_read_slice_size_bytes`，用于解决某些情况下外表 Merge IO 读放大严重的问题。文档：https://doris.apache.org/docs/3.x/lakehouse/best-practices/optimization#merge-io-optimization

## 查询

- 优化了 JOIN shuffle 选择算法。[#56279](https://github.com/apache/doris/pull/56279)

## 其他

- 优化了物理计划中 Runtime Filter 序列化信息的大小。[#57108](https://github.com/apache/doris/pull/57108) [#56978](https://github.com/apache/doris/pull/56978)

# 缺陷修复

## AI 与搜索

- 修复非分词字段的 search 查询结果问题，并支持在 MOW 表上执行 search 函数查询。[#56914](https://github.com/apache/doris/pull/56914) [#56927](https://github.com/apache/doris/pull/56927)
- 修复倒排索引在执行 `IS NULL` 谓词过滤时的计算错误。[#56964](https://github.com/apache/doris/pull/56964)

## 湖仓一体

- 修复某些情况下谓词下推无法使用 Parquet Page Index 的问题。[#55795](https://github.com/apache/doris/pull/55795)
- 修复某些情况下外表查询分片读取丢失的问题。[#57071](https://github.com/apache/doris/pull/57071)
- 修复某些情况下 Hadoop 文件系统缓存开启时修改 Catalog 属性不生效的问题。[#57063](https://github.com/apache/doris/pull/57063)
- 修复某些情况下从旧版本升级时连接属性校验导致元数据回放失败的问题。[#56929](https://github.com/apache/doris/pull/56929)
- 修复某些情况下 Refresh Catalog 导致 FE 线程死锁的问题。[#56639](https://github.com/apache/doris/pull/56639)
- 修复无法读取由 Hive 转换生成的 Iceberg 表的问题。[#56918](https://github.com/apache/doris/pull/56918)
- 修复某些情况下收集 Query Profile 导致 BE 宕机的问题。[#56806](https://github.com/apache/doris/pull/56806)

## 查询

- 修复 datetime 类型在 timezone 相关 cast 时边界条件下结果不正确的问题。[#57422](https://github.com/apache/doris/pull/57422)
- 修复部分 datetime 相关函数结果精度推导不正确的问题。[#56671](https://github.com/apache/doris/pull/56671)
- 修复 inf 作为 float 类型谓词条件时 core 的问题。[#57100](https://github.com/apache/doris/pull/57100)
- 修复 `explode` 函数在可变参数下 core 的问题。[#56991](https://github.com/apache/doris/pull/56991)
- 修复 decimal256 到 float 类型的 cast 不稳定的问题。[#56848](https://github.com/apache/doris/pull/56848)
- 修复 spill disk 时可能出现重复调度导致 core 的问题。[#56755](https://github.com/apache/doris/pull/56755)
- 修复偶发的错误调整 mark join 与其他 join 顺序的问题。[#56837](https://github.com/apache/doris/pull/56837)
- 修复部分命令没有被正确转发到 master frontend 执行的问题。[#55185](https://github.com/apache/doris/pull/55185)
- 修复偶现的窗口函数错误生成 partition topn 的问题。[#56622](https://github.com/apache/doris/pull/56622)
- 修复同步 mv 定义中存在关键字时查询可能报错的问题。[#57052](https://github.com/apache/doris/pull/57052)

## 其他

- 禁止基于同步 mv 创建另外一个同步 mv。[#56912](https://github.com/apache/doris/pull/56912)
- 修复 profile 中存在的内存未及时释放问题。[#57257](https://github.com/apache/doris/pull/57257)