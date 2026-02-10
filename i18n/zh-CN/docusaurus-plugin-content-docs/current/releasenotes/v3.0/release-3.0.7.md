---
{
    "title": "Release 3.0.7",
    "language": "zh-CN",
    "description": "Apache Doris 3.0.7稳定版发布，新增MySQL GROUP BY WITH ROLLUP语法支持、LIKE ESCAPE功能、半结构化数据索引优化。显著改进存算分离架构、异步物化视图性能、倒排索引可观测性，修复导入、存储、查询、数据湖集成等多项关键缺陷，全面提升生产环境稳定性。"
}
---

## 行为变更

- 调整 `show frontends` 和 `show backends` 的权限需求，使其与对应的 RESTful API 保持一致，即需要 `information_schema` 库的 `SELECT_PRIV` 权限
- 指定 domain 的 admin 和 root 用户不再视为系统用户
- 存储：单库默认并发事务数调整为 10000 

## 新特性

### 查询优化器

- 支持 MySQL 的聚合上卷语法 `GROUP BY ... WITH ROLLUP` 

### 查询执行

- 新增数据函数：`cot`/`sec`/`cosec`
- `Like` 语句支持 `escape` 语法

### 半结构化数据管理

- 通过设置会话变量 `enable_add_index_for_new_data=true`，支持仅对新增数据构建不分词倒排索引和 NGram bloomfilter 索引


## 改进

### 导入

- 优化 `SHOW CREATE LOAD` 错误信息提示

### 主键

- 新增 segment key bounds 截断能力，避免单次大导入失败的问题

### 存储

- 增强 Compaction 和导入数据的可靠性
- 优化 balance 速度
- 优化建表速度
- 优化 compaction 默认参数及可观测性
- 优化查询报错 -230 的问题 
- 增加系统表 `backend_tablets` 
- 优化 Cloud 模式下从 follower 节点查询 `information_schema.tables` 的性能

### 存算分离

- 增强 Meta-service recycler 可观测性
- 支持导入 compaction 过程进行跨 compute group 增量预热
- 优化 Storage vault 连通性检查
- 支持通过 MS API 更新存储后端信息

### Lakehouse

- 优化 x86 环境下 ORC zlib 的解压性能并修复潜在问题
- 优化外表读取的默认并发线程数
- 优化不支持 DDL 操作的 Catalog 的报错信息

### 异步物化视图

- 优化透明改写规划的性能

### 查询优化器

- `group_concat` 函数现在允许参数为非字符串类型
- `sum` 和 `avg` 函数允许参数为非数值类型
- 扩展 TOP-N 查询延迟物化的支持范围，当查询部分列时也能延迟物化
- 创建分区时，list 分区允许包含 `MAX_VALUE`
- 优化采样收集聚合模型表统计信息的性能
- 优化采样收集统计信息时 NDV 值的准确性 

### 倒排索引

- 统一 `show create table` 中倒排索引展示的 properties 顺序 
- 为倒排索引过滤条件新增逐条件的 profile 指标（如命中行数与执行时间），便于性能分析 
- 增强 profile 中倒排索引相关信息展示

### 权限

- Ranger 支持设置 storage vault 和 compute group 的权限

## 缺陷修复

### 导入

- 修复导入 CSV 文件使用多字符分隔符可能导致的正确性问题
- 修复修改任务属性后显示 `ROUTINE LOAD` 任务结果不正确的问题
- 修复主节点重启或 Leader 切换后一流多表导入计划失效的问题
- 修复 `ROUTINE LOAD` 任务因找不到可用 BE 节点导致所有调度任务阻塞的问题
- 修复 `runningTxnIds` 并发读写冲突问题

### 主键

- 优化 mow 表在高频并发导入下的导入性能 
- mow 表 full compaction 释放被删除数据的空间
- 修复 mow 表在极端场景下可能出现的导入失败问题 
- 优化 mow 表 compaction 性能
- 修复 mow 表在有并发导入和 sc 时可能的正确性问题
- 修复 mow 空表执行 schema change 可能导致导入卡住或 schema change 失败的问题 
- 修复 mow delete bitmap cache 内存泄漏问题
- 修复 mow 表在 sc 后可能的正确性问题

### 存储

- 修复 compaction 导致的 clone 过程 missing rowset 问题
- 修复 autobucket 计算 size 不准确及默认值问题 
- 修复分桶列可能导致的正确性问题
- 修复单列表不能 rename 的问题
- 修复 memtable 可能的内存泄漏问题
- 修复空表事务写对不支持行为的报错不统一问题

### 存算分离

- File cache 相关修复
- 修复 schema 过程中 cumulative point 可能回滚的问题
- 修复后台任务影响自动重启的问题
- 修复 azure 环境中数据回收过程未处理的异常问题
- 修复单 rowset 做 compaction 未及时清理 file cache 的问题

### Lakehouse

- 修复 Kerberos 环境下 Iceberg 表写入事务提交失败的问题
- 修复 kerberos 环境下查询 hudi 的问题
- 修复多 Catalog 情况下潜在的死锁问题
- 修复某些情况下并发刷新 Catalog 导致元数据不一致的问题 
- 修复 ORC footer 某些情况下会被多次读取的问题 
- 修复 Table Valued Function 无法读取压缩格式 json 文件的问题
- SQL Server Catalog 支持识别 IDENTITY 列信息
- SQL Convertor 支持指定多个 url 以实现高可用

### 异步物化视图

- 修复当查询被优化为空集结果时，可能错误进行分区补偿的问题

### 查询优化器

- 修复 `sql_select_limit` 以外的影响 DML 执行结果的问题
- 修复开始 local shuffle 时，物化的 CTE 在极端情况下可能执行报错的问题 
- 修复 prepare 的 insert 语句无法在非 master 节点执行的问题
- 修复 `cast ipv4` 到 string 的结果错误问题 

### 权限

- 当一个用户拥有多个角色时，会合并多个角色的权限后再执行鉴权

### 查询执行

- 修复部分 json 函数问题
- 修复异步线程池满时可能导致 BE Core 的问题
- 修复 `hll_to_base64` 结果不正确的问题
- 修复 `decimal256` 转换为 float 时结果错误的问题
- 修复两处内存泄漏问题
- 修复 `bitmap_from_base64` 导致的 be core 问题
- 修复 `array_map` 函数可能导致的 be core 问题 
- 修复 `split_by_regexp` 函数可能的错误问题
- 修复超大数据量下 `bitmap_union` 函数可能的结果错误问题
- 修复 `format round` 函数在部分边界值下可能 core 的问题

### 倒排索引

- 修复倒排索引在异常情况下产生的内存泄漏问题
- 修复写入和查询空索引文件时报错的问题
- 捕获倒排索引字符串读取中的 IO 异常，避免因异常导致进程崩溃

### 复杂数据类型

- 修复 Variant Nested 嵌套数据类型冲突时可能导致的类型推断错误
- 修复 `map` 函数参数类型推导错误
- 修复 jsonpath 中指定 `'$.'` 作为 path 导致数据错误变为 NULL 的问题
- 修复 Variant 的子字段包含 `.` 时，序列化格式无法还原的问题

### 其他

- 修复 auditlog 表 IP 字段长度不足的问题
- 修复 SQL 解析错误时，审计日志中记录的 query id 为上一次执行查询的 query id 的问题 