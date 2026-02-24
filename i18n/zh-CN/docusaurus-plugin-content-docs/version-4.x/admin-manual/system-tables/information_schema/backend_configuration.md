---
{
    "title": "backend_configuration",
    "language": "zh-CN",
    "description": "查看所有 Backend 的配置。"
}
---

## 概述

查看所有 Backend 的配置。

## 所属数据库


`information_schema`


## 表信息

| 列名         | 类型          | 说明             |
| ------------ | ------------ | --------------- |
| BE_ID        | bigint       | Be 的 ID        |
| CONFIG_NAME  | varchar(256) | Config 的名称    |
| CONFIG_TYPE  | varchar(256) | Config 的数据类型 |
| CONFIG_VALUE | bigint       | Config 的值      |
| IS_MUTABLE   | bool         | Config 是否可变   |