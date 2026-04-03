---
{
  "title": "プロトコル",
  "language": "ja",
  "description": "PROTOCOL関数は主にURL文字列からプロトコル部分を抽出するために使用されます。"
}
---
## 説明

PROTOCOL関数は、主にURL文字列からプロトコル部分を抽出するために使用されます。

## 構文

```sql
PROTOCOL( <url> )
```
## パラメータ

| Parameter      | Description         |
|---------|------------|
| `<url>` | 解析するURL |

## 戻り値

<url>のプロトコル部分を返します。特殊なケース：

- いずれかのパラメータがNULLの場合、NULLが返されます。

## 例

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

URLの他の部分を抽出したい場合は、[parse_url](./parse-url.md) を使用できます。
