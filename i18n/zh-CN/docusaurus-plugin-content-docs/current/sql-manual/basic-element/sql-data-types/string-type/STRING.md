---
{
    "title": "STRING",
    "language": "zh-CN",
    "description": "STRING"
}
---

## description

STRING
    
变长字符串，默认软限制为 10485760 字节（10 MB），可通过 BE 配置项 `string_type_length_soft_limit_bytes` 调整，最大为 2147483643 字节（2 GB）。String 类型只能用于 value 列，不能用于 key 列、分区列或分桶列。
    
注意：变长字符串以 UTF-8 编码存储，因此通常英文字符占 1 字节，中文字符占 3 字节。

## keywords

STRING
