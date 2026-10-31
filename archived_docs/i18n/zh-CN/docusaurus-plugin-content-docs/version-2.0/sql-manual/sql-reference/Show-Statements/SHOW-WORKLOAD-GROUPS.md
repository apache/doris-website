---
{
    "title": "SHOW-WORKLOAD-GROUPS",
    "language": "zh-CN"
}
---

## SHOW-WORKLOAD-GROUPS

### Name

SHOW WORKLOAD GROUPS

 

## 描述

该语句用于展示当前用户具有usage_priv权限的资源组。

语法：

```sql
SHOW WORKLOAD GROUPS;
```

说明：

该语句仅做资源组简单展示，更复杂的展示可参考 tvf workload_groups().

## 举例

1. 展示所有资源组：
    
    ```sql
    mysql> show workload groups;
    +----------+--------+--------------------------+---------+
    | Id       | Name   | Item                     | Value   |
    +----------+--------+--------------------------+---------+
    | 10343386 | normal | cpu_share                | 10      |
    | 10343386 | normal | memory_limit             | 30%     |
    | 10343386 | normal | enable_memory_overcommit | true    |
    | 10352416 | g1     | memory_limit             | 20%     |
    | 10352416 | g1     | cpu_share                | 10      |
    +----------+--------+--------------------------+---------+
    ```

### Keywords

    SHOW, WORKLOAD, GROUPS, GROUP

### Best Practice
