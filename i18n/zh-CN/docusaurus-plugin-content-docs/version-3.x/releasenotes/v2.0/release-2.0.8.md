---
{
    "title": "Release 2.0.8",
    "language": "zh-CN",
    "description": "亲爱的社区小伙伴们，Apache Doris 2.0.8 版本已于 2024 年 04 月 09 日正式与大家见面。本次版本中，有 35 位贡献者提交了约 65 个功能改进以及问题修复，进一步提升了系统的稳定性和性能，欢迎大家下载体验。"
}
---

亲爱的社区小伙伴们，[Apache Doris 2.0.8](https://doris.apache.org/download/) 版本已于 2024 年 04 月 09 日正式与大家见面。本次版本中，有 35 位贡献者提交了约 65 个功能改进以及问题修复，进一步提升了系统的稳定性和性能，欢迎大家下载体验。

**官网下载：** [https://doris.apache.org/download/](https://doris.apache.org/download/)

**GitHub 下载：** [https://github.com/apache/doris/releases](https://github.com/apache/doris/releases)

## 1 行为变更

由于 `ADMIN SHOW xx` 语句在 MySQL 8.x jdbc driver 不能执行，所以将名字改成 `SHOW xx`

- https://github.com/apache/doris/pull/29492

```sql
ADMIN SHOW CONFIG -> SHOW CONFIG
ADMIN SHOW REPLICA -> SHOW REPLICA
ADMIN DIAGNOSE TABLET -> SHOW TABLET DIAGNOSIS
ADMIN SHOW TABLET -> SHOW TABLET
```


## 2 新功能

N/A



## 3 改进和优化

- 新优化器支持 TopN 优化中使用倒排索引

- 限制统计信息 STRING 长度为 1024 以控制 BE 内存消耗

- 修复未创建 JDBC Client 时意外关闭的情况

- 接受所有 Iceberg Database，不再做额外的名字检查

- 异步更新外表行数统计，避免同步更新带来的 Cache miss 和 Plan 不稳定

- 简化 Hive 外表的 isSplitable 方法，避免过多的 Hadoop metric



## 4 致谢

924060929,  AcKing-Sam, amorynan, AshinGau, BePPPower, BiteTheDDDDt, ByteYue, cambyzju,  dongsilun, eldenmoon, feiniaofeiafei, gnehil, Jibing-Li, liaoxin01, luwei16,  morningman, morrySnow, mrhhsg, Mryange, nextdreamblue, platoneko,  starocean999, SWJTU-ZhangLei, wuwenchi, xiaokang, xinyiZzz, Yukang-Lian,  Yulei-Yang, zclllyybb, zddr, zhangstar333, zhiqiang-hhhh, ziyanTOP, zy-kkk,  zzzxl1993
