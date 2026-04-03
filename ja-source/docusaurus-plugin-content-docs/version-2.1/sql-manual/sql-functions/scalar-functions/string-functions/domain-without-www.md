---
{
  "title": "DOMAIN_WITHOUT_WWW",
  "language": "ja",
  "description": "文字列URLからプレフィックスwwwを除いたドメイン名を抽出する"
}
---
## 説明

文字列URLから接頭辞wwwを除いたドメイン名を抽出します

## 構文

```sql
DOMAIN_WITHOUT_WWW ( <url> )
```
## パラメータ

| パラメータ | 説明 |
|-----------|----------------------|
| `<url>`   | wwwドメイン名を除いた`URL`を抽出する必要があります |

## 戻り値

パラメータ`<url>`のwwwプレフィックスを除いたドメイン名

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
