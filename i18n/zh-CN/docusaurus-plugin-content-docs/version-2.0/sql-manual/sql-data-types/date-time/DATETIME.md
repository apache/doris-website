---
{
    "title": "DATETIME",
    "language": "zh-CN"
}
---

## 描述

DATETIME([P])
日期时间类型，可选参数 P 表示时间精度，取值范围是[0, 6]，即最多支持 6 位小数（微秒）。不设置时为 0。
取值范围是['0000-01-01 00:00:00[.000000]', '9999-12-31 23:59:59[.999999]'].
打印的形式是'yyyy-MM-dd HH:mm:ss.SSSSSS'

### note

DATETIME 支持了最多到微秒的时间精度。在使用 BE 端解析导入的 DATETIME 类型数据时（如使用 Stream load、Spark load 等），或开启[新优化器](/docs/query/nereids/nereids-new)后在 FE 端解析 DATETIME 类型数据时，将会对超出当前精度的小数进行**四舍五入**。
将带有小数秒部分的 DATETIME 值插入到具有较少小数位的相同类型的列中会导致**四舍五入**。

DATETIME 读入时支持解析时区，格式为原本 DATETIME 字面量后紧贴时区：
```sql
<date> <time>[<timezone>]
```

关于`<timezone>`的具体支持格式，请见[时区](../../../admin-manual/cluster-management/time-zone)。需要注意的是，`DATE`, `DATEV2`, `DATETIME`, `DATETIMEV2` 类型均**不**包含时区信息。例如，一个输入的时间字符串 "2012-12-12 08:00:00+08:00" 经解析并转换至当前时区 "+02:00"，得到实际值 "2012-12-12 02:00:00" 后存储于 DATETIME 列中，则之后无论本集群环境变量如何改变，该值本身都不会发生变化。

## 举例

```sql
mysql> select @@time_zone;
+----------------+
| @@time_zone    |
+----------------+
| Asia/Hong_Kong |
+----------------+
1 row in set (0.11 sec)

mysql> insert into dtv23 values ("2020-12-12 12:12:12Z"), ("2020-12-12 12:12:12GMT"), ("2020-12-12 12:12:12+02:00"), ("2020-12-12 12:12:12America/Los_Angeles");
Query OK, 4 rows affected (0.17 sec)

mysql> select * from dtv23;
+-------------------------+
| k0                      |
+-------------------------+
| 2020-12-12 20:12:12.000 |
| 2020-12-12 20:12:12.000 |
| 2020-12-13 04:12:12.000 |
| 2020-12-12 18:12:12.000 |
+-------------------------+
4 rows in set (0.15 sec)
```

