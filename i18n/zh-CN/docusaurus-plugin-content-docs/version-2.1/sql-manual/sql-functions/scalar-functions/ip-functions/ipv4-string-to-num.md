---
{
    "title": "IPV4_STRING_TO_NUM",
    "language": "zh-CN",
    "description": "获取包含 IPv4 地址的字符串，格式为 A.B.C.D（点分隔的十进制数字）。返回一个 BIGINT 数字，表示相应的大端 IPv4 地址。"
}
---

## 描述
获取包含 IPv4 地址的字符串，格式为 A.B.C.D（点分隔的十进制数字）。返回一个 BIGINT 数字，表示相应的大端 IPv4 地址。

## 语法
```sql
IPV4_STRING_TO_NUM(<ipv4_string>)
```
## 参数
| Parameter | Description                                      |
|-----------|--------------------------------------------------|
| `<ipv4_string>`      | 字符串类型的 ipv4 地址，例如 'A.B.C.D'  |

## 返回值
返回一个 BIGINT 数字，表示相应的大端 IPv4 地址
- 如果输入字符串不是有效的 IPv4 地址或者 `NULL`，将返回错误

## 举例
```sql
select ipv4_string_to_num('192.168.0.1'); 
```
```text
+-----------------------------------+ 
| ipv4_string_to_num('192.168.0.1') | 
+-----------------------------------+ 
| 3232235521                        | 
+-----------------------------------+ 
```

```sql
select ipv4_string_to_num('invalid');
```
```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (172.17.0.2)[CANCELLED][INVALID_ARGUMENT][E33] Invalid IPv4 value
```
