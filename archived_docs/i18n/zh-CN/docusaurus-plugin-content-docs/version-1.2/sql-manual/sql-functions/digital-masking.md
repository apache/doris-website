---
{
    "title": "DIGITAL-MASKING",
    "language": "zh-CN"
}
---

## DIGITAL_MASKING

## 描述

## 语法

```
digital_masking(digital_number)
```

别名函数，原始函数为 `concat(left(id,3),'****',right(id,4))`。

将输入的 `digital_number` 进行脱敏处理，返回遮盖脱敏后的结果。`digital_number` 为 `BIGINT` 数据类型。

## 举例

1. 将手机号码进行脱敏处理

    ```sql
    mysql> select digital_masking(13812345678);
    +------------------------------+
    | digital_masking(13812345678) |
    +------------------------------+
    | 138****5678                  |
    +------------------------------+
    ```

### keywords

DIGITAL_MASKING
