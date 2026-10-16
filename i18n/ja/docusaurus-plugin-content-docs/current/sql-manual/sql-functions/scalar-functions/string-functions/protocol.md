---
{
    "title": "PROTOCOL",
    "language": "ja",
    "description": "PROTOCOL 関数は、主に URL 文字列からプロトコル部分を抽出するために使用します。"
}
---

## 説明

PROTOCOL 関数は、主に URL 文字列からプロトコル部分を抽出するために使用します。

## 構文

```sql
PROTOCOL( <url> )
```

## パラメータ

| パラメータ | 説明 |
|---------|------------|
| `<url>` | 解析する URL |

## 戻り値

<url> のプロトコル部分を返します。特殊なケース:

- 引数が NULL の場合は NULL を返します。

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

## 関連項目

URL の他の部分を抽出するには、[parse_url](./parse-url.md) を使用できます。
