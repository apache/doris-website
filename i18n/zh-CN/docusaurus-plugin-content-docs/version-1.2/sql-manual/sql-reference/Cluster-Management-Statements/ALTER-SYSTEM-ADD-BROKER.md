---
{
    "title": "ALTER-SYSTEM-ADD-BROKER",
    "language": "zh-CN"
}

---

## ALTER-SYSTEM-ADD-BROKER

### Name

ALTER SYSTEM ADD BROKER

## 描述

该语句用于添加一个 BROKER 节点。（仅管理员使用！）

语法：

```sql
ALTER SYSTEM ADD BROKER broker_name "broker_host1:broker_ipc_port1","broker_host2:broker_ipc_port2",...;
```

## 举例

1. 增加两个 Broker

   ```sql
    ALTER SYSTEM ADD BROKER "host1:port", "host2:port";
   ```

### Keywords

    ALTER, SYSTEM, ADD, FOLLOWER, ALTER SYSTEM

### Best Practice

