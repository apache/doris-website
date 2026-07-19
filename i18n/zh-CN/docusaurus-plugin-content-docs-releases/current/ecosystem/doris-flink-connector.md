---
{
    "title": "Doris Flink Connector",
    "language": "zh-CN",
    "description": "Doris Flink Connector 版本发布说明。"
}
---

# Doris Flink Connector

本文按版本倒序列出 Doris Flink Connector 的版本发布说明。

## 26.1.1

来源：[Release Note 26.1.1](https://github.com/apache/doris-flink-connector/issues/654)

### Bug 修复

- 修复启用压缩后，批量 Sink 长时间运行时可能卡住的问题。[#653](https://github.com/apache/doris-flink-connector/pull/653)

### 致谢

- @addu390

## 26.1.0

来源：[Release Note 26.1.0](https://github.com/apache/doris-flink-connector/issues/649)

### 功能与改进

- Stream Load 默认启用 gzip 压缩。[#648](https://github.com/apache/doris-flink-connector/pull/648)

### 致谢

- @JNSimba

## 26.0.0

来源：[Release Note 26.0.0](https://github.com/apache/doris-flink-connector/issues/637)

### 功能与改进

- 支持 Doris `DECIMAL256` 类型。[#628](https://github.com/apache/doris-flink-connector/pull/628)
- 支持 `ArrayData` 中的嵌套类型字段。[#606](https://github.com/apache/doris-flink-connector/pull/606)
- 支持带 UTF-8 字符集编码的 HTTP 请求。[#623](https://github.com/apache/doris-flink-connector/pull/623)
- 增加可配置的 Thrift 最大消息大小。[#593](https://github.com/apache/doris-flink-connector/pull/593)
- 优化 MongoDB CDC 类型推断，避免不必要的 decimal 转换。[#596](https://github.com/apache/doris-flink-connector/pull/596)
- 改进 FE host 无效时的错误信息。[#629](https://github.com/apache/doris-flink-connector/pull/629)
- 支持 Flink 2.x。[#636](https://github.com/apache/doris-flink-connector/pull/636)

### Bug 修复

- 修复 group commit 重试时 label 处理的问题。[#635](https://github.com/apache/doris-flink-connector/pull/635)
- 修复没有行分隔符的类型在 batch Stream Load 中的处理问题。[#619](https://github.com/apache/doris-flink-connector/pull/619)
- 修复 Doris 字段默认值为空字符串时 DDL 生成不正确的问题。[#600](https://github.com/apache/doris-flink-connector/pull/600)
- 修复 `BackendClient` 中可能影响 Arrow Flight 读取的拼写错误。[#622](https://github.com/apache/doris-flink-connector/pull/622)

### 致谢

- @QuakeWang
- @JNSimba
- @jqcc
- @potterhe
- @kwonder0926
- @gnehil
- @keytouch
- @AlexRiedler

## 25.1.0

来源：[Release Note 25.1.0](https://github.com/apache/doris-flink-connector/issues/590)

### 功能与改进

- 在分库分表场景中自动创建新的同步表。[#564](https://github.com/apache/doris-flink-connector/pull/564)
- Doris Source 默认使用 Arrow Flight SQL 读取。[#574](https://github.com/apache/doris-flink-connector/pull/574)
- 增加集成测试和端到端测试用例。[#569](https://github.com/apache/doris-flink-connector/pull/569) [#577](https://github.com/apache/doris-flink-connector/pull/577) [#580](https://github.com/apache/doris-flink-connector/pull/580)
- 兼容 Doris 2.1.3 及之后版本的 IP 类型读取。[#576](https://github.com/apache/doris-flink-connector/pull/576)
- 增加发布脚本。[#567](https://github.com/apache/doris-flink-connector/pull/567)
- 增加 batch mode 的重试间隔。[#579](https://github.com/apache/doris-flink-connector/pull/579)
- 在 MongoDB CDC 同步中自动创建新表。[#573](https://github.com/apache/doris-flink-connector/pull/573)
- 增加使用示例。[#589](https://github.com/apache/doris-flink-connector/pull/589)

### Bug 修复

- 修复 Stream Load 线程异常退出后 Flink 任务可能卡住的问题。[#578](https://github.com/apache/doris-flink-connector/pull/578)
- 修复 PostgreSQL CDC 同步中的类型转换问题。[#582](https://github.com/apache/doris-flink-connector/pull/582)
- 修复 MongoDB CDC 同步中非 `_id` ObjectId 字段的 schema 长度不匹配问题。[#588](https://github.com/apache/doris-flink-connector/pull/588)

### 致谢

- @Aalron
- @JNSimba
- @kwonder0926
- @vinlee19

## 25.0.0

来源：[Release Note 25.0.0](https://github.com/apache/doris-flink-connector/issues/562)

### 功能与改进

- 支持通过 Arrow Flight SQL 读取 catalog table。[#530](https://github.com/apache/doris-flink-connector/pull/530)
- 支持 `INSERT OVERWRITE`。[#544](https://github.com/apache/doris-flink-connector/pull/544)
- 支持 partial limit pushdown。[#553](https://github.com/apache/doris-flink-connector/pull/553)
- 下推时拼接 `doris.filter.query` 选项。[#552](https://github.com/apache/doris-flink-connector/pull/552)
- 兼容 FE API 变化，支持配置需要忽略的响应字段。[#549](https://github.com/apache/doris-flink-connector/pull/549)
- 优化 MongoDB CDC `sampleSize` 计算逻辑。[#542](https://github.com/apache/doris-flink-connector/pull/542)
- 忽略 MongoDB schema change 失败。[#537](https://github.com/apache/doris-flink-connector/pull/537)
- 为 lookup query 和 Arrow Flight query 增加前缀。[#531](https://github.com/apache/doris-flink-connector/pull/531) [#530](https://github.com/apache/doris-flink-connector/pull/530)

### Bug 修复

- 修复极端情况下写入错误可能绕过 checkpoint 的问题。[#560](https://github.com/apache/doris-flink-connector/pull/560) [#555](https://github.com/apache/doris-flink-connector/pull/555)
- 修复发生 HTTP 错误时写入可能卡住的问题。[#539](https://github.com/apache/doris-flink-connector/pull/539)
- 修复 MongoDB timestamp 和 array 类型解析问题。[#547](https://github.com/apache/doris-flink-connector/pull/547)
- 修复同步大量表时出现 ORA-12733 的问题。[#532](https://github.com/apache/doris-flink-connector/pull/532)
- 修复 timestamp format pushdown 错误。[#528](https://github.com/apache/doris-flink-connector/pull/528)
- 修复 SQL parser schema table 注释和字段类型解析不准确的问题。[#540](https://github.com/apache/doris-flink-connector/pull/540)
- 修复 `Transfer-Encoding` header already present 错误。[#525](https://github.com/apache/doris-flink-connector/pull/525)
- 修复多数据库同步中的空指针异常。[#534](https://github.com/apache/doris-flink-connector/pull/534)

### 致谢

- @awol2005ex
- @DongLiang-0
- @JNSimba
- @nativeCat
- @vinlee19
- @xuqinghuang
