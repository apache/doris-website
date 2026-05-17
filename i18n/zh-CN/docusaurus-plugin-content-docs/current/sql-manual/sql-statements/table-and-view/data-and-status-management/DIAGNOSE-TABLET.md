---
{
    "title": "DIAGNOSE TABLET",
    "language": "zh-CN",
    "description": "存算一体模式中，该语句用于诊断指定 tablet。结果中将显示这个 tablet 的信息和一些潜在的问题。"
}
---

## 描述

存算一体模式中，该语句用于诊断指定 tablet。结果中将显示这个 tablet 的信息和一些潜在的问题。

存算分离模式不支持这个命令。

## 语法

```sql
SHOW TABLET DIAGNOSIS <tablet_id>;
```

## 必选参数

1. `<tablet_id>`: 待诊断 tablet 的 id

## 返回值

返回 tablet 相关信息

- `TabletExist`: Tablet 是否存在

- `TabletId` : Tablet ID

- `Database`: Tablet 所属 DB 和其 ID

- `Table`: Tablet 所属 Table 和其 ID

- `Partition`: Tablet 所属 Partition 和其 ID

- `MaterializedIndex`: Tablet 所属物化视图和其 ID

- `Replicas`: Tablet 各副本和其所在 BE

- `ReplicasNum`: 副本数量是否正确

- `ReplicaBackendStatus`: 副本所在 BE 节点是否正常

- `ReplicaVersionStatus`: 副本的版本号是否正常

- `ReplicaStatus`: 副本状态是否正常

- `ReplicaCompactionStatus`: 副本 Compaction 状态是否正常

## 示例

1. 诊断指定 tablet id 为 10078 的 tablet 信息

    ```sql
    show tablet diagnosis 10078;
    +----------------------------------+---------------------------------------------+------------+
    | Item                             | Info                                        | Suggestion |
    +----------------------------------+---------------------------------------------+------------+
    | TabletExist                      | Yes                                         |            |
    | TabletId                         | 10078                                       |            |
    | Database                         | __internal_schema: 10005                    |            |
    | Table                            | audit_log: 10058                            |            |
    | Partition                        | p20241109: 10075                            |            |
    | MaterializedIndex                | audit_log: 10059                            |            |
    | Replicas(ReplicaId -> BackendId) | {"10099":10003,"10116":10002,"10079":10004} |            |
    | ReplicasNum                      | OK                                          |            |
    | ReplicaBackendStatus             | OK                                          |            |
    | ReplicaVersionStatus             | OK                                          |            |
    | ReplicaStatus                    | OK                                          |            |
    | ReplicaCompactionStatus          | OK                                          |            |
    +----------------------------------+---------------------------------------------+------------+
    ```

## 权限控制

执行此 SQL 命令成功的前置条件是，拥有 ADMIN_PRIV 权限，参考权限文档。

| 权限（Privilege） | 对象（Object）   | 说明（Notes）               |
| :---------------- | :--------------- | :-------------------------- |
| ADMIN_PRIV        | 整个集群管理权限 | 除 NODE_PRIV 以外的所有权限 |

## 注意事项

1. 存算分离模式不支持这个命令，在此模式下执行会报错，例如：

    ```sql
    show tablet diagnosis 15177;
    ```

    报错信息如下：

    ```sql
    ERROR 1105 (HY000): errCode = 2, detailMessage = Unsupported operation
    ```