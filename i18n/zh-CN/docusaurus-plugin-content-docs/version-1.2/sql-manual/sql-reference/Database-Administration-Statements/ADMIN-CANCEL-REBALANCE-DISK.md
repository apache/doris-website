---
{
    "title": "ADMIN-CANCEL-REBALANCE-DISK",
    "language": "zh-CN"
}
---

## ADMIN-CANCEL-REBALANCE-DISK

### Name

ADMIN CANCEL REBALANCE DISK

## 描述

    该语句用于取消优先均衡BE的磁盘

    语法：

        ADMIN CANCEL REBALANCE DISK [ON ("BackendHost1:BackendHeartBeatPort1", "BackendHost2:BackendHeartBeatPort2", ...)];

    说明：

        1. 该语句仅表示系统不再优先均衡指定BE的磁盘数据。系统仍会以默认调度方式均衡BE的磁盘数据。

## 举例

    1. 取消集群所有BE的优先磁盘均衡

        ADMIN CANCEL REBALANCE DISK;

    2. 取消指定BE的优先磁盘均衡

        ADMIN CANCEL REBALANCE DISK ON ("192.168.1.1:1234", "192.168.1.2:1234");

### Keywords

    ADMIN,CANCEL,REBALANCE,DISK

### Best Practice

