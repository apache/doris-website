---
{
    "title": "概述",
    "language": "zh-CN",
    "description": "Doris 集群内置多个系统数据库，用于存储 Doris 系统本身的一些元数据信息。"
}
---

Doris 集群内置多个系统数据库，用于存储 Doris 系统本身的一些元数据信息。

## information_schema

`information_schema` 库下的所有表都是虚拟表，本身并不存在物理实体。这些系统表包含了关于 Doris 集群及其所有数据库对象的元数据。这些对象包括数据库、表、列、权限等。
也包含如 Workload Group、Task 等功能状态信息。

每个 Catalog 下都存在一个 `information_schema` 库。其中只包含对应 Catalog 下的库表的元数据。

`information_schema` 库中得所有表都是只读状态，用户无法在这个库中修改、删除或创建表。

所有用户默认对这个库下的所有表拥有读权限，但可查询的内容会根据用户实际的权限范围而不同。比如用户 A 只拥有 `db1.table1` 的权限。则用户查询 `information_schema.tables` 表时，只会返回 `db1.table1` 相关的信息。


## mysql

`mysql` 库下的所有表都是虚拟表，本身并不存在物理实体。这些系统表包含如权限等信息，主要用于兼容 MySQL 生态。

每个 Catalog 下都存在一个 `mysql` 库。但其中的表的内容完全一样。

`mysql` 库中得所有表都是只读状态，用户无法在这个库中修改、删除或创建表。

## __internal_schema

`__internal_schema` 库下的所有表都是 Doris 的实体表，其存储方式和用户创建的数据表无异。
Doris 会在集群创建时，自动创建这个库下的所有系统表。

默认情况下，普通用户对这个库下的表拥有只读权限。但被授权后，可以对这个库下的表进行修改、删除或创建。

