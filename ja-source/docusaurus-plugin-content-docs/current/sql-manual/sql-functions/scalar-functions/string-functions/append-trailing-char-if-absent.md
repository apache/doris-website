---
{
  "title": "APPEND_TRAILING_CHAR_IF_ABSENT",
  "language": "ja",
  "description": "APPENDTRAILINGCHARIFABSENT関数は、文字列が指定された文字で終わることを保証します。"
}
---
## 説明

APPEND_TRAILING_CHAR_IF_ABSENT関数は、文字列が指定された文字で終わることを保証します。文字列の末尾にその文字が存在しない場合は追加され、既に存在する場合は文字列は変更されません。

## 構文

```sql
APPEND_TRAILING_CHAR_IF_ABSENT(<str>, <trailing_char>)
```
## パラメータ

| パラメータ | 説明 |
| ------------------ | ----------------------------------------- |
| `<str>` | 処理対象の文字列。型: VARCHAR |
| `<trailing_char>` | 文字列の末尾に存在する必要がある文字。型: VARCHAR |

## 戻り値

VARCHAR型を返します：
- `<trailing_char>`が`<str>`の末尾に存在しない場合、`<str>`と`<trailing_char>`を連結したものを返します
- `<trailing_char>`が既に`<str>`の末尾に存在する場合、元の`<str>`を返します

特殊なケース：
- いずれかの引数がNULLの場合、NULLを返します
- `<str>`が空文字列の場合、`<trailing_char>`を返します

## 例

1. 基本的な使用法: 文字が存在しない場合に文字を追加

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
2. 文字が既に存在するため、追加しない

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
4. NULL値の処理

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
5. UTF-8文字

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
