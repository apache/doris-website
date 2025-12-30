---
{
    "title": "变量",
    "language": "zh-CN",
    "description": "在 Doris 中，变量分为系统变量和用户变量。这两者都是大小写不敏感的。"
}
---

## 描述

在 Doris 中，变量分为系统变量和用户变量。这两者都是大小写不敏感的。

系统变量会影响 Doris 的行为。系统变量和用户变量均可用于用户查询中。

## 系统变量

系统变量是由 Doris 预定义的一组变量，用于控制数据库的行为和性能。主要特点如下：

- 变量类型：

    只读变量：这些变量的值由系统设定，用户无法修改，如 `version`、`current_timestamp` 等

    可修改变量：用户可以在运行时修改这些变量的值，如 `exec_mem_limit`、`time_zone` 等

- 作用域：

    全局变量（Global）：影响所有会话，通过 `SET GLOBAL` 设置

    会话变量（Session）：仅影响当前会话，通过 `SET` 设置

    部分变量同时具有全局和会话两种作用域

- 访问方式：

    使用 `SHOW VARIABLES` 查看所有系统变量

    使用 `SHOW VARIABLES LIKE 'pattern'` 按模式匹配查看特定变量

- 持久性：

    全局变量的修改在系统重启后会恢复默认值，会话重启不会恢复默认值

    会话变量的修改在会话结束后失效

## 用户自定义变量

用户自定义变量是一种在会话中临时存储数据的机制。主要特点如下：

- 命名规则：

    必须以 `@` 符号作为前缀

    变量名可以包含字母、数字和下划线

    大小写不敏感

- 作用域：

    仅在当前会话中有效

    会话结束后变量自动销毁

    不同会话的同名变量相互独立

- 赋值方式：

    使用 `SET @var_name = value` 语法赋值

    支持使用表达式计算结果赋值

- 数据类型：

    可以存储数字（整数、浮点数）

    可以存储字符串

    可以存储日期时间值

    可以存储 NULL 值

    类型在赋值时自动确定

## 系统变量定义及查询语句

- SHOW VARIABLES

    可以通过 `SHOW VARIABLES LIKE 'variable_name'` 来查看变量

    ```sql
    SHOW VARIABLES LIKE '%time_zone%';
    +------------------+----------------+----------------+---------+
    | Variable_name    | Value          | Default_Value  | Changed |
    +------------------+----------------+----------------+---------+
    | system_time_zone | Asia/Hong_Kong | Asia/Hong_Kong | 0       |
    | time_zone        | Asia/Hong_Kong | Asia/Hong_Kong | 0       |
    +------------------+----------------+----------------+---------+
    ```

    或者可以通过使用`SHOW VARIABLES`来查看所有的变量

    ```sql
    SHOW VARIABLES
    +------------------------------------------------------------------+---------------------------------------+---------------------------------------+---------+
    | Variable_name                                                    | Value                                 | Default_Value                         | Changed |
    +------------------------------------------------------------------+---------------------------------------+---------------------------------------+---------+
    | DML_PLAN_RETRY_TIMES                                             | 3                                     | 3                                     | 0       |
    | adaptive_pipeline_task_serial_read_on_limit                      | 10000                                 | 10000                                 | 0       |
    | allow_modify_materialized_view_data                              | false                                 | false                                 | 0       |
    | allow_partition_column_nullable                                  | true                                  | true                                  | 0       |
    | analyze_timeout                                                  | 43200                                 | 43200                                 | 0       |
    ．．．
    | version                                                          | 5.7.99                                | 5.7.99                                | 0       |
    | version_comment                                                  | Doris version doris-0.0.0--de61c58223 | Doris version doris-0.0.0--de61c58223 | 0       |
    | wait_full_block_schedule_times                                   | 2                                     | 2                                     | 0       |
    | wait_timeout                                                     | 28800                                 | 28800                                 | 0       |
    | workload_group                                                   |                                       |                                       | 0       |
    +------------------------------------------------------------------+---------------------------------------+---------------------------------------+---------+
    360 rows in set (0.01 sec)
    ```

- SET

    部分变量可以设置全局生效或仅当前会话生效

    仅当前会话生效，通过 SET 语句来设置。如：

    ```sql
    SET exec_mem_limit = 137438953472;
    show variables like '%exec_mem_limit%';
    +----------------+--------------+---------------+---------+
    | Variable_name  | Value        | Default_Value | Changed |
    +----------------+--------------+---------------+---------+
    | exec_mem_limit | 137438953472 | 2147483648    | 1       |
    +----------------+--------------+---------------+---------+
    1 row in set (0.01 sec)
    SET forward_to_master = true;
    show variables like '%forward_to_master%';
    +-------------------+-------+---------------+---------+
    | Variable_name     | Value | Default_Value | Changed |
    +-------------------+-------+---------------+---------+
    | forward_to_master | true  | true          | 0       |
    +-------------------+-------+---------------+---------+
    1 row in set (0.00 sec)
    SET time_zone = "Asia/Shanghai";
    show variables like '%time_zone%';
    +------------------+----------------+----------------+---------+
    | Variable_name    | Value          | Default_Value  | Changed |
    +------------------+----------------+----------------+---------+
    | time_zone        | Asia/Shanghai  | Asia/Hong_Kong | 1       |
    | system_time_zone | Asia/Hong_Kong | Asia/Hong_Kong | 0       |
    +------------------+----------------+----------------+---------+
    2 rows in set (0.00 sec)
    ```

    全局生效

    ```sql
    SET GLOBAL exec_mem_limit = 137438953472;
    show variables like '%exec_mem_limit%';
    +----------------+--------------+---------------+---------+
    | Variable_name  | Value        | Default_Value | Changed |
    +----------------+--------------+---------------+---------+
    | exec_mem_limit | 137438953472 | 2147483648    | 1       |
    +----------------+--------------+---------------+---------+
    1 row in set (0.01 sec)
    ```

- UNSET

    语法：

    ```sql
    UNSET (GLOBAL | SESSION | LOCAL)? VARIABLE (ALL | identifier)
    unset global variable exec_mem_limit;
    show variables like '%exec_mem_limit%';
    +----------------+------------+---------------+---------+
    | Variable_name  | Value      | Default_Value | Changed |
    +----------------+------------+---------------+---------+
    | exec_mem_limit | 2147483648 | 2147483648    | 0       |
    +----------------+------------+---------------+---------+
    1 row in set (0.00 sec)
    ```

## 用户变量定义及查询语句

用户定义变量可以用如下语句来定义

```sql
SET @var_name = constant_value|constant_expr;
```

设置例子

```sql
set @v1 = "A";
set @v2 = 32+33;
set @v3 = str_to_date("2024-12-29 10:11:12", '%Y-%m-%d %H:%i:%s');
```

可以用于查询中

```sql
select @v1, @v2, @v3;
+------+------+---------------------+
| @v1  | @v2  | @v3                 |
+------+------+---------------------+
| A    |   65 | 2024-12-29 10:11:12 |
+------+------+---------------------+
1 row in set (0.01 sec)
```