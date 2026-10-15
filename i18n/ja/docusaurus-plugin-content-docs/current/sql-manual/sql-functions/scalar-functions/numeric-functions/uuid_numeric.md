---
{
    "title": "UUID_NUMERIC",
    "language": "ja",
    "description": "LARGEINT 型の UUID を返します"
}
---

## 説明

LARGEINT 型の UUID を返します。

この関数は引き続き LARGEINT を返します。ネイティブの [UUID 型](../../../basic-element/sql-data-types/uuid.md)によって、この動作が変わることはありません。ネイティブの UUID 値が必要な場合は、[UUID_V4](../uuid-functions/uuid-v4.md) または [UUID_V7](../uuid-functions/uuid-v7.md) を使用してください。

## 構文

```sql
UUID_NUMERIC()
```

## 戻り値

LARGEINT 型の UUID を返します。LARGEINT は Int128 であるため、uuid_numeric() は負の値を返す場合があります。

## 例

```sql
select uuid_numeric()
```

```text
+----------------------------------------+
| uuid_numeric()                         |
+----------------------------------------+
| 82218484683747862468445277894131281464 |
+----------------------------------------+
```
