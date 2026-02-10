---
{
    "title": "USE",
    "language": "zh-CN"
}
---

## USE

### Name

USE

## 描述

USE 命令可以让我们来使用数据库

语法：

```SQL
USE <[CATALOG_NAME].DATABASE_NAME>
```

说明:
1. 使用`USE CATALOG_NAME.DATABASE_NAME`, 会先将当前的Catalog切换为`CATALOG_NAME`, 然后再讲当前的Database切换为`DATABASE_NAME`

## 举例

1. 如果 demo 数据库存在，尝试使用它：

   ```sql
   mysql> use demo;
   Database changed
   ```

2. 如果 demo 数据库在hms_catalog的Catalog下存在，尝试切换到hms_catalog, 并使用它：

    ```sql
    mysql> use hms_catalog.demo;
    Database changed
    ```
### Keywords

    USE

### Best Practice

