---
{
    "title": "Release 1.2.8",
    "language": "zh-CN",
    "description": "亲爱的社区小伙伴们，Apache Doris 1.2.8 版本已于 2024 年 3 月 09 日正式与大家见面。该版本对多个功能进行了更新优化，旨在更好地满足用户的需求，欢迎大家下载体验。"
}
---

亲爱的社区小伙伴们，[Apache Doris 1.2.8](https://doris.apache.org/download/) 版本已于 2024 年 3 月 09 日正式与大家见面。该版本对多个功能进行了更新优化，旨在更好地满足用户的需求，欢迎大家下载体验。

**官网下载：** [https://doris.apache.org/download/](https://doris.apache.org/download/)

**GitHub 下载：** [https://github.com/apache/doris/releases](https://github.com/apache/doris/releases)


## 改进和优化
- 修复若干查询执行的问题
- 修复若干 Spark Load 相关的问题
- 修复若干 Parquet/ORC 文件读取的问题。
- 修复 Broker 进行因为 "FileSystem closed" 错误导致运行失败的问题。
- 修复若干 Broker Load 相关的问题。
- 修复若干 CTAS 操作相关的问题。
- 修复若干备份恢复功能相关的问题。
- 修复若干导出（Export/Outfile）相关的问题。
- 修复 `replayEraseTable` 方法导致 FE 无法启动的问题。
- 优化 Iceberg Catalog 元数据缓存的性能。
- Audit Log 中新增 Catalog 列。


