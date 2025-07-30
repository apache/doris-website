---
{
    "title": "MICROSECONDS_ADD",
    "language": "zh-CN"
}
---

## microseconds_add
## 描述
## 语法

`DATETIMEV2 microseconds_add(DATETIMEV2 basetime, INT delta)`
- basetime: DATETIMEV2 类型起始时间
- delta: 从 basetime 起需要相加的微秒数
- 返回类型为 DATETIMEV2

## 举例
```
mysql> select now(3), microseconds_add(now(3), 100000);
+-------------------------+----------------------------------+
| now(3)                  | microseconds_add(now(3), 100000) |
+-------------------------+----------------------------------+
| 2023-02-21 11:35:56.556 | 2023-02-21 11:35:56.656          |
+-------------------------+----------------------------------+
```
`now(3)` 返回精度位数 3 的 DATETIMEV2 类型当前时间，`microseconds_add(now(3), 100000)` 返回当前时间加上 100000 微秒后的 DATETIMEV2 类型时间

### keywords
    microseconds_add
