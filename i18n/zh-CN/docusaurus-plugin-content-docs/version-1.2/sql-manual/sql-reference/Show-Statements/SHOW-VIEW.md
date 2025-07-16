---
{
    "title": "SHOW-VIEW",
    "language": "zh-CN"
}
---

## SHOW-VIEW

### Name

SHOW VIEW

## 描述

该语句用于展示基于给定表建立的所有视图

语法：

```sql
 SHOW VIEW { FROM | IN } table [ FROM db ]
```

## 举例

1. 展示基于表 testTbl 建立的所有视图 view
    
    ```sql
    SHOW VIEW FROM testTbl;
    ```

### Keywords

    SHOW, VIEW

### Best Practice

