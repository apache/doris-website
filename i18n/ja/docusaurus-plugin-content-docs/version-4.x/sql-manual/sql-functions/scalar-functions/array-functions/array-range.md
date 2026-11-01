---
{
    "title": "ARRAY_RANGE",
    "language": "ja",
    "description": "数値または日時の等差数列配列を生成します。"
}
---

<a id="function"></a>

## 説明 {#description}

数値または日時の等差数列配列を生成します。結果には開始値が含まれ、終了値は含まれません。いずれかの引数が NULL の場合は NULL を返します。

Doris 4.1 系列では 4.1.5 以降、日時シーケンスは、最後の値と終了値の間隔が完全な間隔に満たない場合でも、終了値未満の有効な値をすべて保持します。以前のバージョンでは、これらの末尾の値が省略されることがありました。

## 構文 {#syntax}

```sql
ARRAY_RANGE(<end>)
ARRAY_RANGE(<start>, <end> [, <step>])
ARRAY_RANGE(<start_dt>, <end_dt> [, INTERVAL <step> <unit>])
```

## パラメーター {#parameters}

| パラメーター | 説明 |
| --- | --- |
| `<start>` | オプションの非負 INT 型の開始値。デフォルトは 0。 |
| `<end>` | 非負 INT 型の終了値。結果には含まれません。 |
| `<step>` | オプションの正の整数ステップ。デフォルトは 1。 |
| `<start_dt>`、`<end_dt>` | DATETIME 型の開始値と終了値。終了値は含まれません。INTERVAL を指定しない場合、ステップは 1 DAY です。 |
| `<unit>` | 日時ステップの単位：YEAR、QUARTER、MONTH、WEEK、DAY、HOUR、MINUTE、SECOND。 |

## 戻り値 {#return-value}

ARRAY を返します。数値シーケンスの要素は INT、日時シーケンスの要素は DATETIME です。

<a id="usage-notes"></a>

- いずれかの引数が NULL または無効（数値の開始値または終了値が負、ステップが正でないなど）の場合、NULL を返します。
- 開始値が終了値以上の場合、空の配列 `[]` を返します。
- 各後続値は直前の値から計算されます。月の計算では、日付が対象月の最終日に調整されることがあります。
- シーケンスが配列サイズの上限を超えると、エラーになります。後続値が日付型の範囲を超える場合、最後の有効な値の後で生成を停止します。
- `SEQUENCE` は `ARRAY_RANGE` の別名です。

<a id="examples"></a>

## 例 {#example}

数値シーケンスでは終了値を含みません。

```sql
SELECT ARRAY_RANGE(5), ARRAY_RANGE(2, 6, 2), ARRAY_RANGE(3, 2);
```

```text
[0, 1, 2, 3, 4]    [2, 4]    []
```

日時シーケンスでは、デフォルトのステップは日単位です。終了値までの残りが一日未満でも、最後の値は保持されます。

```sql
SELECT ARRAY_RANGE(
    CAST('2024-01-01 00:00:00.000000' AS DATETIME(6)),
    CAST('2024-01-02 12:00:00.000000' AS DATETIME(6)));
```

```text
["2024-01-01 00:00:00.000000", "2024-01-02 00:00:00.000000"]
```

月単位のステップでは、直前に生成された日付を基準に増分します。

```sql
SELECT ARRAY_RANGE(
    CAST('2020-01-31 00:00:00' AS DATETIME(6)),
    CAST('2020-03-30 00:00:00' AS DATETIME(6)), INTERVAL 1 MONTH);
```

```text
["2020-01-31 00:00:00.000000", "2020-02-29 00:00:00.000000", "2020-03-29 00:00:00.000000"]
```

`SEQUENCE` も同じルールを使用します。

```sql
SELECT SEQUENCE(
    CAST('2024-01-01 00:00:00.000000' AS DATETIME(6)),
    CAST('2024-01-01 00:00:01.500000' AS DATETIME(6)), INTERVAL 1 SECOND);
```

```text
["2024-01-01 00:00:00.000000", "2024-01-01 00:00:01.000000"]
```

NULL または無効な引数：

```sql
SELECT ARRAY_RANGE(NULL), ARRAY_RANGE(-1, 3), ARRAY_RANGE(1, 3, 0);
```

```text
NULL    NULL    NULL
```
