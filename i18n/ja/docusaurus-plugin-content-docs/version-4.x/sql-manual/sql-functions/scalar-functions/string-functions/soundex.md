---
{
  "title": "SOUNDEX",
  "description": "SOUNDEX関数は、文字列のSoundexエンコーディングを計算します。",
  "language": "ja"
}
---
## 説明

SOUNDEX関数は文字列の[Soundexエンコーディング](https://en.wikipedia.org/wiki/Soundex)を計算します。Soundexは英語の単語を発音を表すコードにエンコードする音韻アルゴリズムで、似た発音の単語は同じエンコーディングになります。

エンコーディングルール：大文字1文字とそれに続く3桁の数字から構成される4文字のコードを返します（例：S530）。

## 構文

```sql
SOUNDEX(<expr>)
```
## パラメータ

| Parameter | デスクリプション |
| -------- | ----------------------------------------- |
| `<expr>` | Soundex エンコーディングを計算する文字列（ASCII文字のみサポート）。型：VARCHAR |

## Return Value

VARCHAR(4) 型を返し、文字列の Soundex エンコーディングを表します。

特殊なケース：
- 引数が NULL の場合、NULL を返します
- 文字列が空または文字が含まれていない場合、空の文字列を返します
- ASCII文字のみを処理し、その他の文字は無視します
- 非ASCII文字が含まれている場合、関数はエラーを発生させます

## Examples

1. 基本的な使用法：単語のエンコーディング

```sql
SELECT soundex('Doris');
```
```text
+------------------+
| soundex('Doris') |
+------------------+
| D620             |
+------------------+
```
2. 発音が類似した単語は同じエンコーディングを持つ

```sql
SELECT soundex('Smith'), soundex('Smyth');
```
```text
+------------------+------------------+
| soundex('Smith') | soundex('Smyth') |
+------------------+------------------+
| S530             | S530             |
+------------------+------------------+
```
3. 空文字列の処理

```sql
SELECT soundex('');
```
```text
+-------------+
| soundex('') |
+-------------+
|             |
+-------------+
```
4. NULL値の処理

```sql
SELECT soundex(NULL);
```
```text
+---------------+
| soundex(NULL) |
+---------------+
| NULL          |
+---------------+
```
5. 空文字列は空文字列を返す

```sql
SELECT soundex('');
```
```text
+-------------+
| soundex('') |
+-------------+
|             |
+-------------+
```
6. 文字以外の文字のみの場合は空文字列を返す

```sql
SELECT soundex('123@*%');
```
```text
+-------------------+
| soundex('123@*%') |
+-------------------+
|                   |
+-------------------+
```
7. 文字以外の文字を無視する

```sql
SELECT soundex('R@b-e123rt'), soundex('Robert');
```
```text
+-----------------------+-------------------+
| soundex('R@b-e123rt') | soundex('Robert') |
+-----------------------+-------------------+
| R163                  | R163              |
+-----------------------+-------------------+
```
9. 非ASCII文字のみのエラー例

```sql
SELECT soundex('你好');  
```
```text
ERROR 1105 (HY000): errCode = 2, detailMessage = Not Supported: Not Supported: soundex only supports ASCII, but got: 你
```
```sql
SELECT soundex('Apache Doris 你好');
```
```text
+--------------------------------+
| soundex('Apache Doris 你好')   |
+--------------------------------+
| A123                           |
+--------------------------------+
```
### キーワード

    SOUNDEX
