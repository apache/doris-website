---
{
    "title": "HUMAN_READABLE_SECONDS",
    "language": "zh-CN"
}
---

## 描述

将秒数转换为可读性更高的时长字符串（包含周、天、小时、分钟、秒、毫秒）。

## 语法

```sql
HUMAN_READABLE_SECONDS(<x>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<x>` | 需要格式化的秒数（数值类型输入，内部按 DOUBLE 处理） |

## 返回值

返回 `VARCHAR` 类型的时长字符串。

## 特殊情况

- 当 `<x>` 为 `NULL` 时，返回 `NULL`
- 支持负数输入，结果前会加 `-`
- 小数秒会以毫秒形式输出
- 当 `<x>` 为 `NaN` 时，返回 `nan`
- 当 `<x>` 为正无穷时，返回 `inf`
- 当 `<x>` 为负无穷时，返回 `-inf`

## 示例

```sql
select human_readable_seconds(3661);
```

```text
+------------------------------+
| human_readable_seconds(3661) |
+------------------------------+
| 1 hour, 1 minute, 1 second   |
+------------------------------+
```

```sql
select human_readable_seconds(475.33);
```

```text
+--------------------------------+
| human_readable_seconds(475.33) |
+--------------------------------+
| 7 minutes, 55 seconds, 330 milliseconds |
+--------------------------------+
```

```sql
select human_readable_seconds(0.9);
```

```text
+-----------------------------+
| human_readable_seconds(0.9) |
+-----------------------------+
| 900 milliseconds            |
+-----------------------------+
```

```sql
select human_readable_seconds(-0.5);
```

```text
+------------------------------+
| human_readable_seconds(-0.5) |
+------------------------------+
| -500 milliseconds            |
+------------------------------+
```

```sql
select human_readable_seconds(NULL);
```

```text
+------------------------------+
| human_readable_seconds(NULL) |
+------------------------------+
| NULL                         |
+------------------------------+
```