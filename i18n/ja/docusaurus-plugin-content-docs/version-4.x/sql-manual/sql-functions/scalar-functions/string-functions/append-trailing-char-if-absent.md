---
{
    "title": "APPEND_TRAILING_CHAR_IF_ABSENT",
    "language": "ja",
    "description": "APPENDTRAILINGCHARIFABSENT 関数は、文字列の末尾が指定した文字になるようにします。"
}
---

## 説明

APPEND_TRAILING_CHAR_IF_ABSENT 関数は、文字列の末尾が指定した文字になるようにします。文字列の末尾にその文字がない場合は追加し、すでにある場合は文字列を変更しません。

## 構文

```sql
APPEND_TRAILING_CHAR_IF_ABSENT(<str>, <trailing_char>)
```

## パラメータ

| パラメータ | 説明 |
| ------------------ | ----------------------------------------- |
| `<str>` | 処理対象の文字列。型：VARCHAR |
| `<trailing_char>` | 文字列の末尾に必要な文字。型：VARCHAR |

## 戻り値

VARCHAR 型の値を返します。
- `<trailing_char>` が `<str>` の末尾にない場合、`<str>` と `<trailing_char>` を連結した値を返します。
- `<trailing_char>` が `<str>` の末尾にすでにある場合、元の `<str>` を返します。

特殊なケース：
- いずれかの引数が NULL の場合、NULL を返します。
- `<str>` が空文字列の場合、`<trailing_char>` を返します。

## 例

1. 基本的な使い方：末尾に文字がない場合は追加
```sql
SELECT APPEND_TRAILING_CHAR_IF_ABSENT('a', 'c');
```
```text
+------------------------------------------+
| append_trailing_char_if_absent('a', 'c') |
+------------------------------------------+
| ac                                       |
+------------------------------------------+
```

2. 末尾に文字がすでにある場合は追加しない
```sql
SELECT APPEND_TRAILING_CHAR_IF_ABSENT('ac', 'c');
```
```text
+-------------------------------------------+
| append_trailing_char_if_absent('ac', 'c') |
+-------------------------------------------+
| ac                                        |
+-------------------------------------------+
```

3. 空文字列の処理
```sql
SELECT APPEND_TRAILING_CHAR_IF_ABSENT('', '/');
```
```text
+------------------------------------------+
| append_trailing_char_if_absent('', '/')  |
+------------------------------------------+
| /                                        |
+------------------------------------------+
```

4. NULL 値の処理
```sql
SELECT APPEND_TRAILING_CHAR_IF_ABSENT(NULL, 'c');
```
```text
+-------------------------------------------+
| append_trailing_char_if_absent(NULL, 'c') |
+-------------------------------------------+
| NULL                                      |
+-------------------------------------------+
```

5. UTF-8 文字
```sql
SELECT APPEND_TRAILING_CHAR_IF_ABSENT('acf', 'ṛ');
```
```text
+----------------------------------------------+
| APPEND_TRAILING_CHAR_IF_ABSENT('acf', 'ṛ')   |
+----------------------------------------------+
| acfṛ                                         |
+----------------------------------------------+
```
