---
{
  "title": "UNICODE_NORMALIZE",
  "language": "ja",
  "description": "入力文字列に対してUnicode正規化を実行します。"
}
---
## 詳細

入力文字列に対して[Unicode Normalization](https://unicode-org.github.io/icu/userguide/transforms/normalization/)を実行します。

Unicode正規化は、等価なUnicode文字シーケンスを統一された形式に変換するプロセスです。例えば、文字「é」は、単一のコードポイント（U+00E9）または「e」+結合鋭アクセント（U+0065 + U+0301）で表現できます。正規化により、これらの等価な表現が統一的に処理されることが保証されます。

## Syntax

```sql
UNICODE_NORMALIZE(<str>, <mode>)
```
## パラメータ

| パラメータ | 説明 |
|-----------|-------------|
| `<str>` | 正規化する入力文字列。型: VARCHAR |
| `<mode>` | 正規化モード。定数文字列である必要があります（大文字小文字を区別しません）。サポートされているモード:<br/>- `NFC`: 正準分解、その後正準合成<br/>- `NFD`: 正準分解<br/>- `NFKC`: 互換分解、その後正準合成<br/>- `NFKD`: 互換分解<br/>- `NFKC_CF`: NFKC の後にCase Folding |

## 戻り値

VARCHAR型を返します。入力文字列の正規化結果を表します。

## 例

1. NFCとNFDの違い（合成文字 vs 分解文字）

```sql
-- 'Café' where é may be in composed form, NFD will decompose it into e + combining accent
SELECT length(unicode_normalize('Café', 'NFC')) AS nfc_len, length(unicode_normalize('Café', 'NFD')) AS nfd_len;
```
```text
+---------+---------+
| nfc_len | nfd_len |
+---------+---------+
|       4 |       5 |
+---------+---------+
```
2. ケースフォールディング用のNFKC_CF

```sql
SELECT unicode_normalize('ABC 123', 'nfkc_cf') AS result;
```
```text
+---------+
| result  |
+---------+
| abc 123 |
+---------+
```
3. 全角文字を処理するNFKC（互換分解）

```sql
-- Fullwidth digits '１２３' will be converted to halfwidth '123'
SELECT unicode_normalize('１２３ＡＢＣ', 'NFKC') AS result;
```
```text
+--------+
| result |
+--------+
| 123ABC |
+--------+
```
4. NFKD による特殊記号の処理（互換分解）

```sql
-- ℃ (degree Celsius symbol) will be decomposed to °C
SELECT unicode_normalize('25℃', 'NFKD') AS result;
```
```text
+--------+
| result |
+--------+
| 25°C   |
+--------+
```
5. 丸囲み数字の処理

```sql
-- ① ② ③ circled numbers will be converted to regular digits
SELECT unicode_normalize('①②③', 'NFKC') AS result;
```
```text
+--------+
| result |
+--------+
| 123    |
+--------+
```
6. 同じ文字列に対する異なるモードの比較

```sql
SELECT 
    unicode_normalize('ﬁ', 'NFC') AS nfc_result,
    unicode_normalize('ﬁ', 'NFKC') AS nfkc_result;
```
```text
+------------+-------------+
| nfc_result | nfkc_result |
+------------+-------------+
| ﬁ          | fi          |
+------------+-------------+
```
7. 文字列等価比較シナリオ

```sql
-- Use normalization to compare visually identical but differently encoded strings
SELECT unicode_normalize('café', 'NFC') = unicode_normalize('café', 'NFC') AS is_equal;
```
```text
+----------+
| is_equal |
+----------+
|        1 |
+----------+
```
