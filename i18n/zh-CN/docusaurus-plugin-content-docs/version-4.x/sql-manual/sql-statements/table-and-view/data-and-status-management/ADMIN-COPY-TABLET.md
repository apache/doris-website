---
{
    "title": "ADMIN COPY TABLET",
    "language": "zh-CN",
    "description": "该语句用于为指定的 tablet 制作快照，主要用于本地加载 tablet 来复现问题。"
}
---

## 描述

该语句用于为指定的 tablet 制作快照，主要用于本地加载 tablet 来复现问题。

## 语法

```sql
ADMIN COPY TABLET <tablet_id> PROPERTIES ("<key>"="<value>" [,...]).
```

## 必选参数

**1. `<tablet_id>`**

要复制的 tablet 的 ID。

## 可选参数

  ```sql
  [ PROPERTIES ("<key>"="<value>" [, ... ]) ]
  ```

PROPERTIES 子句允许指定附加参数：

**1. `<backend_id>`**

指定副本所在的 BE 节点 ID。如果未指定，则随机选择一个副本。

**2. `<version>`**

指定快照的版本。版本必须小于或等于副本的最大版本。如果未指定，则使用最大版本。

**3. `<expiration_minutes>`**

快照的保留时间。默认为 1 小时，超时后会自动清理。单位为分钟。

## 返回值

| 列名                | 类型     | 说明                                                         |
|-------------------|--------|------------------------------------------------------------|
| TabletId          | string | 为该 tablet 创建的快照的 ID。                                       |
| BackendId         | string | 存储该快照的 BE 节点的 ID。                                          |
| Ip                | string | 存储该快照的 BE 节点的 IP 地址。                                       |
| Path              | string | 快照在 BE 节点上的存储路径。                                           |
| ExpirationMinutes | string | 快照将自动删除的时间（单位：分钟）。                                         |
| CreateTableStmt   | string | 对应 tablet 的表创建语句。此语句不是原始的建表语句，而是用于后续加载该 tablet 到本地的简化建表语句。 |

## 权限控制

执行此 SQL 命令的用户必须至少拥有以下权限：

| 权限         | 对象       | 说明                                 |
|:-----------|:---------|:-----------------------------------|
| Admin_priv | Database | 执行数据库管理操作所需的权限，包括管理表、分区以及系统级命令等操作。 |

## 示例

- 为指定 BE 节点上的副本创建快照

  ```sql
  ADMIN COPY TABLET 10020 PROPERTIES("backend_id" = "10003");
  ```

  ```text
           TabletId: 10020
          BackendId: 10003
                 Ip: 192.168.10.1
               Path: /path/to/be/storage/snapshot/20220830101353.2.3600
  ExpirationMinutes: 60
    CreateTableStmt: CREATE TABLE `tbl1` (
    `k1` int(11) NULL,
    `k2` int(11) NULL
  ) ENGINE=OLAP
  DUPLICATE KEY(`k1`, `k2`)
  DISTRIBUTED BY HASH(k1) BUCKETS 1
  PROPERTIES (
  "replication_num" = "1",
  "version_info" = "2"
  );
  ```

- 为指定 BE 节点上指定版本的副本创建快照

  ```sql
  ADMIN COPY TABLET 10010 PROPERTIES("backend_id" = "10003", "version" = "10");
  ```

  ```text
           TabletId: 10010
          BackendId: 10003
                 Ip: 192.168.10.1
               Path: /path/to/be/storage/snapshot/20220830101353.2.3600
  ExpirationMinutes: 60
    CreateTableStmt: CREATE TABLE `tbl1` (
    `k1` int(11) NULL,
    `k2` int(11) NULL
  ) ENGINE=OLAP
  DUPLICATE KEY(`k1`, `k2`)
  DISTRIBUTED BY HASH(k1) BUCKETS 1
  PROPERTIES (
  "replication_num" = "1",
  "version_info" = "2"
  );
  ```

