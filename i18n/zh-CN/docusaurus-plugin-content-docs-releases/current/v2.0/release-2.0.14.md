---
{
    "title": "Release 2.0.14",
    "language": "zh-CN",
    "description": "亲爱的社区小伙伴们，Apache Doris 2.0.14 版本已于 2024 年 8 月 6 日正式与大家见面，该版本提交了 110 个改进项以及问题修复，进一步提升了系统的性能及稳定性，欢迎大家下载体验。"
}
---

亲爱的社区小伙伴们，Apache Doris 2.0.14 版本已于 2024 年 8 月 6 日正式与大家见面，该版本提交了 110 个改进项以及问题修复，进一步提升了系统的性能及稳定性，欢迎大家下载体验。


## 1 新功能

- 增加获取最近一个查询 Profile 的 REST 接口 `curl http://user:password@127.0.0.1:8030/api/profile/text` 。[#38268](https://github.com/apache/doris/pull/38268)

## 2 改进和优化

- 优化 MOW 表带有 Sequence 列的主键点查性能。[#38287](https://github.com/apache/doris/pull/38287)

- 优化倒排索引在查询条件很多时的性能。[#35346](https://github.com/apache/doris/pull/35346)

- 创建带分词的倒排索引时，自动开启 `support_phrase` 选项加速 `match_phrase` 系列短语查询。[#37949](https://github.com/apache/doris/pull/37949)

- 支持简化的 SQL Hint，例如 `SELECT /*+ query_timeout(3000) */ * FROM t;`。[#37720](https://github.com/apache/doris/pull/37720)

- 读对象存储遇到 429 错误时自动重试提升稳定性。[#35396](https://github.com/apache/doris/pull/35396)

- LEFT SEMI / ANTI JOIN 在匹配到符合的数据行时，终止后续的匹配执行提升性能。[#34703](https://github.com/apache/doris/pull/34703)

- 避免非法数据返回 MySQL 结果时出发 coredump。[#28069](https://github.com/apache/doris/pull/28069)

- 输出类型名字时统一使用小写，保持跟 MySQL 兼容对 BI 工具更加友好。[#38521](https://github.com/apache/doris/pull/38521)


## 致谢

@924060929、@BiteTheDDDDt、@ByteYue、@CalvinKirs、@GoGoWen、@HappenLee、@Jibing-Li、@Lchangliang、@LiBinfeng-01、@Mryange、@XieJiann、@Yukang-Lian、@Yulei-Yang、@airborne12、@amorynan、@biohazard4321、@cambyzju、@csun5285、@eldenmoon、@englefly、@freemandealer、@hello-stephen、@hubgeter、@kaijchen、@liaoxin01、@luwei16、@morningman、@morrySnow、@mymeiyi、@qidaye、@sollhui、@starocean999、@w41ter、@wuwenchi、@xiaokang、@xy720、@yujun777、@zclllyybb、@zddr、@zhangstar333、@zhiqiang-hhhh、@zy-kkk、@zzzxl1993