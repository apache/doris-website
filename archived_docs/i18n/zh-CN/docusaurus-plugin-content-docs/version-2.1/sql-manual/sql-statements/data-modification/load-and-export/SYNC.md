---
{
    "title": "SYNC",
    "language": "zh-CN",
    "description": "该语句用于同步非 Master Frontend（FE）节点的元数据。在 Apache Doris 中，只有 Master FE 节点可以写入元数据，其他 FE 节点的元数据写入操作都会转发至 Master 节点。在 Master 节点完成元数据写入操作后，"
}
---

## 描述

该语句用于同步非 Master Frontend（FE）节点的元数据。在 Apache Doris 中，只有 Master FE 节点可以写入元数据，其他 FE 节点的元数据写入操作都会转发至 Master 节点。在 Master 节点完成元数据写入操作后，非 Master 节点会存在短暂的元数据同步延迟。可以使用该语句强制同步元数据。

## 语法

```sql
SYNC;
```

## 权限控制

任意用户或角色都可以执行该操作

## 示例

同步元数据：

    ```sql
    SYNC;
    ```