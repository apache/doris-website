---
{
    "title": "UNICODE_NORMALIZE",
    "language": "ja",
    "description": "入力文字列を Unicode 正規化します。"
}
---

## 説明

入力文字列を [Unicode 正規化](https://unicode-org.github.io/icu/userguide/transforms/normalization/)します。

Unicode 正規化とは、等価な Unicode 文字列を統一された形式に変換する処理です。たとえば、文字「é」は単一のコードポイント（U+00E9）でも、「e」と結合アキュートアクセント（U+0065 + U+0301）の組み合わせでも表せます。正規化すると、これらの等価な表現を同じように扱えます。

## 構文

```sql
UNICODE_NORMALIZE(<str>, <mode>)
```

## パラメータ

| パラメータ | 説明 |
|-----------|-------------|
| `<str>` | 正規化する入力文字列。型: VARCHAR |
| `<mode>` | 正規化モード。定数文字列で指定します（大文字と小文字は区別しません）。サポートするモード:<br/>- `NFC`: 正規分解した後、正規合成する<br/>- `NFD`: 正規分解する<br/>- `NFKC`: 互換分解した後、正規合成する<br/>- `NFKD`: 互換分解する<br/>- `NFKC_CF`: NFKC を適用した後、ケースフォールディングする |

## 戻り値

入力文字列を正規化した結果を VARCHAR 型で返します。

## 例

1. NFC と NFD の違い（合成済み文字と分解済み文字）

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

2. NFKC_CF によるケースフォールディング

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

3. NFKC による全角文字の処理（互換分解）

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

5. 丸数字の処理

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

6. 同じ文字列に異なるモードを適用した結果の比較

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

7. 文字列の等価性を比較する例

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
