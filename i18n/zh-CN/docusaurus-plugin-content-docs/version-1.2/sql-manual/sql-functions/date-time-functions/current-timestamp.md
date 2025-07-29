---
{
    "title": "CURRENT_TIMESTAMP",
    "language": "zh-CN"
}
---

## current_timestamp
## 描述
## 语法

`DATETIME CURRENT_TIMESTAMP()`


获得当前的时间，以Datetime类型返回

## 举例

```
mysql> select current_timestamp();
+---------------------+
| current_timestamp() |
+---------------------+
| 2019-05-27 15:59:33 |
+---------------------+
```

`DATETIMEV2 CURRENT_TIMESTAMP(INT precision)`


获得当前的时间，以DatetimeV2类型返回
precision代表了用户想要的秒精度，当前精度最多支持到微秒，即precision取值范围为[0, 6]。

## 举例

```
mysql> select current_timestamp(3);
+-------------------------+
| current_timestamp(3)    |
+-------------------------+
| 2022-09-06 16:18:00.922 |
+-------------------------+
```

注意：
1. 当前只有DatetimeV2数据类型可支持秒精度
2. 受限于JDK实现，如果用户使用JDK8构建FE，则精度最多支持到毫秒（小数点后三位），更大的精度位将全部填充0。如果用户有更高精度需求，请使用JDK11。

### keywords

    CURRENT_TIMESTAMP,CURRENT,TIMESTAMP
