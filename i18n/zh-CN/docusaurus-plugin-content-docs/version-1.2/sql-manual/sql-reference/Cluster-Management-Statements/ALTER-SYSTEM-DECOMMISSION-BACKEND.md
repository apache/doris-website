---
{
    "title": "ALTER-SYSTEM-DECOMMISSION-BACKEND",
    "language": "zh-CN"
}
---

## ALTER-SYSTEM-DECOMMISSION-BACKEND

### Name

ALTER SYSTEM DECOMMISSION BACKEND

## 描述

节点下线操作用于安全下线节点。该操作为异步操作。如果成功，节点最终会从元数据中删除。如果失败，则不会完成下线（仅管理员使用！）

语法：

```sql
ALTER SYSTEM DECOMMISSION BACKEND "host:heartbeat_port"[,"host:heartbeat_port"...];
```

 说明：

1. host 可以是主机名或者ip地址
2.  heartbeat_port 为该节点的心跳端口
3. 节点下线操作用于安全下线节点。该操作为异步操作。如果成功，节点最终会从元数据中删除。如果失败，则不会完成下线。
4. 可以手动取消节点下线操作。详见 CANCEL DECOMMISSION

## 举例

1. 下线两个节点

     ```sql
      ALTER SYSTEM DECOMMISSION BACKEND "host1:port", "host2:port";
     ```

### Keywords

    ALTER, SYSTEM, DECOMMISSION, BACKEND, ALTER SYSTEM

### Best Practice

