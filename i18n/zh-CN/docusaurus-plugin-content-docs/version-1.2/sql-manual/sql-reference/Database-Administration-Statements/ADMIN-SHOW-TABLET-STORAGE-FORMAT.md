---
{
    "title": "ADMIN SHOW TABLET STORAGE FORMAT",
    "language": "zh-CN"
}
---

## ADMIN SHOW TABLET STORAGE FORMAT
## 描述
    该语句用于显示Backend上的存储格式信息（仅管理员使用）
    语法：
        ADMIN SHOW TABLET STORAGE FORMAT [VERBOSE]

## 举例
    MySQL [(none)]> admin show tablet storage format;
    +-----------+---------+---------+
    | BackendId | V1Count | V2Count |
    +-----------+---------+---------+
    | 10002     | 0       | 2867    |
    +-----------+---------+---------+
    1 row in set (0.003 sec)
    MySQL [test_query_qa]> admin show tablet storage format verbose;
    +-----------+----------+---------------+
    | BackendId | TabletId | StorageFormat |
    +-----------+----------+---------------+
    | 10002     | 39227    | V2            |
    | 10002     | 39221    | V2            |
    | 10002     | 39215    | V2            |
    | 10002     | 39199    | V2            |
    +-----------+----------+---------------+
    4 rows in set (0.034 sec)

### keywords
    ADMIN, SHOW, TABLET, STORAGE, FORMAT, ADMIN SHOW

