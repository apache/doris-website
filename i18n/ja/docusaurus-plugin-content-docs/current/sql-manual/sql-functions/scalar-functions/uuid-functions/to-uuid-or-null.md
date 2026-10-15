---
{
    "title": "TO_UUID_OR_NULL",
    "language": "ja",
    "description": "標準形式またはハイフンなしの十六進文字列をUUID型に変換します。無効な文字列やNULL入力に対しては、厳密なキャストモードの設定に関係なくNULLを返します。"
}
---

## 説明

文字列をUUID型に変換します。無効な文字列や`NULL`入力に対しては`NULL`を返します。

## 別名

`toUUIDOrNull`。

## 使用上の注意

入力文字列の変換に失敗した場合の動作は、`enable_strict_cast`の設定に依存しません。

## 構文

```sql
TO_UUID_OR_NULL(<string>)
```

## パラメータ

| パラメータ | 説明 |
| --- | --- |
| `<string>` | CHAR、VARCHAR、STRING型の値。ハイフンを含む36文字の標準形式、または32桁の十六進文字列を受け付けます。英字の大文字・小文字は問いません。波括弧、前後の空白、規定以外の位置にあるハイフンは無効です。 |

## 戻り値

`UUID`型の値を返します。無効な文字列や`NULL`入力に対しては`NULL`を返します。

## 例

```sql
SELECT TO_UUID_OR_NULL('550E8400E29B41D4A716446655440000') AS parsed,
       TO_UUID_OR_NULL('bad') AS invalid,
       TO_UUID_OR_NULL(NULL) AS null_input;
```

```text
+--------------------------------------+---------+------------+
| parsed                               | invalid | null_input |
+--------------------------------------+---------+------------+
| 550e8400-e29b-41d4-a716-446655440000 | NULL    | NULL       |
+--------------------------------------+---------+------------+
```

```sql
SELECT TO_UUID_OR_NULL('{550e8400-e29b-41d4-a716-446655440000}') AS braces,
       TO_UUID_OR_NULL(' 550e8400-e29b-41d4-a716-446655440000') AS leading_space;
```

```text
+--------+---------------+
| braces | leading_space |
+--------+---------------+
| NULL   | NULL          |
+--------+---------------+
```
