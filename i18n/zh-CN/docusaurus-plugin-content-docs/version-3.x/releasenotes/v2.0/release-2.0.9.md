---
{
    "title": "Release 2.0.9",
    "language": "zh-CN",
    "description": "亲爱的社区小伙伴们，Apache Doris 2.0.9 版本已正式发布。在本次版本中，有 34 位贡献者提交了约 68 个功能改进以及问题修复，欢迎大家下载体验。"
}
---

亲爱的社区小伙伴们，[Apache Doris 2.0.9](https://doris.apache.org/download/) 版本已正式发布。在本次版本中，有 34 位贡献者提交了约 68 个功能改进以及问题修复，欢迎大家下载体验。

**官网下载：** [https://doris.apache.org/download/](https://doris.apache.org/download/)

**GitHub 下载：** [https://github.com/apache/doris/releases](https://github.com/apache/doris/releases)


## 1 行为变更

无

## 2 新功能

- 物化视图的 Key 和 Value 列都允许出现谓词

- 物化视图支持 `bitmap_union(bitmap_from_array())`

- 增加一个 FE 配置强制集群中所有表的 Replicate Allocation

- 新优化器支持日期字面量指定时区

- `MATCH_PHRASE` 全文检索支持 slop 参数指定搜索词之间的距离

## 3 改进和优化

- `first_value` / `last_value` 函数增加第二个参数指定忽略 NULL 值

- `LEAD`/ `LAG` 函数的 Offset 参数可以为 0

- 调整物化视图匹配的顺序优先利用索引和预聚合加速查询

- 优化 TopN 查询 `ORDER BY k LIMIT n` 的性能

- 优化 Meta Cache 的性能

- 为` delete_bitmap get_agg` 函数增加 Profile 便于性能分析

- 增加 FE 参数设置 Autobucket 的最大 Bucket 数

## 4 致谢

adonis0147, airborne12, amorynan, AshinGau, BePPPower, BiteTheDDDDt, CalvinKirs, cambyzju, csun5285, eldenmoon, englefly, feiniaofeiafei, HHoflittlefish777, htyoung, hust-hhb, jackwener, Jibing-Li, kaijchen, kylinmac, liaoxin01, luwei16, morningman, mrhhsg, qidaye, starocean999, SWJTU-ZhangLei, w41ter, xiaokang, xiedeyantu, xy720, zclllyybb, zhangstar333, zhannngchen, zy-kkk, zzzxl1993