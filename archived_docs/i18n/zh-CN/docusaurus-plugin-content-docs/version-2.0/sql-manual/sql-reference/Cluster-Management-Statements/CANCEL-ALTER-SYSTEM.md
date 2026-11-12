---
{
    "title": "CANCEL-ALTER-SYSTEM",
    "language": "zh-CN"
}
---

## CANCEL-ALTER-SYSTEM

### Name

CANCEL DECOMMISSION

## 描述

该语句用于撤销一个节点下线操作。（仅管理员使用！）

语法：

- 通过 host 和 port 查找 backend

```sql
CANCEL DECOMMISSION BACKEND "host:heartbeat_port"[,"host:heartbeat_port"...];
```

- 通过 backend_id 查找 backend

```sql
CANCEL DECOMMISSION BACKEND "id1","id2","id3...";
```

## 举例

 1. 取消两个节点的下线操作：
    
      ```sql
       CANCEL DECOMMISSION BACKEND "host1:port", "host2:port";
      ```

 2. 取消 backend_id 为 1 的节点的下线操作：

    ```sql
    CANCEL DECOMMISSION BACKEND "1","2";
    ```

### Keywords

    CANCEL, DECOMMISSION, CANCEL ALTER

### Best Practice

