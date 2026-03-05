---
{
    "title": "DROP STORAGE POLICY",
    "language": "zh-CN",
    "toc_min_heading_level": 2,
    "toc_max_heading_level": 4,
    "description": "删除存储策略。存储策略的详细说明，请参阅“存储策略”章节。"
}
---

## 描述

删除存储策略。存储策略的详细说明，请参阅“存储策略”章节。

## 语法

```sql
DROP STORAGE POLICY <policy_name>
```

## 必选参数

**<policy_name>**

> 存储策略名称

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object） | 说明（Notes） |
| :---------------- | :------------- | :------------ |
| ADMIN_PRIV        | 全局           |               |

## 示例

1. 删除名字为 policy1 的存储策略

```sql
DROP STORAGE POLICY policy1
```