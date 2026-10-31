---
{
    "title": "MICROSECONDS_SUB",
    "language": "zh-CN"
}
---

## microseconds_sub
## 描述
## 语法

`DATETIMEV2 microseconds_sub(DATETIMEV2 basetime, INT delta)`
- basetime: DATETIMEV2 类型起始时间
- delta: 从 basetime 起需要扣减的微秒数
- 返回类型为 DATETIMEV2

## 举例
```
mysql> select now(3), microseconds_sub(now(3), 100000);
+-------------------------+----------------------------------+
| now(3)                  | microseconds_sub(now(3), 100000) |
+-------------------------+----------------------------------+
| 2023-02-25 02:03:05.174 | 2023-02-25 02:03:05.074          |
+-------------------------+----------------------------------+
```
`now(3)` 返回精度位数 3 的 DATETIMEV2 类型当前时间，`microseconds_add(now(3), 100000)` 返回当前时间减去 100000 微秒后的 DATETIMEV2 类型时间

### keywords
    microseconds_sub

    