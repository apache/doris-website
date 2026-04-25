---
{
    "title": "ADMIN CLEAN TRASH",
    "language": "zh-CN",
    "description": "该语句用于清理 backend 内的垃圾数据。"
}
---

## 描述

该语句用于清理 backend 内的垃圾数据。

## 语法

```sql
ADMIN CLEAN TRASH [ON ("<be_host>:<be_heartbeat_port>" [, ...])];
```

## 可选参数

**1. `[ON ("<be_host>:<be_heartbeat_port>" [, ...])]`**

指定需要清理的 backend。如果不加 ON，默认清理所有 backend。

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：


| 权限（Privilege）  | 对象（Object） | 说明（Notes）                                        |
| :--------- | :----- | :------------------------------------------- |
| ADMIN_PRIV | 用户（User）或 角色（Role）  | 用户或者角色拥有 ADMIN_PRIV 权限才能进行 CLEAN TRASH 操作 |


## 示例

```sql
-- 清理所有 be 节点的垃圾数据。
ADMIN CLEAN TRASH;
```

```sql
-- 清理'192.168.0.1:9050'和'192.168.0.2:9050'的垃圾数据。
ADMIN CLEAN TRASH ON ("192.168.0.1:9050", "192.168.0.2:9050");
```