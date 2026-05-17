---
{
    "title": "STRING",
    "language": "zh-CN",
    "description": "STRING"
}
---

## description

STRING
    

变长字符串，默认支持 1048576 字节（1MB），可调大到 2147483643 字节（2G），可通过 be 配置 `string_type_length_soft_limit_bytes`调整。String 类型只能用在 value 列，不能用在 key 列和分区 分桶列
 String 类型只能用在 value 列，不能用在 key 列和分区分桶列。
    

注意：变长字符串是以 UTF-8 编码存储的，因此通常英文字符占 1 个字节，中文字符占 3 个字节。

## keywords

STRING
