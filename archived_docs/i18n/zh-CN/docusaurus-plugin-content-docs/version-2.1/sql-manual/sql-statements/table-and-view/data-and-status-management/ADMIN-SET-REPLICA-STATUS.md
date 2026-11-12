---
{
    "title": "ADMIN SET REPLICA STATUS",
    "language": "zh-CN",
    "description": "该语句用于设置指定副本的状态，目前仅用于手动将某些副本状态设置为 BAD、DROP 和 OK，从而使得系统能够自动修复这些副本。"
}
---

## 描述

该语句用于设置指定副本的状态，目前仅用于手动将某些副本状态设置为 `BAD`、`DROP` 和 `OK`，从而使得系统能够自动修复这些副本。

## 语法

```sql
ADMIN SET REPLICA STATUS 
PROPERTIES ("tablet_id"="<tablet_id>","backend_id"="<backend_id>","status"="<status>")
```

## 必选参数
**1. `<tablet_id>`**

需要设置副本状态的 tablet ID。

**2. `<backend_id>`**

指定副本所在的 BE 节点 ID

**3. `<status>`**

当前仅支持 "drop"、"bad"、 "ok"
如果指定的副本不存在，或状态已经是 bad，则会被忽略

**注意**：

- 设置为 Bad 状态的副本

  它将不能读写。另外，设置 Bad 有时是不生效的。如果该副本实际数据是正确的，当 BE 上报该副本状态是 ok 的，fe 将把副本自动恢复回 ok 状态。操作可能立刻删除该副本，请谨慎操作。


- 设置为 Drop 状态的副本

  它仍然可以读写。会在其他机器先增加一个健康副本，再删除该副本。相比设置 Bad，设置 Drop 的操作是安全的。

## 权限控制

执行此 SQL 命令的用户必须至少拥有以下权限：

| 权限         | 对象       | 说明                                 |
|:-----------|:---------|:-----------------------------------|
| Admin_priv | Database | 执行数据库管理操作所需的权限，包括管理表、分区以及系统级命令等操作。 |


## 示例

- 设置 tablet 10003 在 BE 10001 上的副本状态为 bad。

  ```sql
  ADMIN SET REPLICA STATUS PROPERTIES("tablet_id" = "10003", "backend_id" = "10001", "status" = "bad");
  ```

- 设置 tablet 10003 在 BE 10001 上的副本状态为 drop。

  ```sql
  ADMIN SET REPLICA STATUS PROPERTIES("tablet_id" = "10003", "backend_id" = "10001", "status" = "drop");
  ```

- 设置 tablet 10003 在 BE 10001 上的副本状态为 ok。

  ```sql
  ADMIN SET REPLICA STATUS PROPERTIES("tablet_id" = "10003", "backend_id" = "10001", "status" = "ok");
  ```