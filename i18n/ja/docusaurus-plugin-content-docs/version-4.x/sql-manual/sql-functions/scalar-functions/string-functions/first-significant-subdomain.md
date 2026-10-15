---
{
    "title": "FIRST_SIGNIFICANT_SUBDOMAIN",
    "language": "ja",
    "description": "URL から「最初の有効なサブドメイン」を抽出して返します。URL が不正な場合は空文字列を返します。"
}
---

## 説明

URL から「最初の有効なサブドメイン」を抽出して返します。URL が不正な場合は空文字列を返します。

## 構文

```sql
FIRST_SIGNIFICANT_SUBDOMAIN ( <url> )
```

## パラメータ

| パラメータ | 説明 |
|-----------|----------------------|
| `<url>`   | 「最初の有効なサブドメイン」を抽出する URL |

## 戻り値

`<url>` に含まれる最初の有効なサブドメインを返します。

## 例

```sql
SELECT FIRST_SIGNIFICANT_SUBDOMAIN("www.baidu.com"),FIRST_SIGNIFICANT_SUBDOMAIN("www.google.com.cn"),FIRST_SIGNIFICANT_SUBDOMAIN("wwwwwwww")
```

```text
+----------------------------------------------+--------------------------------------------------+-----------------------------------------+
| first_significant_subdomain('www.baidu.com') | first_significant_subdomain('www.google.com.cn') | first_significant_subdomain('wwwwwwww') |
+----------------------------------------------+--------------------------------------------------+-----------------------------------------+
| baidu                                        | google                                           |                                         |
+----------------------------------------------+--------------------------------------------------+-----------------------------------------+
```
