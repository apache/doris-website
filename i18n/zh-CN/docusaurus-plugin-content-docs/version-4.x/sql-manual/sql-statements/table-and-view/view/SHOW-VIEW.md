---
{
    "title": "SHOW VIEW",
    "language": "zh-CN",
    "description": "该语句用于展示基于给定表建立的所有视图"
}
---

## 描述

该语句用于展示基于给定表建立的所有视图

语法：

```sql
 SHOW VIEW { FROM | IN } table [ FROM db ]
```

## 示例

1. 展示基于表 testTbl 建立的所有视图 view
    
    ```sql
    SHOW VIEW FROM testTbl;
    ```

## 关键词

SHOW, VIEW


