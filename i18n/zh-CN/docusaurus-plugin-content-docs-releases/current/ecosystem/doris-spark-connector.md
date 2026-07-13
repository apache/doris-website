---
{
    "title": "Doris Spark Connector",
    "language": "zh-CN",
    "description": "Doris Spark Connector 版本发布说明。"
}
---

# Doris Spark Connector

本文按版本倒序列出 Doris Spark Connector 的版本发布说明。

## 26.0.0

来源：[Spark Doris Connector 26.0.0](https://github.com/apache/doris-spark-connector/issues/358)

### Spark Connector

#### 功能与改进

- Stream Load 写入默认启用 gzip 压缩。[#356](https://github.com/apache/doris-spark-connector/pull/356)
- 增加 Arrow Flight 读取日志。[#354](https://github.com/apache/doris-spark-connector/pull/354)
- 支持带 UTF-8 字符集编码的 HTTP 请求。[#347](https://github.com/apache/doris-spark-connector/pull/347)

#### Bug 修复

- 修复 Spark 3.3、3.4 和 3.5 中的列裁剪问题。[#353](https://github.com/apache/doris-spark-connector/pull/353)

### 致谢

- @JNSimba
- @gnehil

## 25.2.0

来源：[Spark Doris Connector 25.2.0](https://github.com/apache/doris-spark-connector/issues/342)

### Spark Connector

#### 功能与改进

- 为 Doris Flight SQL Reader 增加 FE 重试和负载均衡策略。[#318](https://github.com/apache/doris-spark-connector/pull/318)
- 为 frontend 和 backend 增加负载均衡策略。[#329](https://github.com/apache/doris-spark-connector/pull/329)
- 增加 schema-less 选项。[#332](https://github.com/apache/doris-spark-connector/pull/332)

#### Bug 修复

- 修复 SQL 中 `OR` 条件的 filter pushdown 问题。[#317](https://github.com/apache/doris-spark-connector/pull/317)
- 修复 FE 挂起时重试可能卡住的问题。[#331](https://github.com/apache/doris-spark-connector/pull/331)
- 改进 `accept_any_schema` 选项处理。[#326](https://github.com/apache/doris-spark-connector/pull/326)
- 修复 V2Expression 构建错误。[#339](https://github.com/apache/doris-spark-connector/pull/339)
- 修复配置 `doris.benodes` 不生效的问题。[#346](https://github.com/apache/doris-spark-connector/pull/346)

### 致谢

- @JNSimba
- @wanggx
- @wary

## 25.1.0

来源：[Spark Doris Connector Release Note 25.1.0](https://github.com/apache/doris-spark-connector/issues/319)

### Spark Connector

#### 功能与改进

- 支持 DataSource V2 overwrite。[#281](https://github.com/apache/doris-spark-connector/pull/281)
- 支持读取 `DECIMAL128` 类型。[#290](https://github.com/apache/doris-spark-connector/pull/290)
- 兼容 IP 数据类型读取。[#289](https://github.com/apache/doris-spark-connector/pull/289)
- 改进 BE Thrift 读取日志和 Stream Load 日志。[#279](https://github.com/apache/doris-spark-connector/pull/279) [#313](https://github.com/apache/doris-spark-connector/pull/313)
- 增加 Doris source 和 sink 集成测试用例，并增加 Spark 3.2、3.4、3.5 CI 覆盖。[#296](https://github.com/apache/doris-spark-connector/pull/296) [#297](https://github.com/apache/doris-spark-connector/pull/297) [#302](https://github.com/apache/doris-spark-connector/pull/302) [#312](https://github.com/apache/doris-spark-connector/pull/312)
- 增强 FE 节点端口检查，并提升写入性能。[#303](https://github.com/apache/doris-spark-connector/pull/303)
- 增加 load 失败时的重试间隔。[#307](https://github.com/apache/doris-spark-connector/pull/307)
- 增加 FE 请求代码检查。[#309](https://github.com/apache/doris-spark-connector/pull/309)
- 删除重构后的无用代码。[#295](https://github.com/apache/doris-spark-connector/pull/295)

#### Bug 修复

- 修复 filter `IN` 子句编译问题。[#277](https://github.com/apache/doris-spark-connector/pull/277)
- 修复 row converter 和 schema converter 的单元测试。[#278](https://github.com/apache/doris-spark-connector/pull/278)
- 修复空 partition commit txn 时的空指针异常。[#286](https://github.com/apache/doris-spark-connector/pull/286)
- 修复裁剪列结果未下推的问题。[#287](https://github.com/apache/doris-spark-connector/pull/287)
- 修复由 interval 配置错误导致的性能下降问题。[#294](https://github.com/apache/doris-spark-connector/pull/294)
- 修复 Spark 下推 `CASE WHEN` 表达式时的问题。[#300](https://github.com/apache/doris-spark-connector/pull/300)
- 修复 Stream Load 意外结束时加载任务卡住的问题。[#305](https://github.com/apache/doris-spark-connector/pull/305)
- 修复下推 UTF-8 编码时查询无法执行的问题。[#311](https://github.com/apache/doris-spark-connector/pull/311)
- 修复 `ArrowWriter` 和 `ArrowUtil` 重命名冲突。[#315](https://github.com/apache/doris-spark-connector/pull/315)

### Spark Load

#### 功能与改进

- 支持从 resource 加载 Hadoop 配置。[#280](https://github.com/apache/doris-spark-connector/pull/280)

### 致谢

- @aoyuEra
- @gnehil
- @JNSimba
- @IsmailTosunTnyl
- @qg-lin
- @vinlee19
- @wary

## 25.0.1

来源：[Spark Doris Connector Release Note 25.0.1](https://github.com/apache/doris-spark-connector/issues/276)

### Spark Connector

#### 功能与改进

- 支持接受任意 schema 的表。[#269](https://github.com/apache/doris-spark-connector/pull/269)
- 增加 Stream Load 响应日志。[#271](https://github.com/apache/doris-spark-connector/pull/271)
- 改进日志信息。[#274](https://github.com/apache/doris-spark-connector/pull/274)
- 增加发布脚本。[#275](https://github.com/apache/doris-spark-connector/pull/275)

#### Bug 修复

- 修复 Arrow 格式写入问题。[#270](https://github.com/apache/doris-spark-connector/pull/270)
- 修复列裁剪下推导致的读取问题。[#273](https://github.com/apache/doris-spark-connector/pull/273)

### Spark Load

#### Bug 修复

- 修复单元测试用例，并增加 CI 构建检查。[#272](https://github.com/apache/doris-spark-connector/pull/272)

### 致谢

- @gnehil
- @JNSimba

## 25.0.0

来源：[Spark Doris Connector Release Note 25.0.0](https://github.com/apache/doris-spark-connector/issues/268)

### Spark Connector

#### 功能与改进

- 支持 Spark DataSource V2 API 下推。[#250](https://github.com/apache/doris-spark-connector/pull/250)
- 支持 Spark 3.2 及以上版本的 partial limit pushdown。[#257](https://github.com/apache/doris-spark-connector/pull/257)
- 兼容 FE API 变化。[#260](https://github.com/apache/doris-spark-connector/pull/260)
- 支持 Spark 3.3 及以上版本的 `CREATE TABLE` 语句。[#264](https://github.com/apache/doris-spark-connector/pull/264)

#### Bug 修复

- 修复 Spark catalog 获取 JDBC 连接时的 driver 异常。[#251](https://github.com/apache/doris-spark-connector/pull/251)
- 修复读取 date 类型时的数据转换异常。[#253](https://github.com/apache/doris-spark-connector/pull/253)
- 修复加载 MySQL driver 时加载 Arrow JDBC driver 导致的异常。[#254](https://github.com/apache/doris-spark-connector/pull/254)
- 修复 schema 中列顺序与数据中列顺序不一致的问题。[#256](https://github.com/apache/doris-spark-connector/pull/256)
- 修复通过 Flight SQL 读取 JSON 类型数据时的异常。[#263](https://github.com/apache/doris-spark-connector/pull/263)
- 修复启用 `spark.sql.datetime.java8API.enabled` 配置后读取 date 类型数据的异常。[#265](https://github.com/apache/doris-spark-connector/pull/265)

### Spark Load

#### 功能与改进

- 支持基于对象存储执行作业。[#266](https://github.com/apache/doris-spark-connector/pull/266)

### 致谢

- @gnehil
- @JNSimba
