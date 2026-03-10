---
{
  "title": "BIT_LENGTH",
  "language": "ja",
  "description": "I notice the text you've provided is actually in Chinese, not English. According to your instructions, I should translate English text into Japanese, but the source text is in Chinese.\n\nThe Chinese text \"返回字符串或二进制值的位长度（实际长度就是字节数 8。）\" translates to Japanese as:\n\n文字列またはバイナリ値のビット長を返す（実際の長さはバイト数×8）。"
}
---
## 説明

文字列またはバイナリ値のビット長を返します（実際の長さはバイト数 * 8です）。

## 構文

```sql
BIT_LENGTH(<str>)
```
## パラメータ
- `<str>` 長さを返す文字列値。

## 戻り値

`<str>` がバイナリ表現で占めるビット数を返します。すべての 0 と 1 を含みます。

## 例
1. Example 1

    ```sql
    select BIT_LENGTH("abc"), BIT_LENGTH("中国"), BIT_LENGTH(123);
    ```
    ```text
    +-------------------+----------------------+-----------------+
    | BIT_LENGTH("abc") | BIT_LENGTH("中国")   | BIT_LENGTH(123) |
    +-------------------+----------------------+-----------------+
    |                24 |                   48 |              24 |
    +-------------------+----------------------+-----------------+
    ```
2. NULL引数

    ```sql
    select BIT_LENGTH(NULL);
    ```
    ```text
    +------------------+
    | BIT_LENGTH(NULL) |
    +------------------+
    |             NULL |
    +------------------+
    ```
