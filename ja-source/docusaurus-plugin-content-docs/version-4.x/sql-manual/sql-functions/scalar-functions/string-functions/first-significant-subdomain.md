---
{
  "title": "FIRST_SIGNIFICANT_SUBDOMAIN",
  "description": "URLから「最初の有効なサブドメイン」を抽出して返します。不正な場合は、空文字列が返されます。",
  "language": "ja"
}
---
## デスクリプション

URLから「最初の有効なサブドメイン」を抽出して返します。不正な場合は、空文字列が返されます。

## Syntax

```sql
FIRST_SIGNIFICANT_SUBDOMAIN ( <url> )
```
## パラメータ

| Parameter | デスクリプション |
|-----------|----------------------|
| `<url>`   | "first valid subdomain"を抽出する対象のURL |

## Return value

`<url>`内の最初の有効なサブドメイン。

## Example

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
