---
{
    "title": "Release 2.1.4",
    "language": "zh-CN",
    "description": "Apache Doris 2.1.4 版本已于 2024 年 6 月 26 日正式发布。 在 2.1.4 版本中，我们对数据湖分析场景进行了多项功能体验优化，重点修复了旧版本中异常内存占用的问题，同时提交了若干改进项以及问题修复，进一步提升了系统的性能、稳定性及易用性，欢迎大家下载使用。"
}
---

**Apache Doris 2.1.4 版本已于 2024 年 6 月 26 日正式发布。** 在 2.1.4 版本中，我们对数据湖分析场景进行了多项功能体验优化，重点修复了旧版本中异常内存占用的问题，同时提交了若干改进项以及问题修复，进一步提升了系统的性能、稳定性及易用性，欢迎大家下载使用。

**官网下载：** https://doris.apache.org/download/

**GitHub 下载：** https://github.com/apache/doris/releases

## 行为变更

- **通过 Catalog 查询外部表（如 Hive 数据表）时，系统将忽略不存在的文件：** 当从元数据缓存中获取文件列表时，由于缓存更新并非实时，因此可能存在实际的文件列表已删除、而元数据缓存中仍存在该文件的情况。为了避免由于尝试访问不存在的文件而导致的查询错误，系统会忽略这些不存在的文件。  [#35319](https://github.com/apache/doris/pull/35319)

- 默认情况下，创建 Bitmap Index 不再默认变更为 Inverted Index。该行为由 FE 配置项 `enable_create_bitmap_index_as_inverted_index` 控制，默认为 FALSE。[#35521](https://github.com/apache/doris/pull/35521)

- 当使用 `--console` 启动 FE、BE 进程时，所有日志将输出到标准输出，并通过前缀区分不同类型的日志。[#35679](https://github.com/apache/doris/pull/35679)

	关于更多信息，请参考文档：
	
  - [BE 日志管理](../../admin-manual/log-management/be-log.md)
  
  - [FE 日志管理](../../admin-manual/log-management/fe-log.md)

- 如果建表时没有填写表注释，默认注释为空，不再使用表类型作为默认表注释。  [#36025](https://github.com/apache/doris/pull/36025)

- DECIMALV3 的默认精度从 (9, 0) 调整为 (38,9) ，以和最初发布此功能的版本保持兼容。 [#36316](https://github.com/apache/doris/pull/36316)

## 新增功能

### 查询优化器

- **支持 FE 火焰图工具**：在 FE 部署目录 `${DORIS_FE_HOME}/bin` 中会增加`profile_fe.sh` 脚本，可以利用 async-profiler 工具生成 FE 的火焰图，用以发现性能瓶颈点。
  
  关于更多信息，请参考文档：[使用 FE Profiler 生成火焰图](https://doris.apache.org/zh-CN/community/developer-guide/fe-profiler)

- **支持 SELECT DISTINCT 与聚合函数同时使用**：支持 `SELECT DISTINCT` 与聚合函数同时使用，在一个查询中同时去重和进行聚合操作，如 SUM、MIN/MAX 等。

- **支持无 GROUP BY 的单表查询重写**：无 `GROUP BY` 的单表查询重写功能允许数据库优化器在不需要分组的情况下，根据查询的复杂性和数据表的结构，自动选择最佳的执行计划来执行查询，这可以提高查询的性能，减少不必要的资源消耗，并简化查询逻辑。 [#35242](https://github.com/apache/doris/pull/35242).

- **查询优化器全面支持高并发点查询功能**：在 2.1.4 版本之后，查询优化器全面支持高并发点查询功能，所有符合点查询条件的 SQL 语句会自动走短路径查询，无需用户在客户端额外设置 `set experimental_enable_nereids_planner = false`。 [#36205](https://github.com/apache/doris/pull/36205).

### 湖仓一体

- **支持 Paimon 的原生读取器来处理 Deletion Vector：** Deletion Vector 主要用于标记或追踪哪些数据已被删除或标记为删除，通常应用在需要保留历史数据的场景，基于本优化可以提升大量数据更新或删除时的处理效率。 [#35241](https://github.com/apache/doris/pull/35241)
  
  关于更多信息，请参考文档：[数据湖分析 - Paimon](../../lakehouse/catalogs/paimon-catalog)
  
-  **支持在表值函数（TVF）中使用 Resource**：TVF 功能为 Apache Doris 提供了直接将对象存储或 HDFS 上的文件作为 Table 进行查询分析的能力。通过在 TVF 中引用 Resource，可以避免重复填写连接信息，提升使用体验。  [#35139](https://github.com/apache/doris/pull/35139)

	关于更多信息，请参考文档：[表函数 - HDFS](../../lakehouse/storages/hdfs.md)

- **支持通过 Ranger 插件实现数据脱敏**：开启 Ranger 鉴权功能后，支持使用 Ranger 中的 Data Mask 功能进行数据脱敏。

	关于更多信息，请参考文档：[基于 Apache Ranger 的鉴权管理](../../admin-manual/auth/ranger#资源和权限)

### 异步物化视图

- 构建支持内表触发式更新，如果物化视图使用的是内表，如果内表数据发生变化，可以触发物化视图刷新，需要在创建物化视图时指定 REFRESH ON COMMIT。

- 支持单表透明改写。

  关于更多信息，请参考文档：[查询异步物化视图](../../query-acceleration/materialized-view/async-materialized-view/functions-and-demands.md)

- 透明改写支持 agg_state, agg_union 类型的聚合上卷，物化视图可以定义为 agg_state 或者 agg_union，查询使用具体的聚合函数，或者使用 agg_merge

  关于更多信息，请参考文档：[AGG_STATE](../../sql-manual/basic-element/sql-data-types/aggregate/AGG-STATE)

### 其他

- **新增 `replace_empty` 函数**：将字符串中的子字符串进行替换，当旧字符串为空时，会将新字符串插入到原有字符串的每个字符前以及最后。
  
  关于更多信息，请参考文档：[字符串函数 - REPLACE_EMPTY](../../sql-manual/sql-functions/scalar-functions/string-functions/replace-empty)

- 支持 `show storage policy using` 语句：支持查看所有或指定存储策略关联的表和分区。

	关于更多信息，请参考文档：[SQL 语句 - SHOW](../../sql-manual/sql-statements/cluster-management/storage-management/SHOW-STORAGE-POLICY-USING)

- **支持 BE 侧的 JVM 指标：** 通过在 `be.conf` 配置文件中设置`enable_jvm_monitor=true`，可以启用对 BE 节点 JVM 的监控和指标收集，有助于了解 BE JVM 的资源使用情况，以便进行故障排除和性能优化。

## 改进优化

- 支持为中文列名创建倒排索引。[#36321](https://github.com/apache/doris/pull/36321)

- 优化 Segment Cache 所消耗内存的估算准确度，以便能够更快地释放未使用的内存。[#35751](https://github.com/apache/doris/pull/35751)

- 在使用 Export 功能导出数据时，提前过滤空分区以提升导出效率。[#35542](https://github.com/apache/doris/pull/35542)

- 优化 Routine Load 任务分配算法以平衡 BE 节点之间的负载压力。[#34778](https://github.com/apache/doris/pull/34778)

- 在设置错误的会话变量名时，自动识别近似变量值并给出更详细的错误提示。[#35775](https://github.com/apache/doris/pull/35775)

- 支持将 Java UDF Jar 文件放到 FE 的 `custom_lib` 目录中并默认加载。[#35984](https://github.com/apache/doris/pull/35984)

- 为审计日志导入作业添加超时的全局变量`audit_plugin_load_timeout` ，以控制在加载审计插件或处理审计日志时允许的最大执行时间。

- 优化了异步物化视图透明改写规划的性能。

- 当 `INSERT` 源数据为空时，BE 将不会执行任何操作。[#34418](https://github.com/apache/doris/pull/34418)

- 支持分批获取 Hudi 和 Hive 文件列表，当存在大量数据文件时可以提升数据扫描性能。  [#35107](https://github.com/apache/doris/pull/35107)

  - 120 万文件场景中，获取文件列表的时间由 390 秒缩减到 46 秒。

- 创建异步物化视图时，禁止使用动态分区。

- 支持检测 Hive 外表分区数据是否和异步物化视图同步。

- 允许异步物化视图创建索引。

## 缺陷修复

### 查询优化器

- 修复 SQL Cache 在 `truncate paritition` 后依然返回旧结果的问题。[#34698](https://github.com/apache/doris/pull/34698)

- 修复从 JSON Cast 到其他类型 Nullable 属性不对的问题。[#34707](https://github.com/apache/doris/pull/34707)

- 修复偶现的 DATETIMEV2 Literal 化简错误。 [#35153](https://github.com/apache/doris/pull/35153)

- 修复窗口函数中不能使用 `COUNT(*)` 的问题。[#35220](https://github.com/apache/doris/pull/35220)

- 修复 `UNION ALL` 下全部是无 `FROM 的 `SELECT` 时，Nullable 属性可能错误的问题。
[#35074](https://github.com/apache/doris/pull/35074)

- 修复 `bitmap in join` 和子查询解嵌套无法同时使用的问题。[#35435](https://github.com/apache/doris/pull/35435)

- 修复在特定情况下过滤条件不能下推到 CTE Producer 导致的性能问题。[#35463](https://github.com/apache/doris/pull/35463)

- 修复聚合 Combinator 为大写时，无法找到函数的问题。[#35540](https://github.com/apache/doris/pull/35540)

- 修复窗口函数没有被列裁剪正确裁剪导致的性能问题。[#35504](https://github.com/apache/doris/pull/35504)

- 修复多个同名不同库的表同时出现在查询中时，可能解析错误导致结果错误的问题。[#35571](https://github.com/apache/doris/pull/35571)

- 修复对于 Schema 表扫描时，由于生成了 Runtime Filter 导致查询报错的问题。[#35655](https://github.com/apache/doris/pull/35655)

- 修复关联子查询解嵌套，关联条件被折叠为 Null Literal 导致无法执行的问题。[#35811](https://github.com/apache/doris/pull/35811)

- 修复规划时，偶现的 Decimal Literal 被错误设置精度的问题。 [#36055](https://github.com/apache/doris/pull/36055)


- 修复偶现的多层聚合被合并后规划错误的问题。[#36145](https://github.com/apache/doris/pull/36145)

- 修复偶现的聚合扩展规划报错输入输出不匹配的问题。[#36207](https://github.com/apache/doris/pull/36207)

- 修复偶现的 `<=>` 被错误转换为 `=` 的问题。[#36521](https://github.com/apache/doris/pull/36521)

### 查询执行

- 修复 Pipeline 引擎上达到限定的行数且内存没有释放时查询被挂起的问题。 [#35746](https://github.com/apache/doris/pull/35746)

- 修复当设置 `enable_decimal256 =true` 且查询优化器回退到旧版本时 BE 发生 Core 的问题。[#35731](https://github.com/apache/doris/pull/35731)

### 物化视图

- 修复构建异步物化视图指定 store_row_column 属性，be core 的问题。
  
- 修复构建异步物化视图指定 storage_medium 不生效的问题。

- 修复基表删除后，异步物化视图 show partitions 报错的问题。
 
- 修复异步物化视图引起备份恢复异常的问题。

- 修复分区改写可能导致错误结果的问题。

### 半结构化数据分析

- 修复带有空 Key 的 VARIANT 类型发生 Core 的问题。[#35671](https://github.com/apache/doris/pull/35671)

- Bitmap 索引和 BloomFilter 索引不应支持轻量级索引变更。[#35225](https://github.com/apache/doris/pull/35225)

### 主键模型

- 修复在有部分列更新导入的情况下发生异常重启，可能会产生重复 Key 的问题。[#35678](https://github.com/apache/doris/pull/35678)

- 修复在内存紧张时发生 Clone 时 BE 可能会发生 Core 的问题。[#34702](https://github.com/apache/doris/pull/34702)

### 湖仓一体

- 修复创建 Hive 表时无法使用完全限定名（如 `ctl.db.tbl`）的问题。 [#34984](https://github.com/apache/doris/pull/34984)

- 修复 Refresh 操作时 Hive Metastore 连接未关闭的问题。[#35426](https://github.com/apache/doris/pull/35426)

- 修复从 2.0.x 升级到 2.1.x 时可能的元数据回放问题。 [#35532](https://github.com/apache/doris/pull/35532)

- 修复 TVF 表函数无法读取空 Snappy 压缩文件的问题。[#34926](https://github.com/apache/doris/pull/34926)

- 修复无法读取具有无效最小/最大列统计信息的 Parquet 文件的问题。[#35041](https://github.com/apache/doris/pull/35041)

- 修复 Parquet/ORC Reader 中无法处理带有 null-aware 函数下推谓词的问题。[#35335](https://github.com/apache/doris/pull/35335)

- 修复创建 Hive 表时分区列顺序的问题。 [#35347](https://github.com/apache/doris/pull/35347)

- 修复当分区值包含空格时无法将 Hive 表写入 S3 的问题。 [#35645](https://github.com/apache/doris/pull/35645)

- 修复 Doris 写入 Parquet 格式 Hive 表无法被 Hive 读取的问题。 [#34981](https://github.com/apache/doris/pull/34981)

- 修复 Hive 表 Schema 变更后无法读取 ORC 文件的问题。[#35583](https://github.com/apache/doris/pull/35583)

- 修复了部分情况下，启用 Hive Metastore Listener 后 FE 无法启动的问题。[#36533](https://github.com/apache/doris/pull/36533)

- 修复由 Hadoop FS 缓存引起的 FE OOM 问题。[#36403](https://github.com/apache/doris/pull/36403)

- 修复写出 Parquet 格式文件写出 Row Group 过小的问题。[#36042](https://github.com/apache/doris/pull/36042) [#36143](https://github.com/apache/doris/pull/36143)

- 修复 Paimon 表 Schema 变更后无法通过 JNI 读取 Paimon 表的问题。[#35309](https://github.com/apache/doris/pull/35309)

- 修复 Paimon 表 Schema 变更后由于表字段长度判断错误导致无法读取的问题。 [#36049](https://github.com/apache/doris/pull/36049)

- 修复了读取 Iceberg 中的时间戳列类型时的时区问题。 [#36435](https://github.com/apache/doris/pull/36435)

- 修复了 Iceberg 表上的日期时间转换错误和数据路径错误的问题。[#35708](https://github.com/apache/doris/pull/35708)

- 修复阿里云 OSS Endpoint 不正确的问题。[#34907](https://github.com/apache/doris/pull/34907)

- 修复了大量文件导致的查询性能下降问题。[#36431](https://github.com/apache/doris/pull/36431)

- 允许用户定义的属性通过表函数传递给 S3 SDK。[#35515](https://github.com/apache/doris/pull/35515)

### 数据导入

- 修复 `CANCEL LOAD` 命令不生效的问题。[#35352](https://github.com/apache/doris/pull/35352)

- 修复导入事务 Publish 阶段空指针错误导致导入事务无法完成的问题。[#35977](https://github.com/apache/doris/pull/35977)

- 修复 bRPC 通过 HTTP 发送大数据文件序列化的问题。 [#36169](https://github.com/apache/doris/pull/36169)

### 数据管控

- 修复了在将 DDL 或 DML 转发到主 FE 后，ConnectionContext 中的资源标签未设置的问题。 [#35618](https://github.com/apache/doris/pull/35618)

- 修复了在启用 `lower_case_table_names` 时，Restore 表名不正确的问题。 [#35508](https://github.com/apache/doris/pull/35508)

- 修复了清理无用数据或文件的管理命令不生效的问题。 [#35271](https://github.com/apache/doris/pull/35271)

- 修复了无法从分区中删除存储策略的问题。[#35874](https://github.com/apache/doris/pull/35874)

- 修复了向多副本自动分区表导入数据时的数据丢失问题。[#36586](https://github.com/apache/doris/pull/36586)

- 修复了使用旧优化器查询或插入自动分区表时，表的分区列发生变化的问题。 [#36514](https://github.com/apache/doris/pull/36514)

### 内存管理

- 修复日志中频繁报错 Cgroup meminfo 获取失败的问题。 [#35425](https://github.com/apache/doris/pull/35425)

- 修复使用 BloomFilter 时 Segment 缓存大小不受控制导致进程内存异常增长的问题。[#34871](https://github.com/apache/doris/pull/34871)

### 权限

- 修复开启表名大小写不敏感后，权限设置无效的问题。[#36557](https://github.com/apache/doris/pull/36557)

- 修复通过非 Master FE 节点设置 LDAP 密码不生效的问题。[#36598](https://github.com/apache/doris/pull/36598)

- 修复了无法检查 `SELECT COUNT(*)` 语句授权的问题。[#35465](https://github.com/apache/doris/pull/35465)

### 其他

- 修复 MySQL 连接损坏情况下，客户端 JDBC 程序无法关闭连接的问题。 [#36616](https://github.com/apache/doris/pull/36616)

- 修改 `SHOW PROCEDURE STATUS` 语句返回值与 MySQL 协议不兼容的问题。[#35350](https://github.com/apache/doris/pull/35350)

- `libevent` 库强制开启 Keepalive 以解决部分情况下连接泄露的问题。 [#36088](https://github.com/apache/doris/pull/36088)


## 致谢

@133tosakarin、@924060929、@airborne12、@amorynan、@AshinGau、@BePPPower、@BiteTheDDDDt、@ByteYue、@caiconghui、@CalvinKirs、@cambyzju、@catpineapple、@cjj2010、@csun5285、@DarvenDuan、@dataroaring、@deardeng、@Doris-Extras、@eldenmoon、@englefly、@feiniaofeiafei、@felixwluo、@freemandealer、@Gabriel39、@gavinchou、@GoGoWen、@HappenLee、@hello-stephen、@hubgeter、@hust-hhb、@jacktengg、@jackwener、@jeffreys-cat、@Jibing-Li、@kaijchen、@kaka11chen、@Lchangliang、@liaoxin01、@LiBinfeng-01、@lide-reed、@luennng、@luwei16、@mongo360、@morningman、@morrySnow、@mrhhsg、@Mryange、@mymeiyi、@nextdreamblue、@platoneko、@qidaye、@qzsee、@seawinde、@shuke987、@sollhui、@starocean999、@suxiaogang223、@TangSiyang2001、@Thearas、@Vallishp、@w41ter、@wangbo、@whutpencil、@wsjz、@wuwenchi、@xiaokang、@xiedeyantu、@XieJiann、@xinyiZzz、@XuPengfei-1020、@xy720、@xzj7019、@yiguolei、@yongjinhou、@yujun777、@Yukang-Lian、@Yulei-Yang、@zclllyybb、@zddr、@zfr9527、@zgxme、@zhangbutao、@zhangstar333、@zhannngchen、@zhiqiang-hhhh、@zy-kkk、@zzzxl1993
