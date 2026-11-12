---
{
    "title": "SHOW-CREATE-CATALOG",
    "language": "zh-CN"
}
---

## SHOW-CREATE-CATALOG

### Name


:::tip 提示
该功能自 Apache Doris  1.2 版本起支持
:::

SHOW CREATE CATALOG



## 描述

该语句查看 doris 数据目录的创建语句。

语法：

```sql
SHOW CREATE CATALOG catalog_name;
```

说明：

- `catalog_name`: 为 doris 中存在的数据目录的名称。

## 举例

1. 查看 doris 中 hive 数据目录的创建语句

   ```sql
   SHOW CREATE CATALOG hive;
   ```

### Keywords

    SHOW, CREATE, CATALOG

### Best Practice

