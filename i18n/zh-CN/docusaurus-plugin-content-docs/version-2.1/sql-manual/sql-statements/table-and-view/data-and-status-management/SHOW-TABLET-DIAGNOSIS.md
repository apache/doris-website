---
{
    "title": "SHOW TABLET DIAGNOSIS",
    "language": "zh-CN",
    "description": "该语句用于诊断指定 tablet。结果中将显示这个 tablet 的信息和一些潜在的问题。"
}
---

## 描述

该语句用于诊断指定 tablet。结果中将显示这个 tablet 的信息和一些潜在的问题。

## 语法

```sql
SHOW TABLET DIAGNOSIS <tablet_id>
```

## 必选参数

**1. `<tablet_id>`**

需要进行执行诊断的 tablet ID。


## 返回值

| 列名                               | 类型     | 说明                        |
|----------------------------------|--------|---------------------------|
| TabletExist                      | String | Tablet 是否存在               |
| TabletId                         | String | Tablet ID                 |
| Database                         | String | Tablet 所属 DB 和其 ID        |
| Table                            | String | Tablet 所属 Table 和其 ID     |
| Partition                        | String | Tablet 所属 Partition 和其 ID |
| MaterializedIndex                | String | Tablet 所属物化视图和其 ID        |
| Replicas(ReplicaId -> BackendId) | String | Tablet 各副本和其所在 BE         |
| ReplicasNum                      | String | 副本数量是否正确                  |
| ReplicaBackendStatus             | String | 副本所在 BE 节点是否正常            |
| ReplicaVersionStatus             | String | 副本的版本号是否正常                |
| ReplicaStatus                    | String | 副本状态是否正常                  |
| ReplicaCompactionStatus          | String | 副本 Compaction 状态是否正常      |

## 权限控制

执行此 SQL 命令的用户必须至少拥有以下权限：

| 权限         | 对象       | 说明                                 |
|:-----------|:---------|:-----------------------------------|
| Admin_priv | Database | 执行数据库管理操作所需的权限，包括管理表、分区以及系统级命令等操作。 |

## 示例

```sql
SHOW TABLET DIAGNOSIS 10145;
```

```text
+----------------------------------+------------------+------------+
| Item                             | Info             | Suggestion |
+----------------------------------+------------------+------------+
| TabletExist                      | Yes              |            |
| TabletId                         | 10145            |            |
| Database                         | test: 10103      |            |
| Table                            | sell_user: 10143 |            |
| Partition                        | sell_user: 10142 |            |
| MaterializedIndex                | sell_user: 10144 |            |
| Replicas(ReplicaId -> BackendId) | {"10146":10009}  |            |
| ReplicasNum                      | OK               |            |
| ReplicaBackendStatus             | OK               |            |
| ReplicaVersionStatus             | OK               |            |
| ReplicaStatus                    | OK               |            |
| ReplicaCompactionStatus          | OK               |            |
+----------------------------------+------------------+------------+
```