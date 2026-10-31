---
{
    "title": "SHOW WORKLOAD GROUPS",
    "language": "zh-CN",
    "description": "该语句用于展示当前用户具有 usagepriv 权限的资源组。"
}
---

## 描述


该语句用于展示当前用户具有 usage_priv 权限的资源组。


## 语法

```sql
SHOW WORKLOAD GROUPS [LIKE "<pattern>"];
```

## 注意事项

该语句仅做资源组简单展示，更复杂的展示可参考 tvf workload_groups().

## 示例

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

2. 使用 LIKE 模糊匹配：
    
    ```sql
    mysql> show workload groups like "normal%"
    +----------+--------+--------------------------+---------+
    | Id       | Name   | Item                     | Value   |
    +----------+--------+--------------------------+---------+
    | 10343386 | normal | cpu_share                | 10      |
    | 10343386 | normal | memory_limit             | 30%     |
    | 10343386 | normal | enable_memory_overcommit | true    |
    +----------+--------+--------------------------+---------+
    ```