---
{
  "title": "プロトコル",
  "description": "PROTOCOL関数は主にURL文字列からプロトコル部分を抽出するために使用されます。",
  "language": "ja"
}
---
## 概要

PROTOCOL関数は、主にURL文字列からプロトコル部分を抽出するために使用されます。

## 構文

```sql
PROTOCOL( <url> )
```
## パラメータ

| Parameter      | デスクリプション         |
|---------|------------|
| `<url>` | 解析対象のURL |

## Return Value

<url>のプロトコル部分を返します。特殊なケース：

- いずれかのパラメータがNULLの場合、NULLが返されます。

## Examples

```sql
SELECT protocol('https://doris.apache.org/');
```
```text
+---------------------------------------+
| protocol('https://doris.apache.org/') |
+---------------------------------------+
| https                                 |
+---------------------------------------+
```
```sql
SELECT protocol(null);
```
```text
+----------------+
| protocol(NULL) |
+----------------+
| NULL           |
+----------------+
```
## 相关命令

URLの他の部分を抽出したい場合は、[parse_url](./parse-url.md)を使用できます。
