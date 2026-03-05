---
{
    "title": "DECIMAL",
    "language": "en"
}
---

## DECIMAL
### Description
DECIMAL (M [,D])

High-precision fixed-point, M stands for the total number of significant numbers (precision), D stands for the maximum number of decimal points (scale).
The range of M is [1, 27], the range of D is [0, 9], the integer part is [1, 18].

in addition, M must be greater than or equal to the value of D. 

The default value is DECIMAL(9, 0).

### note
We intend to delete this type in 2024. At this stage, Doris prohibits creating tables containing the `DECIMAL` type by default. If you need to use it, you need to add `disable_decimalv2 = false` in the FE's config and restart the FE.

### keywords
DECIMAL
