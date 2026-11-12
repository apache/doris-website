---
{
    "title": "ALTER-SYSTEM-DROP-FOLLOWER",
    "language": "zh-CN"
}
---

## Name

ALTER SYSTEM DROP FOLLOWER

## Description

该语句是删除 FRONTEND 的 FOLLOWER 角色的节点，（仅管理员使用！）

语法：

```sql
ALTER SYSTEM DROP FOLLOWER "follower_host:edit_log_port"
```

说明：

1. host 可以是主机名或者 ip 地址

2. edit_log_port : edit_log_port 在其配置文件 fe.conf

## Example

1. 删除一个 FOLLOWER 节点

  ```sql
  ALTER SYSTEM DROP FOLLOWER "host_ip:9010"
  ```

## Keywords

ALTER, SYSTEM, DROP, FOLLOWER, ALTER SYSTEM



