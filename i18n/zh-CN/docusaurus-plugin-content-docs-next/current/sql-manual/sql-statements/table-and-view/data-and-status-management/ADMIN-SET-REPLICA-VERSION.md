---
{
    "title": "ADMIN SET REPLICA VERSION",
    "language": "zh-CN",
    "description": "该语句用于设置指定副本的版本、最大成功版本、最大失败版本，目前仅用于在程序异常情况下，手动修复副本的版本，从而使得副本从异常状态恢复过来。"
}
---

## 描述

该语句用于设置指定副本的版本、最大成功版本、最大失败版本，目前仅用于在程序异常情况下，手动修复副本的版本，从而使得副本从异常状态恢复过来。

## 语法

```sql
ADMIN SET REPLICA VERSION PROPERTIES ("<key>"="<value>" [,...])
```

## 必选参数

** 1. `"<key>"="<value>"`**

| key          | value type | Notes                    |
|--------------|------------|--------------------------|
| `tablet_id`  | Int        | 需要执行操作的 tablet ID        |
| `backend_id` | Int        | 指定 tablet 副本所在的 BE 节点 ID |

## 可选参数

** 1. `"<key>"="<value>"`**

| key                    | value type | Notes        |
|------------------------|------------|--------------|
| `version`              | Int        | 设置副本的版本。     |
| `last_success_version` | Int        | 设置副本的最大成功版本。 |
| `last_failed_version`  | Int        | 设置副本的最大失败版本。 |


**注意**

- 如果指定的副本不存在，则会被忽略。

- 修改这几个数值，可能会导致后面数据读写失败，造成数据不一致，请谨慎操作！

- 修改之前先记录原来的值。修改完毕之后，对表进行读写验证，如果读写失败，请恢复原来的值！但可能会恢复失败！

- 严禁对正在写入数据的 tablet 进行操作！

## 权限控制

执行此 SQL 命令的用户必须至少拥有以下权限：

| 权限         | 对象       | 说明                                 |
|:-----------|:---------|:-----------------------------------|
| Admin_priv | Database | 执行数据库管理操作所需的权限，包括管理表、分区以及系统级命令等操作。 |

## 示例

- 清除 tablet 10003 在 BE 10001 上的副本状态失败标志。

  ```sql
  ADMIN SET REPLICA VERSION PROPERTIES("tablet_id" = "10003", "backend_id" = "10001", "last_failed_version" = "-1");
  ```

- 设置 tablet 10003 在 BE 10001 上的副本版本号为 1004。

  ```sql
  ADMIN SET REPLICA VERSION PROPERTIES("tablet_id" = "10003", "backend_id" = "10001", "version" = "1004");
  ```

