---
{
    "title": "DOMAIN_WITHOUT_WWW",
    "language": "ja",
    "description": "文字列の URL から www プレフィックスを除いたドメイン名を抽出します"
}
---

## 説明

文字列の URL から www プレフィックスを除いたドメイン名を抽出します。

## 構文

```sql
DOMAIN_WITHOUT_WWW ( <url> )
```

## パラメータ

| パラメータ | 説明 |
|-----------|----------------------|
| `<url>`   | www を除いたドメイン名を抽出する対象の `URL` |

## 戻り値

引数 `<url>` のドメイン名から www プレフィックスを除いた値。

```sql
SELECT DOMAIN_WITHOUT_WWW("https://www.apache.org/docs/gettingStarted/what-is-apache-doris")
```

```text
+---------------------------------------------------------------------------------------+
| domain_without_www('https://www.apache.org/docs/gettingStarted/what-is-apache-doris') |
+---------------------------------------------------------------------------------------+
| apache.org                                                                            |
+---------------------------------------------------------------------------------------+
```
