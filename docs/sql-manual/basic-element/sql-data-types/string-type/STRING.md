---
{
    "title": "STRING",
    "language": "en",
    "description": "A variable-length string. The default soft limit is 10,485,760 bytes (10 MB). You can adjust it with the BE configuration parameter string_type_length_soft_limit_bytes, up to 2,147,483,643 bytes (2 GB)."
}
---

## STRING
### Description
A variable-length string. The default soft limit is 10,485,760 bytes (10 MB). You can adjust it with the BE configuration parameter `string_type_length_soft_limit_bytes`, up to 2,147,483,643 bytes (2 GB). The STRING type can only be used in value columns, not in key, partition, or bucket columns.

Note: Variable-length strings are stored in UTF-8 encoding, so English characters usually occupy 1 byte and Chinese characters usually occupy 3 bytes.

### Keywords
STRING
