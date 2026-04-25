---
{
    "title": "Release Notes",
    "language": "zh-CN"
}
---

# Flink Doris Connector Release Notes

## 26.1.0

### 功能与改进

- StreamLoad 默认启用 gz 压缩 [#648](https://github.com/apache/doris-flink-connector/pull/648)

### 致谢

@JNSimba

## 26.0.0

### 功能与改进

- 支持 Doris DECIMAL256 类型 [#628](https://github.com/apache/doris-flink-connector/pull/628)
- 支持 ArrayData 中的嵌套类型字段 [#606](https://github.com/apache/doris-flink-connector/pull/606)
- 支持 UTF-8 字符编码的 HTTP 请求 [#623](https://github.com/apache/doris-flink-connector/pull/623)
- 新增可配置的 Thrift 最大消息大小 [#593](https://github.com/apache/doris-flink-connector/pull/593)
- 优化 MongoDB CDC 类型推断，避免不必要的 Decimal 转换 [#596](https://github.com/apache/doris-flink-connector/pull/596)
- 改进 FE 主机无效时的错误提示信息 [#629](https://github.com/apache/doris-flink-connector/pull/629)
- 支持 Flink 2.x [#636](https://github.com/apache/doris-flink-connector/pull/636)

### Bug 修复

- 修复 Group Commit 重试时 Label 被设置的问题 [#635](https://github.com/apache/doris-flink-connector/pull/635)
- 修复批量 Stream Load 处理没有行分隔符的类型时的问题 [#619](https://github.com/apache/doris-flink-connector/pull/619)
- 修复 Doris 字段默认值为空字符串时生成错误 DDL 的问题 [#600](https://github.com/apache/doris-flink-connector/pull/600)
- 修复 BackendClient 中可能影响 Arrow Flight 读取的拼写错误 [#622](https://github.com/apache/doris-flink-connector/pull/622)

### 致谢

@QuakeWang @JNSimba @jqcc @potterhe @kwonder0926 @gnehil @keytouch @AlexRiedler

## 25.1.0

### 功能与改进

- 分库分表场景下自动创建新的同步表 [#564](https://github.com/apache/doris-flink-connector/pull/564)
- DorisSource 默认使用 ArrowFlightSQL 读取 [#574](https://github.com/apache/doris-flink-connector/pull/574)
- 新增集成测试和端到端测试 [#569](https://github.com/apache/doris-flink-connector/pull/569) [#577](https://github.com/apache/doris-flink-connector/pull/577) [#580](https://github.com/apache/doris-flink-connector/pull/580)
- 兼容 Doris 2.1.3 之后的 IP 类型读取 [#576](https://github.com/apache/doris-flink-connector/pull/576)
- 新增发布脚本 [#567](https://github.com/apache/doris-flink-connector/pull/567)
- 增加批处理模式下的重试间隔 [#579](https://github.com/apache/doris-flink-connector/pull/579)
- MongoDB CDC 同步自动创建新表 [#573](https://github.com/apache/doris-flink-connector/pull/573)
- 新增使用示例 [#589](https://github.com/apache/doris-flink-connector/pull/589)

### Bug 修复

- 修复 Stream Load 线程异常退出后 Flink 任务卡住的问题 [#578](https://github.com/apache/doris-flink-connector/pull/578)
- 修复 PostgreSQL CDC 同步类型转换问题 [#582](https://github.com/apache/doris-flink-connector/pull/582)
- 修复 MongoDB CDC 同步中集合 ObjectId 非 ID 字段的 Schema 长度不匹配问题 [#588](https://github.com/apache/doris-flink-connector/pull/588)

### 致谢

@Aalron @JNSimba @kwonder0926 @vinlee19
