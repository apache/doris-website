---
{
    "title": "SHOW FRONTEND CONFIG",
    "language": "zh-CN",
    "description": "该语句用于展示当前集群的配置（当前仅支持展示 FE 的配置项）"
}
---

## 描述

该语句用于展示当前集群的配置（当前仅支持展示 FE 的配置项）

## 语法：

```sql
SHOW FRONTEND CONFIG [LIKE "<pattern>"];
```

## 可选参数
**`<pattern>`**
   > 可以包含普通字符和通配符的字符串

## 返回值

| 列名         | 说明                             |
|------------|--------------------------------|
| Value      | 配置项值                           |
| Type       | 配置项类型                          |
| IsMutable  | 是否可以通过 `ADMIN SET CONFIG` 命令设置 |
| MasterOnly | 是否仅适用于 Master FE               |
| Comment    | 配置项说明                          |

## 示例

1. 查看当前 FE 节点的配置

   ```sql
   SHOW FRONTEND CONFIG;
   ```

2. 使用 like 谓词搜索当前 Fe 节点的配置

    ```sql
    SHOW FRONTEND CONFIG LIKE '%check_java_version%';
    ```
    ```text
    +--------------------+-------+---------+-----------+------------+---------+
    | Key                | Value | Type    | IsMutable | MasterOnly | Comment |
    +--------------------+-------+---------+-----------+------------+---------+
    | check_java_version | true  | boolean | false     | false      |         |
    +--------------------+-------+---------+-----------+------------+---------+
    ```

