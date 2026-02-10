---
{
    "title": "Release 3.0.3",
    "language": "zh-CN",
    "description": "亲爱的社区小伙伴们，Apache Doris 3.0.3 版本已于 2024 年 12 月 02 日正式发布。 该版本进一步提升了系统的性能及稳定性，欢迎大家下载体验。"
}
---

亲爱的社区小伙伴们，**Apache Doris 3.0.3 版本已于 2024 年 12 月 02 日正式发布。** 该版本进一步提升了系统的性能及稳定性，欢迎大家下载体验。

- GitHub 下载：https://github.com/apache/doris/releases

- 官网下载：https://doris.apache.org/download

## 行为变更

- 禁止在具有同步物化视图的 MOW 表上进行列更新。[#40190](https://github.com/apache/doris/pull/40190) 
- 调整 RoutineLoad 的默认参数以提升导入效率。[#42968](https://github.com/apache/doris/pull/42968) 
- 当 StreamLoad 失败时，LoadedRows 的返回值调整为 0。[#41946](https://github.com/apache/doris/pull/41946) [#42291](https://github.com/apache/doris/pull/42291) 
- 将 Segment cache 的默认内存限制调整为 5%。[#42308](https://github.com/apache/doris/pull/42308) [#42436](https://github.com/apache/doris/pull/42436) 

## 新特性

- 引入 `enable_cooldown_replica_affinity` 会话变量，用以控制冷热分层副本的亲和性。[#42677](https://github.com/apache/doris/pull/42677) 

### Lakehouse

- 新增 `table$partition` 语法，用于查询 Hive 表的分区信息。[#40774](https://github.com/apache/doris/pull/40774)  
  
  - [查看文档](../../lakehouse/catalogs/hive-catalog)

- 支持创建 Text 格式的 Hive 表。[#41860](https://github.com/apache/doris/pull/41860) [#42175](https://github.com/apache/doris/pull/42175)  

  - [查看文档](../../lakehouse/catalogs/hive-catalog)

### 异步物化视图

- 引入新的物化视图属性 `use_for_rewrite`。当 `use_for_rewrite` 设置为 false 时，物化视图不参与透明改写。[#40332](https://github.com/apache/doris/pull/40332) 

### 查询优化器

- 支持关联非聚合子查询。[#42236](https://github.com/apache/doris/pull/42236) 

### 查询执行

- 增加了 `ngram_search`、`normal_cdf`、`to_iso8601`、`from_iso8601_date`、`SESSION_USER()`、`last_query_id` 函数。[#38226](https://github.com/apache/doris/pull/38226) [#40695](https://github.com/apache/doris/pull/40695) [#41075](https://github.com/apache/doris/pull/41075) [#41600](https://github.com/apache/doris/pull/41600) [#39575](https://github.com/apache/doris/pull/39575) [#40739](https://github.com/apache/doris/pull/40739) 
- `aes_encrypt` 和 `aes_decrypt` 函数支持 GCM 模式。[#40004](https://github.com/apache/doris/pull/40004) 
- Profile 中输出变更的会话变量值。[#41016](https://github.com/apache/doris/pull/41016) [#41318](https://github.com/apache/doris/pull/41318) 

### 半结构化数据管理

- 新增数组函数 `array_match_all` 和 `array_match_any`。[#40605](https://github.com/apache/doris/pull/40605) [#43514](https://github.com/apache/doris/pull/43514) 
- 数组函数 `array_agg` 支持在 ARRAY 中嵌套 ARRAY/MAP/STRUCT。[#42009](https://github.com/apache/doris/pull/42009) 
- 新增近似聚合统计函数 `approx_top_k` 和 `approx_top_sum`。[#44082](https://github.com/apache/doris/pull/44082) 

## 改进与优化

### 存储

- 支持将 `bitmap_empty` 作为默认值。[#40364](https://github.com/apache/doris/pull/40364) 
- 引入 `insert_timeout` 会话变量，用以控制 DELETE 语句的超时时间。[#41063](https://github.com/apache/doris/pull/41063) 
- 改进部分错误提示信息。[#41048](https://github.com/apache/doris/pull/41048) [#39631](https://github.com/apache/doris/pull/39631) 
- 改进副本修复的优先级调度。[#41076](https://github.com/apache/doris/pull/41076) 
- 提高了建表时对时区处理的鲁棒性。[#41926](https://github.com/apache/doris/pull/41926) [#42389](https://github.com/apache/doris/pull/42389) 
- 在创建表时检查分区表达式的合法性。[#40158](https://github.com/apache/doris/pull/40158) 
- 在 DELETE 操作时支持 Unicode 编码的列名。[#39381](https://github.com/apache/doris/pull/39381) 

### 存算分离

- 存算分离模式支持 ARM 架构部署。[#42467](https://github.com/apache/doris/pull/42467) [#43377](https://github.com/apache/doris/pull/43377) 
- 优化文件缓存的淘汰策略和锁竞争，提高命中率及高并发点查性能。[#42451](https://github.com/apache/doris/pull/42451) [#43201](https://github.com/apache/doris/pull/43201) [#41818](https://github.com/apache/doris/pull/41818) [#43401](https://github.com/apache/doris/pull/43401) 
- S3 storage vault 支持 `use_path_style`，解决对象存储使用自定义域名的问题。[#43060](https://github.com/apache/doris/pull/43060) [#43343](https://github.com/apache/doris/pull/43343) [#43330](https://github.com/apache/doris/pull/43330) 
- 优化存算分离配置及部署，预防不同模式下的误操作。[#43381](https://github.com/apache/doris/pull/43381) [#43522](https://github.com/apache/doris/pull/43522) [#43434](https://github.com/apache/doris/pull/43434) [#40764](https://github.com/apache/doris/pull/40764) [#43891](https://github.com/apache/doris/pull/43891) 
- 优化可观测性，并提供删除指定 segment file cache 的接口。[#38489](https://github.com/apache/doris/pull/38489) [#42896](https://github.com/apache/doris/pull/42896) [#41037](https://github.com/apache/doris/pull/41037) [#43412](https://github.com/apache/doris/pull/43412) 
- 优化 Meta-service 运维接口：RPC 限速及修复 tablet 元数据修正。[#42413](https://github.com/apache/doris/pull/42413) [#43884](https://github.com/apache/doris/pull/43884) [#41782](https://github.com/apache/doris/pull/41782) [#43460](https://github.com/apache/doris/pull/43460) 

### Lakehouse

- Paimon Catalog 支持阿里云 DLF 和 OSS-HDFS 存储。[#41247](https://github.com/apache/doris/pull/41247) [#42585](https://github.com/apache/doris/pull/42585) 
  
  - [查看文档](../../lakehouse/catalogs/paimon-catalog)

- 支持读取 OpenCSV 格式的 Hive 表。[#42257](https://github.com/apache/doris/pull/42257) [#42942](https://github.com/apache/doris/pull/42942)
- 优化了访问 External Catalog 中 `information_schema.columns` 表的性能。[#41659](https://github.com/apache/doris/pull/41659) [#41962](https://github.com/apache/doris/pull/41962)
- 使用新的 MaxCompute 开放存储 API 访问 MaxCompute 数据源。[#41614](https://github.com/apache/doris/pull/41614)
- 优化了 Paimon 表 JNI 部分的调度策略，使得扫描任务更加均衡。[#43310](https://github.com/apache/doris/pull/43310)
- 优化了 ORC 小文件的读取性能。[#42004](https://github.com/apache/doris/pull/42004) [#43467](https://github.com/apache/doris/pull/43467)
- 支持读取 brotli 压缩格式的 parquet 文件。[#42177](https://github.com/apache/doris/pull/42177)
- 在 `information_schema` 库下新增 `file_cache_statistics` 表，用于查看元数据缓存统计信息。[#42160](https://github.com/apache/doris/pull/42160)

### 查询优化器

- 优化：当查询仅注释不同时，可以复用同一个 SQL Cache。[#40049](https://github.com/apache/doris/pull/40049)
- 优化：提升了在数据频繁更新时统计信息的稳定性。[#43865](https://github.com/apache/doris/pull/43865) [#39788](https://github.com/apache/doris/pull/39788) [#43009](https://github.com/apache/doris/pull/43009) [#40457](https://github.com/apache/doris/pull/40457) [#42409](https://github.com/apache/doris/pull/42409) [#41894](https://github.com/apache/doris/pull/41894)
- 优化：提升常量折叠的稳定性。[#42910](https://github.com/apache/doris/pull/42910) [#41164](https://github.com/apache/doris/pull/41164) [#39723](https://github.com/apache/doris/pull/39723) [#41394](https://github.com/apache/doris/pull/41394) [#42256](https://github.com/apache/doris/pull/42256) [#40441](https://github.com/apache/doris/pull/40441)
- 优化：列裁剪可以生成更优的执行计划。[#41719](https://github.com/apache/doris/pull/41719) [#41548](https://github.com/apache/doris/pull/41548)

### 查询执行

- 优化了 sort 算子的内存使用。[#39306](https://github.com/apache/doris/pull/39306)
- 优化了 ARM 下运算的性能。[#38888](https://github.com/apache/doris/pull/38888) [#38759](https://github.com/apache/doris/pull/38759)
- 优化了一系列函数的计算性能。[#40366](https://github.com/apache/doris/pull/40366) [#40821](https://github.com/apache/doris/pull/40821) [#40670](https://github.com/apache/doris/pull/40670) [#41206](https://github.com/apache/doris/pull/41206) [#40162](https://github.com/apache/doris/pull/40162)
- 使用 SSE 指令优化 `match_ipv6_subnet` 函数的性能。[#38755](https://github.com/apache/doris/pull/38755)
- 在 insert overwrite 时支持自动创建新的分区。[#38628](https://github.com/apache/doris/pull/38628) [#42645](https://github.com/apache/doris/pull/42645)
- 在 Profile 中增加了每个 PipelineTask 的状态。[#42981](https://github.com/apache/doris/pull/42981)
- IP 类型支持 runtime filter。[#39985](https://github.com/apache/doris/pull/39985)

### 半结构化数据管理

- 审计日志中输出 prepared statement 的真实 SQL。[#43321](https://github.com/apache/doris/pull/43321)
- filebeat doris output plugin 支持容错、进度报告等。[#36355](https://github.com/apache/doris/pull/36355)
- 倒排索引查询性能优化。[#41547](https://github.com/apache/doris/pull/41547) [#41585](https://github.com/apache/doris/pull/41585) [#41567](https://github.com/apache/doris/pull/41567) [#41577](https://github.com/apache/doris/pull/41577) [#42060](https://github.com/apache/doris/pull/42060) [#42372](https://github.com/apache/doris/pull/42372)
- 数组函数 `array overlaps` 支持使用倒排索引加速。[#41571](https://github.com/apache/doris/pull/41571)
- IP 函数 `is_ip_address_in_range` 支持使用倒排索引加速。[#41571](https://github.com/apache/doris/pull/41571)
- 优化 VARIANT 数据类型的 CAST 性能。[#41775](https://github.com/apache/doris/pull/41775) [#42438](https://github.com/apache/doris/pull/42438) [#43320](https://github.com/apache/doris/pull/43320)
- 优化 Variant 数据类型的 CPU 资源消耗。[#42856](https://github.com/apache/doris/pull/42856) [#43062](https://github.com/apache/doris/pull/43062) [#43634](https://github.com/apache/doris/pull/43634)
- 优化 Variant 数据类型的元数据和执行内存资源消耗。[#42448](https://github.com/apache/doris/pull/42448) [#43326](https://github.com/apache/doris/pull/43326) [#41482](https://github.com/apache/doris/pull/41482) [#43093](https://github.com/apache/doris/pull/43093) [#43567](https://github.com/apache/doris/pull/43567) [#43620](https://github.com/apache/doris/pull/43620)

### 权限

- LDAP 新增配置项 `ldap_group_filter` 用于自定义过滤 group。[#43292](https://github.com/apache/doris/pull/43292)

### 其他

- FE 监控项中的连接数信息支持按用户分别显示。[#39200](https://github.com/apache/doris/pull/39200)

## 问题修复

### 存储

- 修复 IPv6 hostname 使用问题。[#40074](https://github.com/apache/doris/pull/40074)
- 修复 broker/s3 load 进度展示不准确问题。[#43535](https://github.com/apache/doris/pull/43535)
- 修复查询从 FE 可能卡住的问题。[#41303](https://github.com/apache/doris/pull/41303) [#42382](https://github.com/apache/doris/pull/42382)
- 修复异常情况下自增 id 重复的问题。[#43774](https://github.com/apache/doris/pull/43774) [#43983](https://github.com/apache/doris/pull/43983)
- 修复 groupcommit 偶发 NPE 问题。[#43635](https://github.com/apache/doris/pull/43635)
- 修复 auto bucket 计算不准确的问题。[#41675](https://github.com/apache/doris/pull/41675) [#41835](https://github.com/apache/doris/pull/41835)
- 修复 FE 重启时流控多表不能正确规划的问题。[#41677](https://github.com/apache/doris/pull/41677) [#42290](https://github.com/apache/doris/pull/42290)

### 存算分离

- 修复 MOW 主键表 delete bitmap 过大可能导致 coredump 的问题。[#43088](https://github.com/apache/doris/pull/43088) [#43457](https://github.com/apache/doris/pull/43457) [#43479](https://github.com/apache/doris/pull/43479) [#43407](https://github.com/apache/doris/pull/43407) [#43297](https://github.com/apache/doris/pull/43297) [#43613](https://github.com/apache/doris/pull/43613) [#43615](https://github.com/apache/doris/pull/43615) [#43854](https://github.com/apache/doris/pull/43854) [#43968](https://github.com/apache/doris/pull/43968) [#44074](https://github.com/apache/doris/pull/44074) [#41793](https://github.com/apache/doris/pull/41793) [#42142](https://github.com/apache/doris/pull/42142)
- 修复 segment 文件为 5MB 整数倍时上传对象失败的问题。[#43254](https://github.com/apache/doris/pull/43254)
- 修复 aws sdk 默认重试策略不生效的问题。[#43575](https://github.com/apache/doris/pull/43575) [#43648](https://github.com/apache/doris/pull/43648)
- 修复 alter storage vault 时指定错误 type 也能继续执行的问题。[#43489](https://github.com/apache/doris/pull/43489) [#43352](https://github.com/apache/doris/pull/43352) [#43495](https://github.com/apache/doris/pull/43495)
- 修复大事务延迟提交过程中 tablet_id 可能为 0 的问题。[#42043](https://github.com/apache/doris/pull/42043) [#42905](https://github.com/apache/doris/pull/42905)
- 修复常量折叠 RCP 以及 FE 转发 SQL 可能不在预期的计算组执行的问题。[#43110](https://github.com/apache/doris/pull/43110) [#41819](https://github.com/apache/doris/pull/41819) [#41846](https://github.com/apache/doris/pull/41846)
- 修复 meta-service 接收到 RPC 时不严格检查 instance_id 的问题。[#43253](https://github.com/apache/doris/pull/43253) [#43832](https://github.com/apache/doris/pull/43832)
- 修复 FE follower information_schema version 没有及时更新的问题。[#43496](https://github.com/apache/doris/pull/43496)
- 修复 file cache rename 原子性以及指标不准确的问题。[#42869](https://github.com/apache/doris/pull/42869) [#43504](https://github.com/apache/doris/pull/43504) [#43220](https://github.com/apache/doris/pull/43220)

### Lakehouse

- 禁止带有隐式转换的谓词条件下推给 JDBC 数据源，避免不一致的查询结果。[#42102](https://github.com/apache/doris/pull/42102)
- 修复 Hive 高版本事务表的一些读取问题。[#42226](https://github.com/apache/doris/pull/42226)
- 修复 Export 命令可能导致死锁的问题。[#43083](https://github.com/apache/doris/pull/43083) [#43402](https://github.com/apache/doris/pull/43402)
- 修复无法查询 Spark 创建的 Hive 视图的问题。[#43552](https://github.com/apache/doris/pull/43552)
- 修复 Hive 分区路径中包含特殊字符导致分区裁剪有误的问题。[#42906](https://github.com/apache/doris/pull/42906)
- 修复 Iceberg Catalog 无法使用 AWS Glue 的问题。[#41084](https://github.com/apache/doris/pull/41084)

### 异步物化视图

- 修复基表重建后，异步物化视图可能无法刷新的问题。[#41762](https://github.com/apache/doris/pull/41762)

### 查询优化器

- 修复使用多列 range 分区时，分区裁剪结果可能有误的问题。[#43332](https://github.com/apache/doris/pull/43332)
- 修复部分 limit offset 场景下计算结果错误的问题。[#42576](https://github.com/apache/doris/pull/42576)

### 查询执行

- 修复 hash join 时 array 类型的大小超过 4G 导致 BE Core 的问题。[#43861](https://github.com/apache/doris/pull/43861)
- 修复 is null 谓词运算部分场景下结果不正确的问题。[#43619](https://github.com/apache/doris/pull/43619)
- 修复 bitmap 类型在 hash join 时输出结果不正确的问题。[#43718](https://github.com/apache/doris/pull/43718)
- 修复一些函数结果计算错误的问题。[#40710](https://github.com/apache/doris/pull/40710) [#39358](https://github.com/apache/doris/pull/39358) [#40929](https://github.com/apache/doris/pull/40929) [#40869](https://github.com/apache/doris/pull/40869) [#40285](https://github.com/apache/doris/pull/40285) [#39891](https://github.com/apache/doris/pull/39891) [#40530](https://github.com/apache/doris/pull/40530) [#41948](https://github.com/apache/doris/pull/41948) [#43588](https://github.com/apache/doris/pull/43588)
- 修复一些 JSON 类型解析的问题。[#39937](https://github.com/apache/doris/pull/39937)
- 修复 varchar 和 char 类型在 runtime filter 运算时的问题。[#43758](https://github.com/apache/doris/pull/43758) [#43919](https://github.com/apache/doris/pull/43919)
- 修复一些 decimal256 在标量函数和聚合函数里使用的问题。[#42136](https://github.com/apache/doris/pull/42136) [#42356](https://github.com/apache/doris/pull/42356)
- 修复 arrow flight 在连接时报 `Reach limit of connections` 错误的问题。[#39127](https://github.com/apache/doris/pull/39127)
- 修复 k8s 环境下，BE 可用内存统计不正确的问题。[#41123](https://github.com/apache/doris/pull/41123)

### 半结构化数据管理

- 调整 `segment_cache_fd_percentage` 和 `inverted_index_fd_number_limit_percent` 的默认值。[#42224](https://github.com/apache/doris/pull/42224
- logstash 支持 group_commit。[#40450](https://github.com/apache/doris/pull/40450)
- 修复 build index 时 coredump 的问题。[#43246](https://github.com/apache/doris/pull/43246) [#43298](https://github.com/apache/doris/pull/43298)
- 修复 variant index 的问题。[#43375](https://github.com/apache/doris/pull/43375) [#43773](https://github.com/apache/doris/pull/43773)
- 修复后台 compaction 异常情况下可能出现的 fd 和内存泄漏。[#42374](https://github.com/apache/doris/pull/42374)
- 倒排索引 match null 正确返回 null 而不是 false。[#41786](https://github.com/apache/doris/pull/41786)
- 修复 ngram bloomfilter 索引 bf_size 设置为 65536 时 coredump 的问题。[#43645](https://github.com/apache/doris/pull/43645)
- 修复复杂数据类型 JOIN 可能出 coredump 的问题。[#40398](https://github.com/apache/doris/pull/40398)
- 修复 TVF JSON 数据 coredump 的问题。[#43187](https://github.com/apache/doris/pull/43187)
- 修复 bloom filter 计算日期和时间的精度问题。[#43612](https://github.com/apache/doris/pull/43612)
- 修复 IPv6 类型行存 coredump 的问题。[#43251](https://github.com/apache/doris/pull/43251)
- 修复关闭 light_schema_change 时使用 VARIANT 类型 coredump 的问题。[#40908](https://github.com/apache/doris/pull/40908)
- 提升高并发点查的 cache 性能。[#44077](https://github.com/apache/doris/pull/44077)
- 修复删除列时 bloom filter 索引没有同步更新的问题。[#43378](https://github.com/apache/doris/pull/43378)
- 修复 es catalog 在数组和标量混合数据等特殊情况下的不稳定问题。[#40314](https://github.com/apache/doris/pull/40314) [#40385](https://github.com/apache/doris/pull/40385) [#43399](https://github.com/apache/doris/pull/43399) [#40614](https://github.com/apache/doris/pull/40614)
- 修复异常正则匹配导致的 coredump 问题。[#43394](https://github.com/apache/doris/pull/43394)

### 权限

- 修复若干权限授权之后无法正常限制的问题。[#43193](https://github.com/apache/doris/pull/43193) [#41723](https://github.com/apache/doris/pull/41723) [#42107](https://github.com/apache/doris/pull/42107) [#43306](https://github.com/apache/doris/pull/43306)
- 加强若干权限校验。[#40688](https://github.com/apache/doris/pull/40688) [#40533](https://github.com/apache/doris/pull/40533) [#41791](https://github.com/apache/doris/pull/41791) [#42106](https://github.com/apache/doris/pull/42106)

### 其他

- 补充了审计日志表和文件中缺失的审计日志字段。[#43303](https://github.com/apache/doris/pull/43303)
  
  - [查看文档](../../admin-manual/system-tables/internal_schema/audit_log)
