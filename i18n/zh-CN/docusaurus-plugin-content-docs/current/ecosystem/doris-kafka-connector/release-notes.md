---
{
    "title": "Release Notes",
    "language": "zh-CN"
}
---

# Doris Kafka Connector Release Notes

## 25.0.0

### 功能与改进

- 支持合并异步刷新 [#74](https://github.com/apache/doris-kafka-connector/pull/74)
- 更新配置默认值并添加合并刷新模式 [#73](https://github.com/apache/doris-kafka-connector/pull/73)
- 将日志级别调整为 Debug [#75](https://github.com/apache/doris-kafka-connector/pull/75)
- 新增多 Transform 链的端到端测试 [#72](https://github.com/apache/doris-kafka-connector/pull/72)
- 添加空值处理行为 [#69](https://github.com/apache/doris-kafka-connector/pull/69)
- 检查 Topic 变更的 SMT [#68](https://github.com/apache/doris-kafka-connector/pull/68)
- 添加重试策略 [#67](https://github.com/apache/doris-kafka-connector/pull/67)
- 新增 Debezium Update、Delete 和 Avro 转换测试用例 [#65](https://github.com/apache/doris-kafka-connector/pull/65)
- 新增 Kafka Connect Transforms 端到端测试用例 [#64](https://github.com/apache/doris-kafka-connector/pull/64)
- 优化部分代码，包括查询 Label 事务状态等 [#62](https://github.com/apache/doris-kafka-connector/pull/62)
- Schema 变更错误提示表名 [#61](https://github.com/apache/doris-kafka-connector/pull/61)
- 新增发布脚本工具 [#80](https://github.com/apache/doris-kafka-connector/pull/80)

### Bug 修复

- 修复 Decimal 解析问题 [#70](https://github.com/apache/doris-kafka-connector/pull/70)
- 修复重试加载时 processedOffset 更新问题 [#79](https://github.com/apache/doris-kafka-connector/pull/79)
- 忽略 Schema API 响应 [#77](https://github.com/apache/doris-kafka-connector/pull/77)

### 致谢

@chuang-wang-pre @DongLiang-0 @JNSimba @vinlee19
