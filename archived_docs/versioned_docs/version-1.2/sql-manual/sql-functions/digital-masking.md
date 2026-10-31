---
{
    "title": "DIGITAL-MASKING",
    "language": "en"
}
---

## DIGITAL_MASKING

### description

#### Syntax

```
digital_masking(digital_number)
```

Alias function, the original function is `concat(left(id,3),'****',right(id,4))`.

Desensitizes the input `digital_number` and returns the result after masking desensitization. `digital_number` is `BIGINT` data type.

### example

1. Desensitize the cell phone number

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
