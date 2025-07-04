---
{
    "title": "Bitwise Operators",
    "language": "en"
}
---

## Description  

Bitwise operators perform specified operations on one or two expressions at the bit level. These operators only accept arguments of the `BIGINT` type. Therefore, any expressions processed by bitwise operators will be converted to the `BIGINT` type.  

## Operator Overview  

| Operator | Function                                                                                     | Example         |  
|----------|----------------------------------------------------------------------------------------------|-----------------|  
| `&`      | Performs a bitwise AND operation. If both corresponding bits are `1`, the result bit is `1`; otherwise, it is `0`. | `SELECT 1 & 2` |  
| `\|`     | Performs a bitwise OR operation. If either corresponding bit is `1`, the result bit is `1`; otherwise, it is `0`.  | `SELECT 1 | 2` |  
| `^`      | Performs a bitwise XOR operation. If the corresponding bits differ, the result bit is `1`; otherwise, it is `0`.   | `SELECT 1 ^ 2` |  
| `~`      | Performs a bitwise NOT operation. Inverts each bit: `1` becomes `0`, and `0` becomes `1`.                          | `SELECT ~1`    |  


