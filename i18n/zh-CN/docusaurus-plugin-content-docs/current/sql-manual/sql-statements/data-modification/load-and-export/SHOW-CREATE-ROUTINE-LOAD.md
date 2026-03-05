---
{
    "title": "SHOW CREATE ROUTINE LOAD",
    "language": "zh-CN",
    "description": "该语句用于展示例行导入作业的创建语句。"
}
---

## 描述

该语句用于展示例行导入作业的创建语句。

结果中的 kafka partition 和 offset 展示的当前消费的 partition，以及对应的待消费的 offset。该结果不一定是实时的消费位点，应以[show routine load](./SHOW-ROUTINE-LOAD.md)的结果为准。

## 语法

```sql
SHOW [ALL] CREATE ROUTINE LOAD for <load_name>;
```

## 必选参数

**1. `<load_name>`**

> 例行导入作业名称

## 可选参数

**1. `[ALL]`**

> 可选参数，代表获取所有作业，包括历史作业

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object） | 说明（Notes）                 |
| :---------------- | :------------- | :---------------------------- |
| LOAD_PRIV         | 表（Table）    | SHOW ROUTINE LOAD 需要对表有LOAD权限 |

## 示例

- 展示默认 db 下指定例行导入作业的创建语句

   ```sql
   SHOW CREATE ROUTINE LOAD for test_load
   ```

