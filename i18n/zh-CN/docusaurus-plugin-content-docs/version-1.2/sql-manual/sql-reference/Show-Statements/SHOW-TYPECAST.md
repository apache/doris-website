---
{
    "title": "SHOW-TYPECAST",
    "language": "zh-CN"
}
---

## SHOW-TYPECAST

### Name

SHOW TYPECAST

## 描述

查看数据库下所有的类型转换。如果用户指定了数据库，那么查看对应数据库的，否则直接查询当前会话所在数据库

需要对这个数据库拥有 `SHOW` 权限

语法

```sql
SHOW TYPE_CAST [IN|FROM db]
```

 Parameters

>`db`: database name to query

## 举例

```sql
mysql> show type_cast in testDb\G
**************************** 1. row ******************** ******
Origin Type: TIMEV2
  Cast Type: TIMEV2
**************************** 2. row ******************** ******
Origin Type: TIMEV2
  Cast Type: TIMEV2
**************************** 3. row ******************** ******
Origin Type: TIMEV2
  Cast Type: TIMEV2

3 rows in set (0.00 sec)
```

### Keywords

    SHOW, TYPECAST

### Best Practice

