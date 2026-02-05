---
{
    "title": "ALTER COLOCATE GROUP",
    "language": "zh-CN",
    "description": "该语句用于修改 Colocation Group 的属性。"
}
---

## 描述

该语句用于修改 Colocation Group 的属性。

## 语法

```sql
ALTER COLOCATE GROUP  [ <database>. ] <group_name>
SET (
    <property_list>
    );
```
## 必选参数

**1. `<group_name>`**

指定要修改的 colocate group 的名称。

**2.`<property_list>`**

`property_list` 是 `colocation group` 属性，目前只支持修改 `replication_num` 和 `replication_allocation`。
修改 `colocation group` 的这两个属性修改之后，同时把该 group 的表的属性 `default.replication_allocation` 、
属性 `dynamic.replication_allocation `、以及已有分区的 `replication_allocation`改成跟它一样。

## 可选参数
**1. `<database>`**

指定要修改的 `colocate group` 的所属数据库。

注意：
1. 如果 `colocate group` 是全局的，即它的名称是以 `__global__` 开头的，那它不属于任何一个 Database；

## 返回值
无。

## 权限控制
需要 `ADMIN` 的权限。

## 示例

1. 修改一个全局 group 的副本数，建表时设置 `"colocate_with" = "__global__foo"`

```sql
ALTER COLOCATE GROUP __global__foo
SET (
    "replication_num"="1"
    );
```

2. 修改一个非全局 group 的副本数，建表时设置 "colocate_with" = "bar"，且表属于 Database example_db
 ```sql 
ALTER COLOCATE GROUP example_db.bar
SET (
    "replication_num"="1"
    );
```