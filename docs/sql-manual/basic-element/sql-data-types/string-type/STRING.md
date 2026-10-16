---
{
    "title": "STRING",
    "language": "en",
    "description": "A variable length string. Default support is 10485760 bytes (10 MiB), adjustable up to 2147483643 bytes (2G),"
}
---

## STRING
### Description
A variable-length string with a default soft length limit of 10485760 bytes (10 MiB). Configure `string_type_length_soft_limit_bytes` on the BE to increase this limit, up to 2147483643 bytes (approximately 2 GiB). STRING can only be used in value columns, not in key, partition, or bucket columns.

Note: Variable length strings are stored in UTF-8 encoding, so usually English characters occupies 1 byte, and Chinese characters occupies 3 bytes.

### keywords
STRING
