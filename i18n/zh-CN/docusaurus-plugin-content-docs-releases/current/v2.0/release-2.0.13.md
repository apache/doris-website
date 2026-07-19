---
{
    "title": "Release 2.0.13",
    "language": "zh-CN",
    "description": "亲爱的社区小伙伴们，Apache Doris 2.0.13 版本已于 2024 年 7 月 16 日正式与大家见面，该版本提交了 112 个改进项以及问题修复，进一步提升了系统的性能及稳定性，欢迎大家下载体验。"
}
---

亲爱的社区小伙伴们，Apache Doris 2.0.13 版本已于 2024 年 7 月 16 日正式与大家见面，该版本提交了 112 个改进项以及问题修复，进一步提升了系统的性能及稳定性，欢迎大家下载体验。

[快速下载](https://doris.apache.org/download/)

## 行为变更

仅在客户端启用了 `CLIENT_MULTI_STATEMENTS` 设置时，SQL 输入才会被视为多条语句，从而增强了与 MySQL 的兼容性。[#36759](https://github.com/apache/doris/pull/36759)

## 新增功能

- 新增了 BE 配置 `allow_zero_date`，允许使用全零的日期。设置为 `false` 时，`0000-00-00` 会被解析为 `NULL`；设置为 `true` 时，会被解析为 `0000-01-01`。默认值为 `false`，以保持与之前行为的一致性。[#34961](https://github.com/apache/doris/pull/34961)

- `LogicalWindow` 和 `LogicalPartitionTopN` 现在支持多字段谓词下推，以提升性能。[#36828](https://github.com/apache/doris/pull/36828)

- ES Catalog 现在将 ES 的 `nested` 或 `object` 类型映射到 Doris 的 `JSON` 类型。[#37101](https://github.com/apache/doris/pull/37101)

## 改进和优化

- `LIMIT` 查询现在会更早地停止读取数据，以减少资源消耗并提升性能。[#36535](https://github.com/apache/doris/pull/36535)

- 现在支持具有空键的特殊 JSON 数据。[#36762](https://github.com/apache/doris/pull/36762)

- 改进了 Routine Load 的稳定性和可用性，包括负载均衡、自动恢复、异常处理以及更友好的错误消息。[#36450](https://github.com/apache/doris/pull/36450) [#35376](https://github.com/apache/doris/pull/35376) [#35266](https://github.com/apache/doris/pull/35266) [#33372](https://github.com/apache/doris/pull/33372) [#32282](https://github.com/apache/doris/pull/32282) [#32046](https://github.com/apache/doris/pull/32046) [#32021](https://github.com/apache/doris/pull/32021) [#31846](https://github.com/apache/doris/pull/31846) [#31273](https://github.com/apache/doris/pull/31273)

- 对 BE 的硬盘选择策略和速度进行了优化。[#36826](https://github.com/apache/doris/pull/36826) [#36795](https://github.com/apache/doris/pull/36795) [#36509](https://github.com/apache/doris/pull/36509)

- 改进了 JDBC Catalog 的稳定性和可用性，包括加密、线程池连接数配置以及更友好的错误消息。[#36940](https://github.com/apache/doris/pull/36940) [#36720](https://github.com/apache/doris/pull/36720) [#30880](https://github.com/apache/doris/pull/30880) [#35692](https://github.com/apache/doris/pull/35692)

## 致谢

@DarvenDuan、@Gabriel39、@Jibing-Li、@Johnnyssc、@Lchangliang、@LiBinfeng-01、@SWJTU-ZhangLei、@Thearas、@Yukang-Lian、@Yulei-Yang、@airborne12、@amorynan、@bobhan1、@cambyzju、@csun5285、@dataroaring、@deardeng、@eldenmoon、@englefly、@feiniaofeiafei、@hello-stephen、@jacktengg、@kaijchen、@liutang123、@luwei16、@morningman、@morrySnow、@mrhhsg、@mymeiyi、@platoneko、@qidaye、@sollhui、@starocean999、@w41ter、@xiaokang、@xy720、@yujun777、@zclllyybb