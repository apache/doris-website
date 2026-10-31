---
{
    "title": "DIGITAL_MASKING",
    "language": "en"
}
---

### description

An alias function with the original function being `CONCAT(LEFT(id,3),'****',RIGHT(id,4))`. Performs data masking on the input `digital_number` and returns the masked result. 

### Syntax

```sql
digital_masking(digital_number)
```

### example

Desensitize the cell phone number

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
