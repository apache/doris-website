---
{
    "title": "collations",
    "language": "zh-CN",
    "description": "查看所有字符集的排序方法。此表仅用于兼容 MySQL 行为。没有实际的意义。不能真实反映 Doris 所使用的字符排序方法。"
}
---

## 概述

查看所有字符集的排序方法。此表仅用于兼容 MySQL 行为。没有实际的意义。不能真实反映 Doris 所使用的字符排序方法。

## 所属数据库


`information_schema`


## 表信息

| 列名               | 类型         | 说明                             |
| :----------------- | :----------- | :------------------------------- |
| COLLATION_NAME     | varchar(512) | 字符集排序方法名称               |
| CHARACTER_SET_NAME | varchar(64)  | 所属的字符集名称                 |
| ID                 | bigint       | 排序方法 ID                      |
| IS_DEFAULT         | varchar(64)  | 是否为当前默认的排序方法。       |
| IS_COMPILED        | varchar(64)  | 是否编译到服务中                 |
| SORTLEN            | bigint       | 与使用此种排序算法使用的内存相关 |