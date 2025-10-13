---
{
    "title": "XOR",
    "language": "zh-CN"
}
---

## 描述
用于对两个 BOOLEAN 值进行按位异或操作。

## 语法
```sql
 <lhs> XOR <rhs>
```

## 参数
| 参数    | 说明           |
|-------|--------------|
| `<lhs>` | 参与运算的第一个 BOOLEAN 值 |
| `<rhs>` | 参与运算的第二个 BOOLEAN 值 |

## 返回值
返回两个 BOOLEAN 值的异或值。

## 示例
```sql
select true XOR false,true XOR true;
```

```text
+------------------+-----------------+
| xor(TRUE, FALSE) | xor(TRUE, TRUE) |
+------------------+-----------------+
|                1 |               0 |
+------------------+-----------------+
```
