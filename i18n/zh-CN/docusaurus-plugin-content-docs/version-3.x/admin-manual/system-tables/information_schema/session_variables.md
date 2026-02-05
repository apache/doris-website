---
{
    "title": "session_variables",
    "language": "zh-CN",
    "description": "查看会话变量信息。"
}
---

## 概述

查看会话变量信息。

## 所属数据库


`information_schema`


## 表信息

| 列名           | 类型          | 说明                   |
| :------------- | :------------ | :--------------------- |
| VARIABLE_NAME  | varchar(64)   | 变量名称               |
| VARIABLE_VALUE | varchar(1024) | 当前值                 |
| DEFAULT_VALUE  | varchar(1024) | 默认值                 |
| CHANGED        | varchar(4)    | 当前值是否不同于默认值 |