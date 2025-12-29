---
{
    "title": "Release 3.0.6",
    "language": "zh-CN",
    "description": "亲爱的社区小伙伴们，Apache Doris 3.0.6 版本已于 2025 年 06 月 16 日正式发布。 该版本进一步提升了系统的性能及稳定性，欢迎大家下载体验。"
}
---

亲爱的社区小伙伴们，**Apache Doris 3.0.6 版本已于 2025 年 06 月 16 日正式发布。** 该版本进一步提升了系统的性能及稳定性，欢迎大家下载体验。

- [GitHub 下载](https://github.com/apache/doris/releases)

- [官网下载](https://doris.apache.org/download)

## 行为变更

- **禁止 Unique 表使用时序 Compaction** [#49905](https://github.com/apache/doris/pull/49905)
- **存算分离场景下 Auto Bucket 单分桶容量调整为 10GB** [#50566](https://github.com/apache/doris/pull/50566)

## 新特性

### Lakehouse

- **支持访问 AWS S3 Table Buckets 中的 Iceberg 表格式** 
	- 详情请参考[文档：Iceberg on S3 Tables](https://doris.apache.org/docs/dev/lakehouse/catalogs/iceberg-catalog#iceberg-on-s3-tables)

### 存储

- **对象存储访问支持 IAM Role 授权** 适用于导入/导出、备份恢复及存算分离场景 [#50252](https://github.com/apache/doris/pull/50252) [#50682](https://github.com/apache/doris/pull/50682) [#49541](https://github.com/apache/doris/pull/49541) [#49565](https://github.com/apache/doris/pull/49565) [#49422](https://github.com/apache/doris/pull/49422) 
	- 详情请参考[文档](https://doris.apache.org/zh-CN/docs/3.0/admin-manual/auth/integrations/aws-authentication-and-authorization)

### 新增函数

- `json_extract_no_quotes`
	- 详情请参考[文档](https://doris.apache.org/docs/3.0/sql-manual/sql-functions/scalar-functions/json-functions/json-extract)
- `unhex_null`
	- 详情请参考[文档](https://doris.apache.org/docs/3.0/sql-manual/sql-functions/scalar-functions/string-functions/unhex)
- `xpath_string`
	- 详情请参考[文档](https://doris.apache.org/docs/3.0/sql-manual/sql-functions/scalar-functions/string-functions/xpath-string)
- `str_to_map`
	- 详情请参考[文档](https://doris.apache.org/docs/3.0/sql-manual/sql-functions/scalar-functions/map-functions/str-to-map)
- `months_between`
	- 详情请参考[文档](https://doris.apache.org/docs/3.0/sql-manual/sql-functions/scalar-functions/date-time-functions/months-between)
- `next_day`
	- 详情请参考[文档](https://doris.apache.org/docs/3.0/sql-manual/sql-functions/scalar-functions/date-time-functions/next-day)
- `format_round`
	- 详情请参考[文档](https://doris.apache.org/docs/3.0/sql-manual/sql-functions/scalar-functions/numeric-functions/format-round)

## 改进

### 导入

- **引入黑名单机制**：避免 Routine Load 将元信息分发至不可用 BE 节点 [#50587](https://github.com/apache/doris/pull/50587)
- **提高负载优先级阈值**：`load_task_high_priority_threshold_second` 默认值增大 [#50478](https://github.com/apache/doris/pull/50478)

### 主键模型

- **减少冗余日志输出** [#51093](https://github.com/apache/doris/pull/51093)

### 存储优化

- 精简 Compaction Profile 及日志 [#50950](https://github.com/apache/doris/pull/50950)
- 优化调度策略提升 Compaction 吞吐量 [#49882](https://github.com/apache/doris/pull/49882) [#48759](https://github.com/apache/doris/pull/48759) [#51482](https://github.com/apache/doris/pull/51482) [#50672](https://github.com/apache/doris/pull/50672) [#49953](https://github.com/apache/doris/pull/49953) [#50819](https://github.com/apache/doris/pull/50819)

### 存算分离

- **启动优化**：加速 File Cache 初始化 [#50726](https://github.com/apache/doris/pull/50726)
- **查询加速**：优化 File Cache 查询性能 [#50275](https://github.com/apache/doris/pull/50275) [#50387](https://github.com/apache/doris/pull/50387) [#50555](https://github.com/apache/doris/pull/50555)
- **元数据获取优化**：解决 `get_version` 导致的性能瓶颈 [#51111](https://github.com/apache/doris/pull/51111) [#50439](https://github.com/apache/doris/pull/50439)
- **对象回收加速**：提升存算分离模式垃圾回收效率 [#50037](https://github.com/apache/doris/pull/50037) [#50766](https://github.com/apache/doris/pull/50766)
- **稳定性提升**：优化对象存储重试策略 [#50957](https://github.com/apache/doris/pull/50957)
- **Profile 细化**：增强 Tablet/Segment Footer 维度统计 [#49945](https://github.com/apache/doris/pull/49945) [#50564](https://github.com/apache/doris/pull/50564) [#50326](https://github.com/apache/doris/pull/50326)
- **Schema Change 容错**：默认启用 New Tablet Compaction 规避 -230 错误 [#51070](https://github.com/apache/doris/pull/51070)

### Lakehouse

#### Catalog 增强
- Hive Catalog 支持分区缓存 TTL 控制（`partition.cache.ttl-second`）[#50724](https://github.com/apache/doris/pull/50724) 
  - 详情参考文档：[元数据缓存](https://doris.apache.org/docs/dev/lakehouse/meta-cache)
- 支持 Hive 表 `skip.header.line.count` 属性 [#49929](https://github.com/apache/doris/pull/49929)
- 兼容 `org.openx.data.jsonserde.JsonSerDe` 格式的 Hive 表 [#49958](https://github.com/apache/doris/pull/49958) 
  - 详情参考文档：[文本格式](https://doris.apache.org/docs/dev/lakehouse/file-formats/text)
- Paimon 版本升级至 1.0.1
- Iceberg 版本升级至 1.6.1

#### 功能扩展
- 支持阿里云 OSS-HDFS Root Policy 功能 [#50678](https://github.com/apache/doris/pull/50678)
- 方言兼容：返回 Hive 格式查询结果 [#49931](https://github.com/apache/doris/pull/49931) 
	- 详情参考文档：[SQL 转换器](https://doris.apache.org/docs/dev/lakehouse/sql-convertor/sql-convertor-overview)

### 异步物化视图

- **内存优化**：降低透明改写内存占用 [#48887](https://github.com/apache/doris/pull/48887)

### 查询优化器

- **分桶剪枝性能提升** [#49388](https://github.com/apache/doris/pull/49388)
- **Lambda 表达式增强**：支持引用闭包外部 Slot [#44365](https://github.com/apache/doris/pull/44365)

### 查询执行

- **TopN 查询加速**：优化存算分离场景性能 [#50803](https://github.com/apache/doris/pull/50803)
- **函数扩展**：`substring_index` 支持变量参数 [#50149](https://github.com/apache/doris/pull/50149)
- **地理信息函数**：新增 `ST_CONTAINS`/`ST_INTERSECTS`/`ST_TOUCHES`/`ST_DISJOINT` [#49665](https://github.com/apache/doris/pull/49665)

### 核心组件

- **内存追踪优化**：高并发场景性能提升约 10% [#50462](https://github.com/apache/doris/pull/50462)
- **审计日志增强**：通过 `audit_plugin_max_insert_stmt_length` 限制 INSERT 语句长度 [#51314](https://github.com/apache/doris/pull/51314) 
	- 详情请参考文档：[审计插件](https://doris.apache.org/docs/3.0/admin-manual/audit-plugin)
- **SQL 转换器控制**：新增会话变量 `sql_convertor_config` 和 `enable_sql_convertor_features` 
	- 详情请参考文档：[SQL 转换器](https://doris.apache.org/docs/dev/lakehouse/sql-convertor/sql-convertor-overview)

## 缺陷修复

### 导入

- 修复 BE 事务清理失败问题 [#50103](https://github.com/apache/doris/pull/50103)
- 优化 Routine Load 任务报错准确性 [#51078](https://github.com/apache/doris/pull/51078)
- 禁止向 `disable_load=true` 节点分发元信息任务 [#50421](https://github.com/apache/doris/pull/50421)
- 修复 FE 重启后消费进度回退 [#50221](https://github.com/apache/doris/pull/50221)
- 修复 Group Commit 与 Schema Change 冲突导致的 Core Dump [#51144](https://github.com/apache/doris/pull/51144)
- 解决 S3 Load 使用 HTTPS 协议报错 [#51246](https://github.com/apache/doris/pull/51246) [#51529](https://github.com/apache/doris/pull/51529)

### 主键模型

- 修复竞争导致的主键重复问题 [#50019](https://github.com/apache/doris/pull/50019) [#50051](https://github.com/apache/doris/pull/50051) [#50106](https://github.com/apache/doris/pull/50106) [#50417](https://github.com/apache/doris/pull/50417) [#50847](https://github.com/apache/doris/pull/50847) [#50974](https://github.com/apache/doris/pull/50974)

### 存储

- 解决 CCR 与磁盘均衡竞争 [#50663](https://github.com/apache/doris/pull/50663)
- 修复默认分区 Key 未持久化问题 [#50489](https://github.com/apache/doris/pull/50489)
- CCR 支持 Rollup 表 [#50337](https://github.com/apache/doris/pull/50337)
- 修复 `cooldown_ttl=0` 边界问题 [#50830](https://github.com/apache/doris/pull/50830)
- 解决数据 GC 与 Publish 竞争导致数据丢失 [#50343](https://github.com/apache/doris/pull/50343)
- 修复 Delete Job 分区剪枝失效 [#50674](https://github.com/apache/doris/pull/50674)

### 存算分离

- 修复 Schema Change 阻塞 Compaction [#50908](https://github.com/apache/doris/pull/50908)
- 解决 `storage_vault_prefix` 为空时对象回收失败 [#50352](https://github.com/apache/doris/pull/50352)
- 修复 Tablet Cache 导致的查询性能问题 [#51193](https://github.com/apache/doris/pull/51193) [#49420](https://github.com/apache/doris/pull/49420)
- 消除残留 Tablet Cache 引起的性能抖动 [#50200](https://github.com/apache/doris/pull/50200)

### Lakehouse

#### Export 修复
- 解决 FE 内存泄漏 [#51171](https://github.com/apache/doris/pull/51171)
- 避免 FE 死锁 [#50088](https://github.com/apache/doris/pull/50088)

#### Catalog 修复
- JDBC Catalog 支持组合条件下推 [#50542](https://github.com/apache/doris/pull/50542)
- 修复阿里云 OSS Paimon 表 Deletion Vector 读取 [#49645](https://github.com/apache/doris/pull/49645)
- 支持含逗号的 Hive 表分区值 [#49382](https://github.com/apache/doris/pull/49382)
- 修正 MaxCompute Timestamp 列类型解析 [#49600](https://github.com/apache/doris/pull/49600)
- Trino Catalog 支持显示 `information_schema` 系统表 [#49912](https://github.com/apache/doris/pull/49912)

#### 文件格式
- 修复 LZO 压缩格式读取失败 [#49538](https://github.com/apache/doris/pull/49538)
- 兼容旧版 ORC 文件 [#50358](https://github.com/apache/doris/pull/50358)
- 修正 ORC 复杂类型解析错误 [#50136](https://github.com/apache/doris/pull/50136)

### 异步物化视图

- 修复同时指定 `start time` 与立即触发模式时的少刷新问题 [#50624](https://github.com/apache/doris/pull/50624)

### 查询优化器

- 修复 Lambda 表达式改写错误 [#49166](https://github.com/apache/doris/pull/49166)
- 解决 Group By 常量键规划失败 [#49473](https://github.com/apache/doris/pull/49473)
- 修正常量折叠逻辑 [#50142](https://github.com/apache/doris/pull/50142) [#50810](https://github.com/apache/doris/pull/50810)
- 补全系统表信息 [#50721](https://github.com/apache/doris/pull/50721)
- 修复 NULL Literal 创建 View 的列类型错误 [#49881](https://github.com/apache/doris/pull/49881)

### 查询执行

- 解决 JSON 导入非法值导致 BE Core [#50978](https://github.com/apache/doris/pull/50978)
- 修复 Intersect 输入 NULL 常量结果错误 [#50951](https://github.com/apache/doris/pull/50951)
- 修正 Variant 类型谓词错误执行 [#50934](https://github.com/apache/doris/pull/50934)
- 修复 `get_json_string` JSON Path 非法时的结果错误 [#50859](https://github.com/apache/doris/pull/50859)
- 对齐 MySQL 函数行为（JSON_REPLACE/INSERT/SET/ARRAY）[#50308](https://github.com/apache/doris/pull/50308)
- 解决 `array_map` 空参数 Core [#50201](https://github.com/apache/doris/pull/50201)
- 修复 Variant 转 JSONB 异常 Core [#50180](https://github.com/apache/doris/pull/50180)
- 修复 `explode_json_array_json_outer` 函数缺失 [#50164](https://github.com/apache/doris/pull/50164)
- 对齐 `percentile` 与 `percentile_array` 结果 [#49351](https://github.com/apache/doris/pull/49351)
- 优化 UTF8 编码函数行为（url_encode/strright/append_trail_char_if_absent）[#49127](https://github.com/apache/doris/pull/49127)

### 其他

- 修复高并发下审计日志丢失 [#50357](https://github.com/apache/doris/pull/50357)
- 解决动态分区建表导致元数据回放失败 [#49569](https://github.com/apache/doris/pull/49569)
- 避免 Global UDF 重启丢失 [#50279](https://github.com/apache/doris/pull/50279)
- 对齐 MySQL View 元数据返回格式 [#51058](https://github.com/apache/doris/pull/51058)