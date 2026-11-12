---
{
    "title": "DATEV2",
    "language": "zh-CN"
}
---

## DATEV2

### name

DATEV2

## 描述
    DATEV2类型
        日期类型，目前的取值范围是['0000-01-01', '9999-12-31'], 默认的打印形式是'yyyy-MM-dd'

### note
    DATEV2类型相比DATE类型更加高效，在计算时，DATEV2相比DATE可以节省一半的内存使用量。
    为了和mysql保持一致的行为，不存在0000-02-29这个日期。

## 举例
    mysql> SELECT CAST('2003-12-31 01:02:03' as DATEV2);
        -> '2003-12-31'

### keywords

    DATEV2
