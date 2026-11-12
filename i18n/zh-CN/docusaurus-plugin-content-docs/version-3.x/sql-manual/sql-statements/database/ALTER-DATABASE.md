---
{
    "title": "ALTER DATABASE",
    "language": "zh-CN",
    "description": "该语句用于设置指定 db 的属性和改动 db 名字以及设定 db 的多种 quota。"
}
---

## 描述

该语句用于设置指定 db 的属性和改动 db 名字以及设定 db 的多种 quota。

## 语法

```sql
ALTER DATABASE <db_name> RENAME <new_name>
ALTER DATABASE <db_name> SET { DATA | REPLICA | TRANSACTION } QUOTA <quota>
ALTER DATABASE <db_name> SET <PROPERTIES> ("<key>" = "<value>" [, ...])
```

## 必选参数

** 1. `<db_name>`**
>  数据库名称

** 2. `<new_db_name>`**
>  新的数据库名称

** 3. `<quota>`**
>  数据库数据量配额或者数据库的副本数量配额

** 4. `<PROPERTIES>`**
>  该数据库的附加信息

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限         | 对象    | 说明             |
|:-----------|:------|:---------------|
| ALTER_PRIV | 对应数据库 | 需要对对应数据库具有变更权限 |

## 注意事项

- 数据量配额和副本数配额用于对新增数据写入或新增副本操作进行准入控制。将配额下调到低于当前用量不会删除已有数据或副本。当当前用量达到或超过相应配额时，Doris 会拒绝继续增加对应使用量的操作。
- `RECOVER` 恢复的是回收站中已有的元数据、数据或副本，不会写入新数据或创建新副本，因此不受数据量配额和副本数配额限制。恢复成功后，数据库用量可能超过配额；在用量降到配额以下或调高配额之前，后续新增数据或副本的操作仍会被拒绝。

重命名数据库后，如需要，请使用 REVOKE 和 GRANT 命令修改相应的用户权限。数据库的默认数据量配额为 8192PB，默认副本数量配额为 1073741824。

## 示例

- 设置指定数据库数据量配额

  ```sql
    ALTER DATABASE example_db SET DATA QUOTA 10995116277760;
  ```

- 将数据库 example_db 重命名为 example_db2

  ```sql
    ALTER DATABASE example_db RENAME example_db2;
  ```

- 设定指定数据库副本数量配额

  ```sql
    ALTER DATABASE example_db SET REPLICA QUOTA 102400;
  ```

- 修改 db 下 table 的默认副本分布策略（该操作仅对新建的 table 生效，不会修改 db 下已存在的 table）

  ```sql
    ALTER DATABASE example_db SET PROPERTIES("replication_allocation" = "tag.location.default:2");
  ```

- 取消 db 下 table 的默认副本分布策略（该操作仅对新建的 table 生效，不会修改 db 下已存在的 table）

  ```sql
    ALTER DATABASE example_db SET PROPERTIES("replication_allocation" = "");
  ```

- 修改 db 下 table 的默认 Storage Vault（该操作仅对新建的 table 生效，不会修改 db 下已存在的 table）

  ```sql
    ALTER DATABASE example_db SET PROPERTIES("storage_vault_name" = "hdfs_demo_vault");
  ```

- 取消 db 下 table 的默认 Storage Vault（该操作仅对新建的 table 生效，不会修改 db 下已存在的 table）

  ```sql
    ALTER DATABASE example_db SET PROPERTIES("storage_vault_name" = "");
  ```

:::info 备注

从 3.0.5 版本支持指定 db 的 `storage_vault_name`。

:::
