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

### Type aliases and metadata display

`STRING` and `TEXT` define the same Doris type. Different interfaces display that type differently:

| Interface | Display for a `STRING` column |
| --- | --- |
| `SHOW CREATE TABLE` and `DESC` | `text` |
| `information_schema.columns.DATA_TYPE` | `varchar`, for MySQL compatibility |
| `information_schema.columns.COLUMN_TYPE` | `string` |

These names do not change the stored type or its length limit. To distinguish a Doris `STRING` column from a length-limited `VARCHAR` column in metadata, check `COLUMN_TYPE`.
