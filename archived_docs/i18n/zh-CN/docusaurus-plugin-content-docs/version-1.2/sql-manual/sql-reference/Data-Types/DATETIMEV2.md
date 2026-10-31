---
{
    "title": "DATETIMEV2",
    "language": "zh-CN"
}
---

## DATETIMEV2

DATETIMEV2

## 描述

    DATETIMEV2([P])
    日期时间类型，可选参数P表示时间精度，取值范围是[0, 6]，即最多支持6位小数（微秒）。不设置时为0。
    取值范围是['0000-01-01 00:00:00[.000000]', '9999-12-31 23:59:59[.999999]'].
    打印的形式是'yyyy-MM-dd HH:mm:ss.SSSSSS'

### note

    相比DATETIME类型，DATETIMEV2更加高效，并且支持了最多到微秒的时间精度。

### keywords

    DATETIMEV2
