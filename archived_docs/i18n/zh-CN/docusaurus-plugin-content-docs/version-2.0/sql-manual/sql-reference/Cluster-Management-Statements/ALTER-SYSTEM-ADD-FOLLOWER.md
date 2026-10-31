---
{
    "title": "ALTER-SYSTEM-ADD-FOLLOWER",
    "language": "zh-CN"
}
---

## ALTER-SYSTEM-ADD-FOLLOWER

### Name

ALTER SYSTEM ADD FOLLOWER

## 描述

该语句是增加 FRONTEND 的 FOLLOWER 角色的节点,（仅管理员使用！）

语法：

```sql
ALTER SYSTEM ADD FOLLOWER "follower_host:edit_log_port"
```

说明：

1. host 可以是主机名或者ip地址
2. edit_log_port : edit_log_port 在其配置文件 fe.conf

## 举例

1. 添加一个 FOLLOWER节点

   ```sql
   ALTER SYSTEM ADD FOLLOWER "host_ip:9010"
   ```

### Keywords

    ALTER, SYSTEM, ADD, FOLLOWER, ALTER SYSTEM

### Best Practice

