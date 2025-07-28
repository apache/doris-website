---
{
    "title": "SHOW-CREATE-ROUTINE-LOAD",
    "language": "zh-CN"
}
---

## SHOW-CREATE-ROUTINE-LOAD

### Name

SHOW CREATE ROUTINE LOAD

## 描述

该语句用于展示例行导入作业的创建语句.

结果中的 kafka partition 和 offset 展示的当前消费的 partition，以及对应的待消费的 offset。

语法：

```sql
SHOW [ALL] CREATE ROUTINE LOAD for load_name;
```

说明：
          1. `ALL`: 可选参数，代表获取所有作业，包括历史作业
          2.  `load_name`: 例行导入作业名称

## 举例

1. 展示默认db下指定例行导入作业的创建语句

   ```sql
   SHOW CREATE ROUTINE LOAD for test_load
   ```

### Keywords

    SHOW, CREATE, ROUTINE, LOAD

### Best Practice

