---
{
    "title": "SHOW-CATALOGS",
    "language": "zh-CN"
}
---

## SHOW-CATALOGS

### Name

<version since="1.2">

SHOW CATALOGS

</version>

## 描述

该语句用于显示已存在是数据目录（catalog）

语法：

```sql
SHOW CATALOGS [LIKE]
```

说明:

LIKE：可按照CATALOG名进行模糊查询

返回结果说明：

* CatalogId：数据目录唯一ID
* CatalogName：数据目录名称。其中 internal 是默认内置的 catalog，不可修改。
* Type：数据目录类型。
* IsCurrent: 是否为当前正在使用的数据目录。

## 举例

1. 查看当前已创建的数据目录

   ```sql
   SHOW CATALOGS;
    +-----------+-------------+----------+-----------+
    | CatalogId | CatalogName | Type     | IsCurrent |
    +-----------+-------------+----------+-----------+
    |    130100 | hive        | hms      |           |
    |         0 | internal    | internal | yes       |
    +-----------+-------------+----------+-----------+
       ```
   
2. 按照目录名进行模糊搜索

   ```sql
   SHOW CATALOGS LIKE 'hi%';
    +-----------+-------------+----------+-----------+
    | CatalogId | CatalogName | Type     | IsCurrent |
    +-----------+-------------+----------+-----------+
    |    130100 | hive        | hms      |           |
    +-----------+-------------+----------+-----------+
       ```

### Keywords

SHOW, CATALOG, CATALOGS

### Best Practice

