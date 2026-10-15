---
{
    "title": "UUID_NUMERIC",
    "language": "ja",
    "description": "LARGEINT 型の UUID を返します"
}
---

## 説明

LARGEINT 型の UUID を返します。

## 構文

```sql
UUID_NUMERIC()
```

## 戻り値

LARGEINT 型の UUID を返します。LARGEINT は Int128 型であるため、uuid_numeric() が負の値を生成する場合があります。

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
