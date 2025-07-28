---
{
    "title": "DIGITAL_MASKING",
    "language": "zh-CN"
}
---

### 描述

别名函数，原始函数为 `concat(left(id,3),'****',right(id,4))`。

将输入的 `digital_number` 进行脱敏处理，返回遮盖脱敏后的结果。

### 语法

```sql
digital_masking(digital_number)
```

### 示例

将手机号码进行脱敏处理

```sql
select digital_masking(13812345678);
```

```
+------------------------------+
| digital_masking(13812345678) |
+------------------------------+
| 138****5678                  |
+------------------------------+
```
