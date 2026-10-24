---
{
    "title": "ARRAY_RANGE",
    "language": "ja",
    "description": "数値または日時の等間隔の配列を生成します。"
}
---

<a id="function"></a>

## 説明 {#description}

数値または日時の等間隔の配列を生成します。結果には開始値が含まれ、終了値は含まれません。いずれかの引数が NULL の場合は NULL を返します。

Doris 4.1 系列の 4.1.5 以降では、日時の配列について、終了値までの残りが間隔に満たない場合でも、終了値より前の有効な値をすべて保持します。それ以前のバージョンでは、末尾の値が省略されることがありました。

## 構文 {#syntax}

```sql
ARRAY_RANGE(<end>)
ARRAY_RANGE(<start>, <end> [, <step>])
ARRAY_RANGE(<start_dt>, <end_dt> [, INTERVAL <step> <unit>])
```

## パラメータ {#parameters}

| パラメータ | 説明 |
| --- | --- |
| `<start>` | 省略可能な非負の INT 開始値。デフォルトは 0 です。 |
| `<end>` | 非負の INT 終了値。結果には含まれません。 |
| `<step>` | 省略可能な正の整数の間隔。デフォルトは 1 です。 |
| `<start_dt>`, `<end_dt>` | DATETIME または TIMESTAMP_NS の開始値と終了値。両方の引数は同じ型である必要があります。終了値は含まれません。INTERVAL を指定しない場合、間隔は 1 DAY です。 |
| `<unit>` | 日時の間隔の単位：YEAR、QUARTER、MONTH、WEEK、DAY、HOUR、MINUTE、SECOND。 |

## 戻り値 {#return-value}

ARRAY を返します。数値の配列の要素は INT 型、日時の配列の要素は入力と同じ DATETIME 型または TIMESTAMP_NS 型です。

<a id="usage-notes"></a>

- いずれかの引数が NULL または無効な場合は、NULL を返します。無効な引数には、負の数値の開始値や終了値、正でない間隔などがあります。
- 開始値が終了値以上の場合は、空の配列 `[]` を返します。
- 後続の値は、それぞれ直前の値から計算されます。月単位の計算では、日付が移動先の月の末日に調整されることがあります。
- 配列がサイズの上限を超える場合は、エラーを報告します。次の値が日付型の範囲を超える場合は、最後の有効な値を生成した時点で停止します。
- `SEQUENCE` は `ARRAY_RANGE` の別名です。

<a id="examples"></a>

## 例 {#example}

数値の配列には終了値が含まれません：

```sql
SELECT ARRAY_RANGE(5), ARRAY_RANGE(2, 6, 2), ARRAY_RANGE(3, 2);
```

```text
[0, 1, 2, 3, 4]    [2, 4]    []
```

日時の配列では、デフォルトの間隔は一日です。終了値までの残りが一日未満でも、最後の値は保持されます：

```sql
SELECT ARRAY_RANGE(
    CAST('2024-01-01 00:00:00.000000' AS DATETIME(6)),
    CAST('2024-01-02 12:00:00.000000' AS DATETIME(6)));
```

```text
["2024-01-01 00:00:00.000000", "2024-01-02 00:00:00.000000"]
```

月単位の間隔では、直前に生成された日付から次の日付を計算します：

```sql
SELECT ARRAY_RANGE(
    CAST('2020-01-31 00:00:00' AS DATETIME(6)),
    CAST('2020-03-30 00:00:00' AS DATETIME(6)), INTERVAL 1 MONTH);
```

```text
["2020-01-31 00:00:00.000000", "2020-02-29 00:00:00.000000", "2020-03-29 00:00:00.000000"]
```

`SEQUENCE` にも同じ規則が適用されます：

```sql
SELECT SEQUENCE(
    CAST('2024-01-01 00:00:00.000000' AS DATETIME(6)),
    CAST('2024-01-01 00:00:01.500000' AS DATETIME(6)), INTERVAL 1 SECOND);
```

```text
["2024-01-01 00:00:00.000000", "2024-01-01 00:00:01.000000"]
```

NULL または無効な引数の場合：

```sql
SELECT ARRAY_RANGE(NULL), ARRAY_RANGE(-1, 3), ARRAY_RANGE(1, 3, 0);
```

```text
NULL    NULL    NULL
```

TIMESTAMP_NS 型の入力では、ナノ秒の精度が保持されます：

```sql
SELECT ARRAY_RANGE(
    CAST('2022-05-15 12:00:00.123456789' AS TIMESTAMP_NS),
    CAST('2022-05-15 12:00:02.123456789' AS TIMESTAMP_NS), INTERVAL 1 SECOND);
```

```text
["2022-05-15 12:00:00.123456789", "2022-05-15 12:00:01.123456789"]
```
