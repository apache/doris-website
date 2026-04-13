---
{
    "title": "Release 2.0.11",
    "language": "zh-CN",
    "description": "亲爱的社区小伙伴们，Apache Doris 2.0.11 版本已于 2024 年 6 月 5 日正式与大家见面，该版本提交了 123 个改进项以及问题修复，欢迎大家下载体验。"
}
---

亲爱的社区小伙伴们，[Apache Doris 2.0.11](https://doris.apache.org/download/) 版本已于 2024 年 6 月 5 日正式与大家见面，该版本提交了 123 个改进项以及问题修复，欢迎大家下载体验。

**官网下载：** [https://doris.apache.org/download/](https://doris.apache.org/download/)

**GitHub 下载：** [https://github.com/apache/doris/releases](https://github.com/apache/doris/releases)



## 1 行为变更

由于倒排索引已经成熟稳定，可以替换老的 `BITMAP INDEX`，因此后续新建 `BITMAP INDEX` 会自动切换成 `INVERTED INDEX`，而已经创建的 `BITMAP INDEX` 保持不变。整个切换过程对用户无感知，写入和查询没有变化，此外用户可以修改 FE 配置 `enable_create_bitmap_index_as_inverted_index = false` 来关闭该自动切换。[#35528](https://github.com/apache/doris/pull/35528)



## 2 改进和优化

- 为 JSON 和 TIME 添加 Trino JDBC Catalog 类型映射。

- 在无法转移到（非）主节点时，FE 退出以防止未知状态和过多日志。

- 在删除统计表时写入审计日志。

- 如果表只进行了部分分析，忽略最小/最大列统计以避免低效的查询计划。

- 支持集合操作减法，例如 `set1 - set2`。

- 使用 concat(col, pattern_str) 改进 LIKE 和 REGEXP 子句的性能，例如：`col1 LIKE concat('%', col2, '%')`。

- 添加查询选项以支持短路查询，保证升级兼容性。



## 3 致谢 

@924060929、@airborne12、@AshinGau、@BePPPower、@BiteTheDDDDt、@ByteYue、@CalvinKirs、@cambyzju、@csun5285、@dataroaring、@eldenmoon、@englefly、@feiniaofeiafei、@Gabriel39、@GoGoWen、@HHoflittlefish777、@hubgeter、@jacktengg、@jackwener、@jeffreys-cat、@Jibing-Li、@kaka11chen、@kobe6th、@LiBinfeng-01、@mongo360、@morningman、@morrySnow、@mrhhsg、@Mryange、@nextdreamblue、@qidaye、@sjyango、@starocean999、@SWJTU-ZhangLei、@w41ter、@wangbo、@wsjz、@wuwenchi、@xiaokang、@XieJiann、@xy720、@yujun777、@Yukang-Lian、@Yulei-Yang、@zclllyybb、@zddr、@zhangstar333、@zhiqiang-hhhh、@zy-kkk、@zzzxl1993