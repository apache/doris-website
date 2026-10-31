---
{
    "title": "SYNC",
    "language": "zh-CN"
}
---

## SYNC

### Name

SYNC

## 描述

用于fe非master节点同步元数据。doris只有master节点才能写fe元数据，其他fe节点写元数据的操作都会转发到master节点。在master完成元数据写入操作后，非master节点replay元数据会有短暂的延迟，可以使用该语句同步元数据。

语法：

```sql
SYNC;
```

## 举例

1. 同步元数据

    ```sql
    SYNC;
    ```

### Keywords

    SYNC

### Best Practice

