---
{
    "title": "SHOW TABLET STORAGE FORMAT",
    "language": "zh-CN",
    "description": "该语句用于显示 Backend 上的存储格式信息"
}
---

## 描述

该语句用于显示 Backend 上的存储格式信息

### 语法

```sql
SHOW TABLET STORAGE FORMAT [VERBOSE]
```
## 可选参数

** 1. `VERBOSE` **

  展示更详细的信息

## 返回值

| 列名            | 类型     | 说明                                  |
|---------------|--------|-------------------------------------|
| BackendId     | Int    | BE（Backend）节点的 ID，表示该 tablet 的副本所在的节点。 |
| V1Count       | Int    | V1 版本 tablet 数量。                    |
| V2Count       | Int    | V2 版本 tablet 数量。                    |
| TabletId      | Int    | tablet 的唯一标识符，用于标识具体的 tablet。         |
| StorageFormat | String | tablet 的版本 V1 或 V2                     |


## 权限控制

执行此 SQL 命令的用户必须至少拥有以下权限：

| 权限         | 对象       | 说明                                 |
|:-----------|:---------|:-----------------------------------|
| Admin_priv | Database | 执行数据库管理操作所需的权限，包括管理表、分区以及系统级命令等操作。 |

## 示例

- 执行未添加 `verbose` 参数的语句

  ```sql
  show tablet storage format;
  ```

  ```text
  +-----------+---------+---------+
  | BackendId | V1Count | V2Count |
  +-----------+---------+---------+
  | 10002     | 0       | 2867    |
  +-----------+---------+---------+
  ```

- 执行添加 verbose 参数的语句

  ```sql
  show tablet storage format verbose;
  ```

  ```text
  +-----------+----------+---------------+
  | BackendId | TabletId | StorageFormat |
  +-----------+----------+---------------+
  | 10002     | 39227    | V2            |
  | 10002     | 39221    | V2            |
  | 10002     | 39215    | V2            |
  | 10002     | 39199    | V2            |
  +-----------+----------+---------------+
  ```