---
{
    "title": "SHOW-CREATE-LOAD",
    "language": "zh-CN"
}
---

## SHOW-CREATE-LOAD

### Name

SHOW CREATE LOAD

## 描述

该语句用于展示导入作业的创建语句.

语法：

```sql
SHOW CREATE LOAD for load_name;
```

说明：
          1.  `load_name`: 例行导入作业名称

## 举例

1. 展示默认db下指定导入作业的创建语句

   ```sql
   SHOW CREATE LOAD for test_load
   ```

### Keywords

    SHOW, CREATE, LOAD

### Best Practice

