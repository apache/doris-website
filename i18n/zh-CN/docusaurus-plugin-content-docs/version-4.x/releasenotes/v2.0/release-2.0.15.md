---
{
    "title": "Release 2.0.15",
    "language": "zh-CN",
    "description": "亲爱的社区小伙伴们，Apache Doris 2.0.15 版本已于 2024 年 9 月 30 日正式与大家见面，该版本提交了 157 个改进项以及问题修复，进一步提升了系统的性能及稳定性，欢迎大家下载体验。"
}
---

亲爱的社区小伙伴们，Apache Doris 2.0.15 版本已于 2024 年 9 月 30 日正式与大家见面，该版本提交了 157 个改进项以及问题修复，进一步提升了系统的性能及稳定性，欢迎大家下载体验。

- 立即下载：https://doris.apache.org/download

- GitHub 下载：https://github.com/apache/doris/releases/tag/2.0.15


## 行为变更

无

## 新功能

- 恢复功能现在支持删除冗余的表块和分区选项。[#39028](https://github.com/apache/doris/pull/39028)

- 支持 JSON 函数 `json_search`。[#40948](https://github.com/apache/doris/pull/40948)

## 改进与优化

### 稳定性

- 添加了 FE 配置 `abort_txn_after_lost_heartbeat_time_second`，用于设置事务中止时间。[#28662](https://github.com/apache/doris/pull/28662)

- BE 失去心跳信号超过 1 分钟后中止事务，而不是 5 秒，以避免事务中止过于敏感。[#22781](https://github.com/apache/doris/pull/22781)

- 延迟调度例行加载的 EOF 任务，以避免过多的小事务。[#39975](https://github.com/apache/doris/pull/39975)

- 优先从在线磁盘服务进行查询，以提高稳健性。[#39467](https://github.com/apache/doris/pull/39467)

- 在非严格模式的部分更新中，如果行的删除标志已标记，则跳过检查新插入的行。[#40322](https://github.com/apache/doris/pull/40322)

- 为防止 FE 内存不足，限制备份任务中的表块数量，默认值为 300,000。[#39987](https://github.com/apache/doris/pull/39987)

- ARRAY MAP STRUCT 类型支持 `REPLACE_IF_NOT_NULL`。[#38304](https://github.com/apache/doris/pull/38304)

- 对非 `DELETE_INVALID_XXX `失败的删除作业进行重试。[#37834](https://github.com/apache/doris/pull/37834)

### 查询性能

- 优化由并发列更新和 compaction 引起的慢速列更新问题。[#38487](https://github.com/apache/doris/pull/38487)

- 当过滤条件中存在 NullLiteral 时，可以将其折叠为 false 并进一步转换为 EmptySet，以减少不必要的数据扫描和计算。[#38135](https://github.com/apache/doris/pull/38135)

- 提高 `ORDER BY` 全排序的性能。[#38985](https://github.com/apache/doris/pull/38985)

- 提高倒排索引中字符串处理的性能。[#37395](https://github.com/apache/doris/pull/37395)

### 查询优化器

- 增加了对以分号开头的语句的支持以兼容老优化器。[#39399](https://github.com/apache/doris/pull/39399)

- 完善了一些聚合函数签名匹配。[#39352](https://github.com/apache/doris/pull/39352)

- 在 Schema 变更后删除列统计信息并触发自动分析。[#39101](https://github.com/apache/doris/pull/39101)

- 支持使用 `DROP CACHED STATS table_name` 删除缓存的统计信息。[#39367](https://github.com/apache/doris/pull/39367)

### Multi Catalog

- 优化 JDBC Catalog 刷新，减少客户端创建频率。[#40261](https://github.com/apache/doris/pull/40261)

- 修复 JDBC Catalog 在某些条件下存在的线程泄漏问题。[#39423](https://github.com/apache/doris/pull/39423) 

**致谢**

@924060929、@BePPPower、@BiteTheDDDDt、@CalvinKirs、@GoGoWen、@HappenLee、@Jibing-Li、@Johnnyssc、@LiBinfeng-01、@Mryange、@SWJTU-ZhangLei、@TangSiyang2001、@Toms1999、@Vallishp、@Yukang-Lian、@airborne12、@amorynan、@bobhan1、@cambyzju、@csun5285、@dataroaring、@eldenmoon、@englefly、@feiniaofeiafei、@hello-stephen、@htyoung、@hubgeter、@justfortaste、@liaoxin01、@liugddx、@liutang123、@luwei16、@mongo360、@morrySnow、@qidaye、@smallx、@sollhui、@starocean999、@w41ter、@xiaokang、@xzj7019、@yujun777、@zclllyybb、@zddr、@zhangstar333、@zhannngchen、@zy-kkk、@zzzxl1993