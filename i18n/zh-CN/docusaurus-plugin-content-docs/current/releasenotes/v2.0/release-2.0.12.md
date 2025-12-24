---
{
    "title": "Release 2.0.12",
    "language": "zh-CN",
    "description": "亲爱的社区小伙伴们，Apache Doris 2.0.12 版本已于 2024 年 6 月 27 日正式与大家见面，该版本提交了 99 个改进项以及问题修复，欢迎大家下载体验。"
}
---

亲爱的社区小伙伴们，[Apache Doris 2.0.12](https://doris.apache.org/download/) 版本已于 2024 年 6 月 27 日正式与大家见面，该版本提交了 99 个改进项以及问题修复，欢迎大家下载体验。

**官网下载：** https://doris.apache.org/download/

**GitHub 下载：** https://github.com/apache/doris/releases

## 行为变更

- 不再将建表的默认注释设置为表的类型，而是改成默认为空，比如 COMMENT 'OLAP' 变成 COMMENT ''，这样对于依赖注释的 BI 软件更加友好。 [#35855](https://github.com/apache/doris/pull/35855)

- 将 `@@autocommit` 变量的类型从 `BOOLEAN` 改成 `BIGINT`，以免有些 MySQL 客户端（比如.NET MySQL.Data）报错。 [#33282](https://github.com/apache/doris/pull/33282)


## 改进优化

- 删除 `disable_nested_complex_type` 参数，默认允许创建嵌套的 `ARRAY` `MAP` `STRUCT` 类型。[#36255](https://github.com/apache/doris/pull/36255)

- HMS Catalog 支持 `SHOW CREATE DATABASE` 命令。[ #28145](https://github.com/apache/doris/pull/28145)

- 在 Query Profile 中增加更多倒排索引的指标。[#36545](https://github.com/apache/doris/pull/36545)

- 跨集群数据复制（CCR）支持倒排索引 [#31743](https://github.com/apache/doris/pull/31743)

## 致谢

@amorynan、@BiteTheDDDDt、@cambyzju、@caoliang-web、@dataroaring、@eldenmoon、@feiniaofeiafei、@felixwluo、@gavinchou、@HappenLee、@hello-stephen、@jacktengg、@Jibing-Li、@Johnnyssc、@liaoxin01、@LiBinfeng-01、@luwei16、@mongo360、@morningman、@morrySnow、@mrhhsg、@Mryange、@mymeiyi、@qidaye、@qzsee、@starocean999、@w41ter、@wangbo、@wsjz、@wuwenchi、@xiaokang、@XuPengfei-1020、@xy720、@yongjinhou、@yujun777、@Yukang-Lian、@Yulei-Yang、@zclllyybb、@zddr、@zhannngchen、@zhiqiang-hhhh、@zy-kkk、@zzzxl1993