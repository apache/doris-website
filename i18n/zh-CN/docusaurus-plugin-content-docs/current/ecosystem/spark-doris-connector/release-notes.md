---
{
    "title": "Release Notes",
    "language": "zh-CN"
}
---

# Spark Doris Connector Release Notes

## 25.2.0

### 改进

- 为 Doris Flight SQL Reader 添加 FE 重试和负载均衡策略 [#318](https://github.com/apache/doris-spark-connector/pull/318)
- 为前端和后端添加负载均衡策略 [#329](https://github.com/apache/doris-spark-connector/pull/329)
- 新增 Schema-less 选项 [#332](https://github.com/apache/doris-spark-connector/pull/332)

### Bug 修复

- 修复 SQL 中 OR 条件的过滤下推问题 [#317](https://github.com/apache/doris-spark-connector/pull/317)
- 修复 FE 挂起时重试可能卡住的问题 [#331](https://github.com/apache/doris-spark-connector/pull/331)
- 将 accept_any_schema 改进为 Options 配置 [#326](https://github.com/apache/doris-spark-connector/pull/326)
- 修复 V2Expression 构建错误 [#339](https://github.com/apache/doris-spark-connector/pull/339)
- 修复配置 doris.benodes 不生效的问题 [#346](https://github.com/apache/doris-spark-connector/pull/346)

### 致谢

@JNSimba @wanggx @wary

## 25.1.0

### 改进

- 支持 DataSource V2 的 Overwrite 模式 [#281](https://github.com/apache/doris-spark-connector/pull/281)
- 支持读取 DECIMAL128 类型 [#290](https://github.com/apache/doris-spark-connector/pull/290)
- 兼容读取 IP 数据类型 [#289](https://github.com/apache/doris-spark-connector/pull/289)
- 改进 BE Thrift 读取日志和 Stream Load 日志 [#279](https://github.com/apache/doris-spark-connector/pull/279) [#313](https://github.com/apache/doris-spark-connector/pull/313)
- 新增 Doris Source/Sink 集成测试及 Spark 3.2/3.4/3.5 CI [#296](https://github.com/apache/doris-spark-connector/pull/296) [#297](https://github.com/apache/doris-spark-connector/pull/297) [#302](https://github.com/apache/doris-spark-connector/pull/302) [#312](https://github.com/apache/doris-spark-connector/pull/312)
- 增强 FE 节点端口检查并提升写入性能 [#303](https://github.com/apache/doris-spark-connector/pull/303)
- 加载失败时增加重试间隔 [#307](https://github.com/apache/doris-spark-connector/pull/307)
- 为 FE 请求添加状态码检查 [#309](https://github.com/apache/doris-spark-connector/pull/309)
- 重构后移除未使用的代码 [#295](https://github.com/apache/doris-spark-connector/pull/295)

### Bug 修复

- 修复过滤 IN 子句编译问题 [#277](https://github.com/apache/doris-spark-connector/pull/277)
- 修复行转换器和 Schema 转换器的单元测试 [#278](https://github.com/apache/doris-spark-connector/pull/278)
- 修复空分区提交事务时的空指针异常 [#286](https://github.com/apache/doris-spark-connector/pull/286)
- 修复列裁剪结果未被下推的问题 [#287](https://github.com/apache/doris-spark-connector/pull/287)
- 修复间隔错误导致的性能下降 [#294](https://github.com/apache/doris-spark-connector/pull/294)
- 修复 Spark 下推 'case when' 时的问题 [#300](https://github.com/apache/doris-spark-connector/pull/300)
- 修复 Stream Load 异常结束时加载任务卡住的问题 [#305](https://github.com/apache/doris-spark-connector/pull/305)
- 修复下推 UTF-8 编码时无法执行查询的问题 [#311](https://github.com/apache/doris-spark-connector/pull/311)
- 修复重命名 ArrowWriter 和 ArrowUtil 的冲突 [#315](https://github.com/apache/doris-spark-connector/pull/315)

### 致谢

@aoyuEra @gnehil @JNSimba @IsmailTosunTnyl @qg-lin @vinlee19 @wary
