---
{
    "title": "Release 1.2.7",
    "language": "zh-CN",
    "description": "-添加了 havequerycache 变量以保证与 MySQL 生态系统兼容。 -添加 enablestrong consistencyread 以支持会话之间的强一致性读取。 -FE 指标支持用户级的查询计数器。"
}
---

# Bugfix

- 修复了一些查询问题。
- 修复了一些存储问题。
- 修复一些小数精度问题。
- 修复由无效的 sql_select_limit 会话变量值引起的查询错误。
- 修复了无法使用 hdfs 短路读取的问题。
- 修复了腾讯云 cosn 无法访问的问题。
- 修复了一些 Hive Catalog kerberos 访问的问题。
- 修复 Stream load Profile 无法使用的问题。
- 修复 Promethus 监控参数格式问题。
- 修复了创建大量 Tablet 时建表超时的问题。


# 最新特性

- Unique Key 模型支持将数组类型作为 Key 列；
-添加了 have_query_cache 变量以保证与 MySQL 生态系统兼容。
-添加 enable_strong _consistency_read 以支持会话之间的强一致性读取。
-FE 指标支持用户级的查询计数器。