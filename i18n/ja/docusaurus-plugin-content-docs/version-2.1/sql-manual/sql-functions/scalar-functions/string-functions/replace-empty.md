---
{
  "title": "I notice that the text you provided contains \"REPLACE_EMPTY\" which appears to be a placeholder rather than actual content to translate. Could you please provide the actual English text that you would like me to translate into Japanese?",
  "language": "ja",
  "description": "REPLACEEMPTY関数は、文字列内の文字の一部を他の文字に置き換えるために使用されます。REPLACE関数とは異なり、"
}
---
## 説明

REPLACE_EMPTY関数は、文字列内の文字の一部を他の文字で置換するために使用されます。[REPLACE](./replace.md)関数とは異なり、oldが空文字列の場合、新しい文字列はstr文字列の各文字の前とstr文字列の末尾に挿入されます。

これ以外は、すべての動作がREPLACE()関数と全く同じです。

この関数は主にPrestoとTrinoとの互換性のために使用され、その動作はPrestoとTrinoの`REPLACE()`関数と全く同じです。

バージョン2.1.5以降でサポートされています。

## 構文

```sql
REPLACE_EMPTY ( <str>, <old>, <new> )
```
## Parameters

| Parameter      | Description                                                                                                                                                                                                         |
|---------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `<str>` | 置換が必要な文字列。                                                                                                                                                                               |
| `<old>` | 置換が必要な部分文字列。`<old>` が `<str>` に存在しない場合、置換は実行されません。`<old>` が空文字列の場合、`<new>` 文字列が str 文字列の各文字の前に挿入されます。 |
| `<new>` | `<old>` を置換するために使用される新しい部分文字列。                                                                                                                                                                           |

## Return Value

部分文字列を置換した後の新しい文字列を返します。特別なケース：

- いずれかの Parameter が NULL の場合、NULL が返されます。
- `<old>` が空文字列の場合、`<str>` 文字列の各文字の前に `<new>` 文字列が挿入された文字列が返されます。

## Examples

```sql
SELECT replace('hello world', 'world', 'universe');
```
```text
+---------------------------------------------+
| replace('hello world', 'world', 'universe') |
+---------------------------------------------+
| hello universe                              |
+---------------------------------------------+
```
```sql
SELECT replace_empty("abc", '', 'xyz');
```
```text
+---------------------------------+
| replace_empty('abc', '', 'xyz') |
+---------------------------------+
| xyzaxyzbxyzcxyz                 |
+---------------------------------+
```
```sql
SELECT replace_empty("", "", "xyz");
```
```text
+------------------------------+
| replace_empty('', '', 'xyz') |
+------------------------------+
| xyz                          |
+------------------------------+
```
