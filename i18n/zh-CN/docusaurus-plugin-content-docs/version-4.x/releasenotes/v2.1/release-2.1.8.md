---
{
    "title": "Release 2.1.8",
    "language": "zh-CN",
    "description": "亲爱的社区小伙伴们，Apache Doris 2.1.8 版本已于 2025 年 01 月 24 日正式发布。 该版本持续在湖仓一体、异步物化视图、查询优化器与执行引擎、存储管理等方面进行改进提升与问题修复，进一步加强系统的性能和稳定性，欢迎大家下载体验。"
}
---

亲爱的社区小伙伴们，**Apache Doris 2.1.8 版本已于 2025 年 01 月 24 日正式发布。** 该版本持续在湖仓一体、异步物化视图、查询优化器与执行引擎、存储管理等方面进行改进提升与问题修复，进一步加强系统的性能和稳定性，欢迎大家下载体验。

- [立即下载](https://doris.apache.org/download)

- [GitHub 下载](https://github.com/apache/doris/releases/tag/2.1.8-rc01)


## 行为变更

- 添加环境变量 `SKIP_CHECK_ULIMIT` 以跳过 BE 进程内关于 ulimit 值校验检查，仅适用于 Docker 快速启动场景中应用。[#45267](https://github.com/apache/doris/pull/45267)
- 添加 `enable_cooldown_replica_affinity session` 变量控制冷热分层下查询选用副本亲和性
- FE 添加配置` restore_job_compressed_serialization` 和 `backup_job_compressed_serialization` 用于解决 db tablet 数量非常大情况下备份和恢复操作时 FE OOM 的问题，默认关闭，打开之后无法降级

## 新功能

- **查询执行引擎：**Arrowflight 协议支持通过负载均衡设备访问 BE。 [#43281](https://github.com/apache/doris/pull/43281)
- **其他：**当前 Lambda 表达式支持捕获外部的列。 [#45186](https://github.com/apache/doris/pull/45186)

## 改进提升

### 湖仓一体

- Hudi 版本更新至 0.15，并且优化了 Hudi 表的查询规划性能。
- 优化了 MaxCompute 分区表的读取性能。 [#45148](https://github.com/apache/doris/pull/45148)
- 支持会话变量 enable_text_validate_utf8，可以忽略 CSV 格式中的 UTF8 编码检测。[#45537](https://github.com/apache/doris/pull/45537)
- 优化在高过滤率情况下，Parquet 文件延迟物化的性能。[#46183](https://github.com/apache/doris/pull/46183)

### 异步物化视图

- 现在支持手动刷新异步物化视图中不存在的分区。[#45290](https://github.com/apache/doris/pull/45290)
- 优化了透明改写规划的性能。[#44786](https://github.com/apache/doris/pull/44786)

### 查询优化器

- 提升了 Runtime Filter 的自适应能力。[#42640](https://github.com/apache/doris/pull/42640)
- 增加了在 MAX / MIN 聚合函数列上的过滤条件生成原始列过滤条件的能力。[#39252](https://github.com/apache/doris/pull/39252)
- 增加了在连接谓词上抽取单测过滤条件的能力。[#38479](https://github.com/apache/doris/pull/38479)
- 优化了谓词推导在集合算子上的能力，可以更好的生成过滤谓词。[#39450](https://github.com/apache/doris/pull/39450)
- 优化了统计信息收集和使用的异常处理能力，避免在收集异常时产生非预期的执行计划。[#43009](https://github.com/apache/doris/pull/43009) [#43776](https://github.com/apache/doris/pull/43776) [#43865](https://github.com/apache/doris/pull/43865) [#42104](https://github.com/apache/doris/pull/42104) [#42399](https://github.com/apache/doris/pull/42399) [#41729](https://github.com/apache/doris/pull/41729)

### 查询执行引擎

- Resource group 支持在当前 group 不可用的时候，降级到别的 Group. [#44255](https://github.com/apache/doris/pull/44255)
- 优化带 limit 的查询执行使其能够更快的结束，避免多余的数据扫描。[#45222](https://github.com/apache/doris/pull/45222)

### 存储管理

- CCR 支持了更加全面的操作，比如 Rename Table，Rename Column，Modify Comment，Drop View，Drop Rollup 等。
- 提升了 Broker Load 导入进度的准确性和多个压缩文件导入时的性能。
- 改进了 Routine Load 超时策略、线程池使用以防止 Routine Load 超时失败和影响查询。

### 其他

- Docker 快速启动镜像支持不设置环境参数直接启动，添加环境变量 `SKIP_CHECK_ULIMIT` 以跳过 `start_be.sh` 脚本以及 BE 进程内关于 `swap`、`max_map_count`、`ulimit` 相关校验检查，仅适用于 Docker 快速启动场景中应用。[#45269](https://github.com/apache/doris/pull/45269)
- 新增 LDAP 配置型 `ldap_group_filter` 用于自定义 Group 过滤。[#43292](https://github.com/apache/doris/pull/43292)
- 优化了使用 Ranger 时的性能。[#41207](https://github.com/apache/doris/pull/41207)
- 修复审计日志中，`scan bytes` 统计不准的问题。[#45167](https://github.com/apache/doris/pull/45167)
- 在 COLUMNS 系统表中能够正确显示列的默认值。[#44849](https://github.com/apache/doris/pull/44849)
- 在 VIEWS 系统表中能够正确显示视图的定义。[#45857](https://github.com/apache/doris/pull/45857)
- 当前，admin 用户不能被删除。[#44751](https://github.com/apache/doris/pull/44751)

## Bug 修复

### 湖仓一体

- Hive

  - 修复无法查询 Spark 创建的 Hive 视图的问题。[#43553](https://github.com/apache/doris/pull/43553)
  
  - 修复无法正确读取某些 Hive Transaction 表的问题。[#45753](https://github.com/apache/doris/pull/45753)
  
  - 修复 Hive 表分区存在特殊字符时，无法进行正确分区裁剪的问题。[#42906](https://github.com/apache/doris/pull/42906)

- Iceberg

  - 修复在 Kerberos 认证环境下，无法创建 Iceberg 表的问题。[#43445](https://github.com/apache/doris/pull/43445)

  - 修复某些情况下，Iceberg 表存在 dangling delete 情况下，`count(*)` 查询不准确的问题。[#44039](https://github.com/apache/doris/pull/44039)

  - 修复某些情况下，Iceberg 表列名不匹配导致查询错误的问题[#44470](https://github.com/apache/doris/pull/44470)

  - 修复某些情况下，当 Iceberg 表分区被修改后，无法读取的问题[#45367](https://github.com/apache/doris/pull/45367)

- Paimon

  - 修复 Paimon Catalog 无法访问阿里云 OSS-HDFS 的问题。[#42585](https://github.com/apache/doris/pull/42585)

- Hudi

  - 修复某些情况下，Hudi 表分区裁剪失效的问题。[#44669](https://github.com/apache/doris/pull/44669)

- JDBC

  - 修复某些情况下，开始表名大小写不敏感功能后，使用 JDBC Catalog 无法获取表的问题。

- MaxCompute

  - 修复某些情况下，MaxCompute 表分区裁剪失效的问题。[#44508](https://github.com/apache/doris/pull/44508)

- 其他

  - 修复某些情况下，Export 任务导致 FE 内存泄露的问题。[#44019](https://github.com/apache/doris/pull/44019)

  - 修复某些情况下，无法使用 HTTPS 协议访问 S3 对象存储的问题。[#44242](https://github.com/apache/doris/pull/44242)

  - 修复某些情况下，Kerberos 认证票据无法自动刷新的问题。[#44916](https://github.com/apache/doris/pull/44916)

  - 修复某些情况下，读取 Hadoop Block 压缩格式文件出错的问题。[#45289](https://github.com/apache/doris/pull/45289)

  - 查询 ORC 格式的数据时，不再下推 CHAR 类型的谓词，以避免可能的结果错误。[#45484](https://github.com/apache/doris/pull/45484)

### 异步物化视图

- 修复了当物化视图定义中存在 CTE 时，无法刷新的问题。[#44857](https://github.com/apache/doris/pull/44857)
- 修复了当基表增加列后，异步物化视图不能命中透明改写的问题。[#44867](https://github.com/apache/doris/pull/44867)
- 修复了当查询中在不同位置包含相同的过滤谓词时，透明改写失败的问题。[#44575](https://github.com/apache/doris/pull/44575)
- 修复了当过滤谓词或连接谓词中使用列的别名时，无法透明改写的问题。[#44779](https://github.com/apache/doris/pull/44779)

### 索引

- 修复倒排索引 Compaction 异常处理的问题 [#45773](https://github.com/apache/doris/pull/45773)
- 修复倒排索引构建因为等锁超时失败的问题 [#43589](https://github.com/apache/doris/pull/43589)
- 修复异常情况下倒排索引写入 Crash 的问题。[#46075](https://github.com/apache/doris/pull/46075)
- 修复 Match 函数特殊参数时空指针的问题 [#45774](https://github.com/apache/doris/pull/45774)
- 修复 VARIANT 倒排索引相关的问题，禁用 VARIANT 使用索引 v1 格式。[#43971](https://github.com/apache/doris/pull/43971) [#45179](https://github.com/apache/doris/pull/45179/) 

- 修复 NGram Bloomfilter Index 设置 `gram_size = 65535` 时 Crash 的问题。[#43654](https://github.com/apache/doris/pull/43654)
- 修复 Bloomfilter Index 计算 DATE 和 DATETIME 不对的问题。[#43622](https://github.com/apache/doris/pull/43622)
- 修复 Drop Coloumn 没有自动 Drop Bloomfilter Index 的问题。[#44478](https://github.com/apache/doris/pull/44478)
- 减少 Bloomfilter Index 写入时的内存占用。[#46047](https://github.com/apache/doris/pull/46047)

### 半结构化数据类型

- 优化内存占用，降低 VARIANT 数据类型的内存消耗。[#43349](https://github.com/apache/doris/pull/43349) [#44585](https://github.com/apache/doris/pull/44585) [#45734](https://github.com/apache/doris/pull/45734)
- 优化 VARIANT Schema Copy 性能。[#45731](https://github.com/apache/doris/pull/45731)
- 自动推断 Tablet Key 时不将 VARIANT 作为 Key。[#44736](https://github.com/apache/doris/pull/44736)
- 修复 VARIANT 从 NOT NULL 改成 NULL 的问题。[#45734](https://github.com/apache/doris/pull/45734)
- 修复 Lambda 函数类型推断错误的问题。[#45798](https://github.com/apache/doris/pull/45798)
- 修复 `ipv6_cidr_to_range` 函数边界条件 Coredump。[#46252](https://github.com/apache/doris/pull/46252)

### 查询优化器

- 修复了潜在的表读锁互斥导致的死锁问题，并优化了锁的使用逻辑[#45045](https://github.com/apache/doris/pull/45045) [#43376](https://github.com/apache/doris/pull/43376) [#44164](https://github.com/apache/doris/pull/44164) [#44967](https://github.com/apache/doris/pull/44967) [#45995](https://github.com/apache/doris/pull/45995)
- 修复了 SQL Cache 功能错误的使用常量折叠导致在使用包含时间格式的函数时结果不正确的问题。[#44631](https://github.com/apache/doris/pull/44631)
- 修复了比较表达式优化，在边缘情况下可能优化错误，导致结果不正确的问题。[#44054](https://github.com/apache/doris/pull/44054) [#44725](https://github.com/apache/doris/pull/44725) [#44922](https://github.com/apache/doris/pull/44922) [#45735](https://github.com/apache/doris/pull/45735) [#45868](https://github.com/apache/doris/pull/45868)
- 修复高并发点查审计日志不正确的问题。[ #43345 ](https://github.com/apache/doris/pull/43345)[#44588](https://github.com/apache/doris/pull/44588)
- 修复高并发点查遇到异常后持续报错的问题。[#44582](https://github.com/apache/doris/pull/44582)
- 修复部分字段 Prepared Statement 不正确的问题。[#45732 ](https://github.com/apache/doris/pull/45732)

### 查询执行引擎

- 修复了正则表达式和 LIKE 函数在特殊字符时结果不对的问题。[#44547](https://github.com/apache/doris/pull/44547)
- 修复 SQL Cache 在切换 DB 的时候结果可能不对的问题。[#44782](https://github.com/apache/doris/pull/44782)
- 修复`cut_ipv6` 函数结果不对的问题。[#43921](https://github.com/apache/doris/pull/43921)
- 修复数值类型到 bool 类型 cast 的问题。[#46275](https://github.com/apache/doris/pull/46275)
- 修复了一系列 Arrow Flight 相关的问题。[#45661](https://github.com/apache/doris/pull/45661) [#45023](https://github.com/apache/doris/pull/45023) [#43960](https://github.com/apache/doris/pull/43960) [#43929](https://github.com/apache/doris/pull/43929) 
- 修复了当 hashjoin 的 hash 表超过 4G 时，部分情况结果错误的问题。[#46461](https://github.com/apache/doris/pull/46461/files)
- 修复了 convert_to 函数在中文字符时溢出的问题。[#46505](https://github.com/apache/doris/pull/46405)

### 存储管理

- 修复高并发 DDL 可能导致 FE 启动失败的问题。
- 修复自增列可能出现重复值的问题。
- 修复扩容时 Routine Load 不能使用新扩容 BE 的问题。

### 权限管理

- 修复使用 Ranger 作为鉴权插件时，频繁访问 Ranger 服务的问题[#45645](https://github.com/apache/doris/pull/45645)

### Others

- 修复 BE 端开启 `enable_jvm_monitor=true` 后可能导致的内存泄露问题。[#44311](https://github.com/apache/doris/pull/44311)