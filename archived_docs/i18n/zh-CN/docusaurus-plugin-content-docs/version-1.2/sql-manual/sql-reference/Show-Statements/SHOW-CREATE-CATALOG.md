---
{
    "title": "SHOW-CREATE-CATALOG",
    "language": "zh-CN"
}
---

## SHOW-CREATE-CATALOG

### Name

<version since="1.2">

SHOW CREATE CATALOG

</version>

## 描述

该语句查看doris数据目录的创建语句。

语法：

```sql
SHOW CREATE CATALOG catalog_name;
```

说明：

- `catalog_name`: 为doris中存在的数据目录的名称。

## 举例

1. 查看doris中hive数据目录的创建语句

   ```sql
   SHOW CREATE CATALOG hive;
   ```

### Keywords

    SHOW, CREATE, CATALOG

### Best Practice

