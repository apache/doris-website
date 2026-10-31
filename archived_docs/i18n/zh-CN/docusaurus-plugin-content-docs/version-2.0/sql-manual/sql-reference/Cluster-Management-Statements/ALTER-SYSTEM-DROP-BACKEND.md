---
{
    "title": "ALTER-SYSTEM-DROP-BACKEND",
    "language": "zh-CN"
}
---

## ALTER-SYSTEM-DROP-BACKEND

### Name

ALTER SYSTEM DROP BACKEND

## 描述

该语句用于删除 BACKEND 节点（仅管理员使用！）

语法：

- 通过 host 和 port 查找 backend

```sql
ALTER SYSTEM DROP BACKEND "host:heartbeat_port"[,"host:heartbeat_port"...]
```

- 通过 backend_id 查找 backend

```sql
ALTER SYSTEM DROP BACKEND "id1","id2"...;
```

说明：

1. host 可以是主机名或者ip地址
2. heartbeat_port 为该节点的心跳端口
3. 增加和删除节点为同步操作。这两种操作不考虑节点上已有的数据，节点直接从元数据中删除，请谨慎使用。

## 举例

1. 删除两个节点

   ```sql
   ALTER SYSTEM DROP BACKEND "host1:port", "host2:port";
   ```
    
    ```sql
    ALTER SYSTEM DROP BACKEND "id1", "id2";
    ```

### Keywords

    ALTER, SYSTEM, DROP, BACKEND, ALTER SYSTEM

### Best Practice

