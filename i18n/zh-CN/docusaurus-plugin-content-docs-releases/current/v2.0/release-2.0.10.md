---
{
    "title": "Release 2.0.10",
    "language": "zh-CN",
    "description": "亲爱的社区小伙伴们，Apache Doris 2.0.10 版本已于 2024 年 5 月 16 日正式与大家见面，该版本提交了 83 个改进项以及问题修复，进一步提升了系统的性能及稳定性，欢迎大家下载体验。"
}
---

亲爱的社区小伙伴们，**[Apache Doris 2.0.10](https://doris.apache.org/download/) 版本已于 2024 年 5 月 16 日正式与大家见面**，该版本提交了 83 个改进项以及问题修复，进一步提升了系统的性能及稳定性，欢迎大家下载体验。

**官网下载：** [https://doris.apache.org/download/](https://doris.apache.org/download/)

**GitHub 下载：** [https://github.com/apache/doris/releases](https://github.com/apache/doris/releases)


## 改进和优化

- 增加了`read_only`和`super_read_only`变量以保持和 MySQL 兼容

- 仅在 IO_ERROR 的错误才把数据目录加入 Broken List，防止 fd 超限等错误导致误加入

- 基于外表 CTAS 创建新表时，把 `VARCHAR` 类型转成 `STRING` 类型

- 支持把 Paimon 的 `ROW` 类型映射成 Doris 的 `STRUCT` 类型

- 在创建 Tablet 选择数据盘时，允许存在少量的倾斜

- 对 `set replica drop` 命令记录 Editlog，以防止在 Follower 节点执行命令后，其状态显示不正确

- Schema Change 内存自适应避免内存超限

- 倒排索引中 Unicode 分词器可以配置不使用停用词


## 致谢

@airborne12, @BePPPower, @ByteYue, @CalvinKirs, @cambyzju, @csun5285, @dataroaring, @deardeng, @DongLiang-0, @eldenmoon, @felixwluo, @HappenLee, @hubgeter, @jackwener, @kaijchen, @kaka11chen, @Lchangliang, @liaoxin01, @LiBinfeng-01, @luennng, @morningman, @morrySnow, @Mryange, @nextdreamblue, @qidaye, @starocean999, @suxiaogang223, @SWJTU-ZhangLei, @w41ter, @xiaokang, @xy720, @yujun777, @Yukang-Lian, @zhangstar333, @zxealous, @zy-kkk, @zzzxl1993