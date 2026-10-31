---
{
    "title": "SHOW PROPERTY",
    "language": "zh-CN",
    "description": "该语句用于查看用户的属性"
}
---

## 描述

该语句用于查看用户的属性

## 语法

```sql
SHOW {ALL PROPERTIES | PROPERTY [FOR <user_name>]} [LIKE <key>]
```

## 可选参数
**1. `[ALL PROPERTIES]`**

是否查看所有用户的属性。

**2. `<user_name>`**

查看指定用户的属性。如果未指定，检查当前用户的。

**3. `<key>`**

模糊匹配可以通过属性名来完成。

## 返回值
- 若语句中使用的是`PROPERTY`

   | 列名 | 说明 |
   | -- | -- |
   | Key | 属性名 |
   | Value | 属性值 |


- 若语句中使用的是`PROPERTIES`

   | 列名 | 说明 |
   | -- | -- |
   | User | 用户名 |
   | Properties | 对应用户各个 `property` 的 `key:value` |

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object） | 说明（Notes）                 |
| :---------------- | :------------- | :---------------------------- |
| GRANT_PRIV        | 用户（User）或 角色（Role）    | 用户或者角色拥有 GRANT_PRIV 权限才能查看所有用户属性，`SHOW PROPERTY`查看当前用户属性不需要`GRANT_PRIV`权限 |

## 注意事项
-  `SHOW ALL PROPERTIES` 可以查看所有用户的属性。
- 如果指定 `user_name`，则查看该指定用户的属性。
- 如果不指定 `user_name`，则查看当前用户的属性。
- `SHOW PROPERTY`查看当前用户属性不需要`GRANT_PRIV`权限。

## 示例

- 查看 jack 用户的属性

   ```sql
   SHOW PROPERTY FOR 'jack';
   ```
   ```text
   +-------------------------------------+--------+
   | Key                                 | Value  |
   +-------------------------------------+--------+
   | cpu_resource_limit                  | -1     |
   | default_load_cluster                |        |
   | default_workload_group              | normal |
   | exec_mem_limit                      | -1     |
   | insert_timeout                      | -1     |
   | max_query_instances                 | 3000   |
   | max_user_connections                | 1000   |
   | parallel_fragment_exec_instance_num | -1     |
   | query_timeout                       | -1     |
   | resource_tags                       |        |
   | sql_block_rules                     |        |
   +-------------------------------------+--------+
   ```

- 查看 jack 用户 limit 相关属性

   ```sql
   SHOW PROPERTY FOR 'jack' LIKE '%limit%';
   ```

   ```text
   +--------------------+-------+
   | Key                | Value |
   +--------------------+-------+
   | cpu_resource_limit | -1    |
   | exec_mem_limit     | -1    |
   +--------------------+-------+
   ```

- 查看所有用户 limit 相关属性

   ```sql
   SHOW ALL PROPERTIES LIKE '%limit%';
   ```

   ```text
   +-------+------------------------------------------------------------+
   | User  | Properties                                                 |
   +-------+------------------------------------------------------------+
   | root  | {
     "cpu_resource_limit": "-1",
     "exec_mem_limit": "-1"
   } |
   | admin | {
     "cpu_resource_limit": "-1",
     "exec_mem_limit": "-1"
   } |
   | jack  | {
     "cpu_resource_limit": "-1",
     "exec_mem_limit": "-1"
   } |
   +-------+------------------------------------------------------------+
   ```

