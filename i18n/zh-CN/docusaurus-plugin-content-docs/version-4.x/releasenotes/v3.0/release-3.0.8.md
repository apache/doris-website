---
{
    "title": "Release 3.0.8",
    "language": "zh-CN",
    "description": "schema-change"
}
---

## 行为变更

- 当使用 ranger / LDAP 时，不再禁止在 Doris 中创建用户 [#50139](https://github.com/apache/doris/pull/50139)
- variant 在默认情况下会关闭 nested 属性，若需在建表时开启，需先在 session variable 中执行以下命令：`set enable_variant_flatten_nested = true`[#54413](https://github.com/apache/doris/pull/54413)

## 新特性

### 查询优化器

- 支持 MySQL 的 GROUP BY WITH ORDER 语法 [#53037](https://github.com/apache/doris/pull/53037)


## 改进

### 导入

- 优化内存不足时的下刷策略 ([#52906](https://github.com/apache/doris/pull/52906), [#53909](https://github.com/apache/doris/pull/53909), [#42649](https://github.com/apache/doris/pull/42649), [#54517](https://github.com/apache/doris/pull/54517))
- S3 Load 和 TVF 支持无 AK/SK 访问公开可读的对象 ([#53592](https://github.com/apache/doris/pull/53592), [#54040](https://github.com/apache/doris/pull/54040))

### 存算分离

- 当缓存空间充足时，base compaction 生成的 rowset 可以写入文件缓存 ([#53801](https://github.com/apache/doris/pull/53801), [#54693](https://github.com/apache/doris/pull/54693))
- 优化 `ALTER STORAGE VAULT` 命令，`type`属性可以自动推导，无需显式制定 ([#54394](https://github.com/apache/doris/pull/54394), [#54475](https://github.com/apache/doris/pull/54475))


### 查询优化器

- 点查查询会被规划为只有一个 fragment，以提升点查的执行速度 [#53541](https://github.com/apache/doris/pull/53541)

### 查询执行

- 提升 unique key 表在点查时的性能 [#53948](https://github.com/apache/doris/pull/53948)

### 倒排索引

- 优化不分词索引写入时常见默认分词器的额外资源消耗 [#54666](https://github.com/apache/doris/pull/54666)


## 缺陷修复

### 导入

- 修复在使用多字符列分隔符时，`enclose` 解析错误的问题 ([#54581](https://github.com/apache/doris/pull/54581), [#55052](https://github.com/apache/doris/pull/55052))
- 修复 S3 Load 进度更新不及时的问题 ([#54606](https://github.com/apache/doris/pull/54606), [#54790](https://github.com/apache/doris/pull/54790))
- 修复 JSON 格式布尔类型加载到 INT 列时的错误 ([#54397](https://github.com/apache/doris/pull/54397), [#54640](https://github.com/apache/doris/pull/54640))
- 修复 Stream Load 缺失错误 URL 返回的问题 ([#54115](https://github.com/apache/doris/pull/54115), [#54266](https://github.com/apache/doris/pull/54266))
- 修复在 schema change 抛出异常后 group commit 被阻塞的问题 [#54312](https://github.com/apache/doris/pull/54312)

### Lakehouse

- 修复部分情况下使用 JDBC SQL 透传解析失败的问题 [#54077](https://github.com/apache/doris/pull/54077)
- 修复写入 decimal 分区的 iceberg 表失败的问题 [#54557](https://github.com/apache/doris/pull/54557)
- 修复某些情况下 Hudi 表 Timestamp 类型分区列查询失败的问题 [#53791](https://github.com/apache/doris/pull/53791)

### 查询优化器

- 修复在部分自关联场景中，错误使用 colocate join 的问题 [#54323](https://github.com/apache/doris/pull/54323)
- 修复 select distinct 与窗口函数一起使用时可能导致的结果错误 [#54133](https://github.com/apache/doris/pull/54133)
- 当 lambda 表达式出现在非预期位置时，提供更友好的报错 [#53657](https://github.com/apache/doris/pull/53657)

### 权限

- 修复查询外部视图时，错误检查视图中基表权限的问题 [#53786](https://github.com/apache/doris/pull/53786)

### 查询执行

- 修复 IPV6 类型不能解析 IPV4 类型数据的问题 [#54391](https://github.com/apache/doris/pull/54391)
- 修复 IPV6 类型解析时出现栈溢出的错误 [#53713](https://github.com/apache/doris/pull/53713)


### 复杂数据类型

- BE 支持启动时选择符合指令集的 simdjson parser [#52732](https://github.com/apache/doris/pull/52732)
- 修复 variant nested 数据类型在数据类型冲突情况下导致的错误类型推断 [#53083](https://github.com/apache/doris/pull/53083)
- 修复 variant nested 顶层嵌套 array 数据默认值填充问题 [#54396](https://github.com/apache/doris/pull/54396)
- 禁止 variant 类型在 cloud 上 build index [#54777](https://github.com/apache/doris/pull/54777)
- 修复 variant 创建倒排索引后写入不符合索引条件的数据时生成空索引文件的问题 [#53814](https://github.com/apache/doris/pull/53814)

### 其他

**schema-change**

- 修复在清理失败的 SC 任务时新 tablet 为空的问题 ([#53952](https://github.com/apache/doris/pull/53952), [#54064](https://github.com/apache/doris/pull/54064))
- 按原有顺序重建 bucket 列 ([#54024](https://github.com/apache/doris/pull/54024), [#54072](https://github.com/apache/doris/pull/54072), [#54109](https://github.com/apache/doris/pull/54109))
- 禁止删除 bucket 列 [#54037](https://github.com/apache/doris/pull/54037)
- 网络错误时支持自动重试 ([#54419](https://github.com/apache/doris/pull/54419), [#54488](https://github.com/apache/doris/pull/54488))
- 避免在 `tabletInvertedIndex` 上的死锁 ([#54197](https://github.com/apache/doris/pull/54197), [#54996](https://github.com/apache/doris/pull/54996))