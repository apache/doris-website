---
{
    "title": "ADMIN-REBALANCE-DISK",
    "language": "zh-CN"
}
---

## ADMIN-REBALANCE-DISK

### Name
ADMIN REBALANCE DISK
## 描述

该语句用于尝试优先均衡指定的BE磁盘数据

语法：

    ```
    ADMIN REBALANCE DISK [ON ("BackendHost1:BackendHeartBeatPort1", "BackendHost2:BackendHeartBeatPort2", ...)];
    ```

说明：

    1. 该语句表示让系统尝试优先均衡指定BE的磁盘数据，不受限于集群是否均衡。
    2. 默认的 timeout 是 24小时。超时意味着系统将不再优先均衡指定的BE磁盘数据。需要重新使用该命令设置。
	3. 指定BE的磁盘数据均衡后，该BE的优先级将会失效。

## 举例

1. 尝试优先均衡集群内的所有BE

    ```
    ADMIN REBALANCE DISK;
    ```

2. 尝试优先均衡指定BE

    ```
    ADMIN REBALANCE DISK ON ("192.168.1.1:1234", "192.168.1.2:1234");
    ```

### Keywords

    ADMIN,REBALANCE,DISK

### Best Practice

