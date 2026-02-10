---
{
    "title": "character_sets",
    "language": "zh-CN",
    "description": "查看支持的字符集。此表仅用于兼容 MySQL 行为。并不能真实反映 Doris 所使用的字符集。"
}
---

## 概述

查看支持的字符集。此表仅用于兼容 MySQL 行为。并不能真实反映 Doris 所使用的字符集。

## 所属数据库


`information_schema`


## 表信息

| 列名                 | 类型         | 说明                             |
| :------------------- | :----------- | :------------------------------- |
| CHARACTER_SET_NAME   | varchar(512) | 字符集名称                       |
| DEFAULT_COLLATE_NAME | varchar(64)  | 默认的排序规则名称               |
| DESCRIPTION          | varchar(64)  | 字符集详细描述                   |
| MAXLEN               | bigint       | 字符集中单个字符占用的最大字节数 |