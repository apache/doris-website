---
{
    "title": "STRING",
    "language": "en"
}
---

## STRING
### Description
STRING (M)
A variable length string, max legnth(default) is 1048576(1MB). The length of the String type is also limited by the configuration `string_type_length_soft_limit_bytes`(a soft limit of string type length) of be, the String type can only be used in the value column, not in the key column and the partition and bucket columns

Note: Variable length strings are stored in UTF-8 encoding, so usually English characters occupies 1 byte, and Chinese characters occupies 3 bytes.

### keywords
STRING
