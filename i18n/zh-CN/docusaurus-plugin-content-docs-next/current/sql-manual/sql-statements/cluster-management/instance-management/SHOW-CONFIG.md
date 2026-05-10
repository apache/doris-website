---
{
    "title": "SHOW CONFIG",
    "language": "zh-CN",
    "description": "该语句用于展示当前集群的配置（当前仅支持展示 FE 的配置项）"
}
---

## 描述

该语句用于展示当前集群的配置（当前仅支持展示 FE 的配置项）

语法：

```sql
SHOW FRONTEND CONFIG [LIKE "pattern"];
```

结果中的各列含义如下：

1. Key：配置项名称
2. Value：配置项值
3. Type：配置项类型
4. IsMutable：是否可以通过 ADMIN SET CONFIG 命令设置
5. MasterOnly：是否仅适用于 Master FE
6. Comment：配置项说明

## 示例

1. 查看当前 FE 节点的配置

   ```sql
   SHOW FRONTEND CONFIG;
   ```

2. 使用 like 谓词搜索当前 Fe 节点的配置

    ```
    mysql> SHOW FRONTEND CONFIG LIKE '%check_java_version%';
    +--------------------+-------+---------+-----------+------------+---------+
    | Key                | Value | Type    | IsMutable | MasterOnly | Comment |
    +--------------------+-------+---------+-----------+------------+---------+
    | check_java_version | true  | boolean | false     | false      |         |
    +--------------------+-------+---------+-----------+------------+---------+
    1 row in set (0.01 sec)
    ```

## 关键词

    SHOW, CONFIG

### 最佳实践

