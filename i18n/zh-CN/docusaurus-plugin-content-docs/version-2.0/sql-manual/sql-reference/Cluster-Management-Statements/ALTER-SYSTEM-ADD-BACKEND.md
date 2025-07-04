---
{
    "title": "ALTER-SYSTEM-ADD-BACKEND",
    "language": "zh-CN"
}
---

## ALTER-SYSTEM-ADD-BACKEND

### Name

ALTER SYSTEM ADD BACKEND

## 描述

该语句用于操作一个系统内的节点。（仅管理员使用！）

语法：

```sql
1) 增加节点
   ALTER SYSTEM ADD BACKEND "host:heartbeat_port"[,"host:heartbeat_port"...];
```

 说明：

1. host 可以是主机名或者ip地址
2. heartbeat_port 为该节点的心跳端口
3. 增加和删除节点为同步操作。这两种操作不考虑节点上已有的数据，节点直接从元数据中删除，请谨慎使用。

## 举例

 1. 增加一个节点
    
     ```sql
    ALTER SYSTEM ADD BACKEND "host:port";
    ```

### Keywords

    ALTER, SYSTEM, ADD, BACKEND, ALTER SYSTEM

### Best Practice

