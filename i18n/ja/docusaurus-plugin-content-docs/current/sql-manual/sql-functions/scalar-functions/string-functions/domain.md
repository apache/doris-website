---
{
    "title": "DOMAIN",
    "language": "ja",
    "description": "文字列の URL からドメイン名を抽出します"
}
---

## 説明

文字列の URL からドメイン名を抽出します。

## 構文

```sql
DOMAIN ( <url> )
```

## パラメータ

| パラメータ | 説明 |
|-----------|--------------------|
| `<url>`   | ドメイン名を抽出する対象の `URL` |

## 戻り値

パラメータ `<url>` のドメイン名。

## 例

```sql
SELECT DOMAIN("https://doris.apache.org/docs/gettingStarted/what-is-apache-doris")
```

```text
+-----------------------------------------------------------------------------+
| domain('https://doris.apache.org/docs/gettingStarted/what-is-apache-doris') |
+-----------------------------------------------------------------------------+
| doris.apache.org                                                            |
+-----------------------------------------------------------------------------+
```
