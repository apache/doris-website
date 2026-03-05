---
{
    "title": "STRING",
    "language": "zh-CN"
}
---

## STRING
## 描述
    STRING
    变长字符串，最大（默认）支持1048576 字节（1MB）。String类型的长度还受 be 配置  `string_type_length_soft_limit_bytes`(字符串类型长度的软限制), String类型只能用在value 列，不能用在 key 列和分区 分桶列
    
    注意：变长字符串是以UTF-8编码存储的，因此通常英文字符占1个字节，中文字符占3个字节。

### keywords

    STRING
