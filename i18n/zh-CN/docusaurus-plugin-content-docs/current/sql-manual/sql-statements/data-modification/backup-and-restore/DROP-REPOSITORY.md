---
{
    "title": "DROP REPOSITORY",
    "language": "zh-CN",
    "description": "该语句用于删除一个已创建的仓库。"
}
---

## 描述

该语句用于删除一个已创建的仓库。

## 语法

```sql
DROP REPOSITORY <repo_name>;
```

## 必选参数
**<repo_name>**
> 仓库的唯一名称

## 权限控制
| 权限	          | 对象       | 说明                            |
|:-------------|:---------|:------------------------------|
| ADMIN_PRIV   | 整个集群管理权限 | 仅 root 或 superuser 用户可以创建仓库   |


## 注意事项
- 删除仓库，仅仅是删除该仓库在 Doris 中的映射，不会删除实际的仓库数据。删除后，可以再次通过指定相同的 LOCATION 映射到该仓库。


## 举例
删除名为 example_repo 的仓库：

```sql
DROP REPOSITORY `example_repo`;
```
