---
{
    "title": "SHOW CREATE REPOSITORY",
    "language": "zh-CN",
    "description": "该语句用于展示仓库的创建语句。"
}
---

## 描述

该语句用于展示仓库的创建语句。

## 语法

```sql
SHOW CREATE REPOSITORY for <repo_name>;
```

## 必选参数
**<repo_name>**
> 仓库的唯一名称

## 示例

展示指定仓库的创建语句

```sql
SHOW CREATE REPOSITORY for example_repo;
```