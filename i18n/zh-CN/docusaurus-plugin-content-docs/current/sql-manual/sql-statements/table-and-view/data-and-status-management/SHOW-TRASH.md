---
{
    "title": "SHOW TRASH",
    "language": "zh-CN",
    "description": "该语句用于查看 backend 内的垃圾数据占用空间。"
}
---

## 描述

该语句用于查看 backend 内的垃圾数据占用空间。

## 语法：

```sql
SHOW TRASH [ON ("<be_host>:<be_heartbeat_port>" [, ...])];
```

## 可选参数

**1. `[ON ("<be_host>:<be_heartbeat_port>" [, ...])]`**

指定需要查看的 backend。如果不加 ON，默认查看所有 backend。


## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege）  | 对象（Object） | 说明（Notes）                                        |
| :--------- | :----- | :------------------------------------------- |
| ADMIN_PRIV 或 NODE_PRIV | 用户（User）或 角色（Role）  | 用户或者角色拥有 ADMIN_PRIV 或 NODE_PRIV 权限才能进行 SHOW TRASH 操作 |

## 示例

1. 查看所有 be 节点的垃圾数据占用空间。


```sql
SHOW TRASH;
```

2. 查看'192.168.0.1:9050'的垃圾数据占用空间 (会显示具体磁盘信息)。


```sql
SHOW TRASH ON "192.168.0.1:9050";
```