---
{
    "title": "DROP-CATALOG",
    "language": "zh-CN"
}
---

## DROP-CATALOG

### Name


:::tip 提示
该功能自 Apache Doris  1.2 版本起支持
:::

CREATE CATALOG



## 描述

该语句用于删除外部数据目录（catalog）

语法：

```sql
DROP CATALOG [IF EXISTS] catalog_name;
```

## 举例

1. 删除数据目录 hive

   ```sql
   DROP CATALOG hive;
   ```

### Keywords

DROP, CATALOG

### Best Practice

