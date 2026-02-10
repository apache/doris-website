---
{
    "title": "global_variables",
    "language": "zh-CN",
    "description": "查看全局变量"
}
---

## 概述

查看全局变量

## 所属数据库


`information_schema`


## 表信息

| 列名           | 类型          | 说明             |
| :------------- | :------------ | :--------------- |
| VARIABLE_NAME  | varchar(64)   | 变量名           |
| VARIABLE_VALUE | varchar(1024) | 当前值           |
| DEFAULT_VALUE  | varchar(1024) | 默认值           |
| CHANGED        | varchar(4)    | 是否不同于默认值 |