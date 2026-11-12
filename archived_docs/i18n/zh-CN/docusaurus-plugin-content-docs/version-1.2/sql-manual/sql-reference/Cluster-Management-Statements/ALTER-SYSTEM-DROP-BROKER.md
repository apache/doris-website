---
{
    "title": "ALTER-SYSTEM-DROP-BROKER",
    "language": "zh-CN"
}

---

## ALTER-SYSTEM-DROP-BROKER

### Name

ALTER SYSTEM DROP BROKER

## 描述

该语句是删除 BROKER 节点，（仅限管理员使用）

语法：

```sql
删除所有 Broker
ALTER SYSTEM DROP ALL BROKER broker_name
删除某一个 Broker 节点
ALTER SYSTEM DROP BROKER broker_name "host:port"[,"host:port"...];
```

## 举例

1. 删除所有 Broker

   ```sql
   ALTER SYSTEM DROP ALL BROKER broker_name
   ```

2. 删除某一个 Broker 节点

   ```sql
   ALTER SYSTEM DROP BROKER broker_name "host:port"[,"host:port"...];
   ```

### Keywords

    ALTER, SYSTEM, DROP, FOLLOWER, ALTER SYSTEM

### Best Practice

