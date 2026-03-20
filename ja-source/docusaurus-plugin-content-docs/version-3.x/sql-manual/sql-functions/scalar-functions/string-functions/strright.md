---
{
  "title": "STRRIGHT",
  "description": "STRRIGHT関数は、文字列の右側から指定された文字数を返します。長さはUTF8文字で測定されます。",
  "language": "ja"
}
---
## 説明

STRRIGHT関数は、文字列の右側から指定された数の文字を返します。長さはUTF8文字で測定されます。

## エイリアス

RIGHT

## 構文

```sql
STRRIGHT(<str>, <len>)
```
## パラメータ
| Parameter | デスクリプション                                   |
| --------- | --------------------------------------------- |
| `<str>` | 抽出対象の文字列。型: VARCHAR     |
| `<len>` | 返す文字数。型: INT |

## Return Value

抽出された部分文字列を表すVARCHAR型を返します。

特殊なケース:
- いずれかの引数がNULLの場合、NULLを返します
- lenが負の場合、右からabs(len)番目の文字から始まる部分文字列を返します
- lenが文字列長より大きい場合、文字列全体を返します

## Examples

1. 基本的な使用法

```sql
SELECT strright('Hello doris', 5);
```
```text
+----------------------------+
| strright('Hello doris', 5) |
+----------------------------+
| doris                      |
+----------------------------+
```
2. 負の長さの処理

```sql
SELECT strright('Hello doris', -7);
```
```text
+-----------------------------+
| strright('Hello doris', -7) |
+-----------------------------+
| doris                       |
+-----------------------------+
```
3. NULLパラメータの処理

```sql
SELECT strright('Hello doris', NULL);
```
```text
+-------------------------------+
| strright('Hello doris', NULL) |
+-------------------------------+
| NULL                          |
+-------------------------------+
```
4. NULL文字列の処理

```sql
SELECT strright(NULL, 5);
```
```text
+-------------------+
| strright(NULL, 5) |
+-------------------+
| NULL              |
+-------------------+
```
