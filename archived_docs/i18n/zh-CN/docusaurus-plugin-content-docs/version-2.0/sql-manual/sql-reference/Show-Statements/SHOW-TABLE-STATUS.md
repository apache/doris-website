---
{
    "title": "SHOW-TABLE-STATUS",
    "language": "zh-CN"
}
---

## SHOW-TABLE-STATUS

### Name

SHOW TABLE STATUS

## 描述

该语句用于查看 Table 的一些信息。

语法：

```sql
SHOW TABLE STATUS
[FROM db] [LIKE "pattern"]
```

说明：

1. 该语句主要用于兼容 MySQL 语法，目前仅显示 Comment 等少量信息

## 举例

 1. 查看当前数据库下所有表的信息

    ```sql
    SHOW TABLE STATUS;
    ```

 1. 查看指定数据库下，名称包含 example 的表的信息

    ```sql
    SHOW TABLE STATUS FROM db LIKE "%example%";
    ```

### Keywords

    SHOW, TABLE, STATUS

### Best Practice

