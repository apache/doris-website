---
{
    "title": "Doris Kafka Connector",
    "language": "zh-CN",
    "description": "Doris Kafka Connector 版本发布说明。"
}
---

# Doris Kafka Connector

本文按版本倒序列出 Doris Kafka Connector 的版本发布说明。

## 26.0.0

来源：[Release Note 26.0.0](https://github.com/apache/doris-kafka-connector/issues/98)

### 功能与改进

- Stream Load 默认启用 gzip 压缩。[#95](https://github.com/apache/doris-kafka-connector/pull/95)
- 修复 schema evolution 中连接复用不当导致 JDBC 连接激增的问题。[#94](https://github.com/apache/doris-kafka-connector/pull/94)
- 增加 Confluent 构建脚本。[#86](https://github.com/apache/doris-kafka-connector/pull/86)
- 更新 `ConfigDef` 配置。[#85](https://github.com/apache/doris-kafka-connector/pull/85)

### Bug 修复

- 修复 `topic2table` 配置检查。[#83](https://github.com/apache/doris-kafka-connector/pull/83)
- 修复 README 中的网站文档链接。[#84](https://github.com/apache/doris-kafka-connector/pull/84)

### 致谢

- @JNSimba
- @rnb-tron

## 25.0.0

来源：[Release Note 25.0.0](https://github.com/apache/doris-kafka-connector/issues/81)

### 功能与改进

- 支持异步 combine flush。[#74](https://github.com/apache/doris-kafka-connector/pull/74)
- 更新配置默认值，并增加 combine flush mode。[#73](https://github.com/apache/doris-kafka-connector/pull/73)
- 将日志级别改为 debug。[#75](https://github.com/apache/doris-kafka-connector/pull/75)
- 增加多 transform 链的端到端测试。[#72](https://github.com/apache/doris-kafka-connector/pull/72)
- 增加 null values 处理行为。[#69](https://github.com/apache/doris-kafka-connector/pull/69)
- 增加 topic-mutating SMT 检查。[#68](https://github.com/apache/doris-kafka-connector/pull/68)
- 增加重试策略。[#67](https://github.com/apache/doris-kafka-connector/pull/67)
- 增加 Debezium update、delete 和 Avro 转换用例。[#65](https://github.com/apache/doris-kafka-connector/pull/65)
- 增加 Kafka Connect transforms 端到端测试用例。[#64](https://github.com/apache/doris-kafka-connector/pull/64)
- 优化代码，包括 label transaction status 查询等逻辑。[#62](https://github.com/apache/doris-kafka-connector/pull/62)
- schema change 错误信息中增加表名。[#61](https://github.com/apache/doris-kafka-connector/pull/61)
- 增加发布脚本。[#80](https://github.com/apache/doris-kafka-connector/pull/80)

### Bug 修复

- 修复 decimal 解析问题。[#70](https://github.com/apache/doris-kafka-connector/pull/70)
- 修复重试 load 时 `processedOffset` 更新问题。[#79](https://github.com/apache/doris-kafka-connector/pull/79)
- 在适当场景下忽略 schema API 响应。[#77](https://github.com/apache/doris-kafka-connector/pull/77)

### 致谢

- @chuang-wang-pre
- @DongLiang-0
- @JNSimba
- @vinlee19
