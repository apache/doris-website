---
{
    "title": "workload_policy",
    "language": "zh-CN",
    "description": "记录 Workload Policy 的配置信息"
}
---

## 概述

记录 Workload Policy 的配置信息

## 所属数据库


`information_schema`


## 表信息

| 列名           | 类型         | 说明                                   |
| :------------- | :----------- | :------------------------------------- |
| ID             | bigint       | Workload Policy 的 ID                  |
| NAME           | varchar(256) | Workload Policy 的名字                 |
| CONDITION      | text         | Workload Policy 的 Condition           |
| ACTION         | text         | Workload Policy 的 Action               |
| PRIORITY       | int          | Workload Policy 的优先级               |
| ENABLED        | boolean      | 是否激活 Workload Policy               |
| VERSION        | int          | Workload Policy 的版本                 |
| WORKLOAD_GROUP | text         | 当前 Policy 绑定的 Workload Group 名称 |