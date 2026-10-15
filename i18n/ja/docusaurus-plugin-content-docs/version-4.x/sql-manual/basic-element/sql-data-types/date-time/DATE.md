---
{
    "title": "DATE | 日付と時刻",
    "language": "ja",
    "description": "DATE 型は日付を格納します。値の範囲は [0000-01-01, 9999-12-31] で、デフォルトの出力形式は 'yyyy-MM-dd' です。",
    "sidebar_label": "DATE"
}
---

# DATE

## 説明

DATE 型は日付を格納します。値の範囲は `[0000-01-01, 9999-12-31]` で、デフォルトの出力形式は 'yyyy-MM-dd' です。

Doris ではグレゴリオ暦の日付形式を使用しており、グレゴリオ暦上の日付と Doris 上の日付は一対一に対応します。`0000` は紀元前 1 年（BCE 1）を表します。

DATE 型は主キー、パーティション列、バケット列として使用できます。Doris では、DATE 型のフィールドは実際には 4 バイトを占有します。DATE は実行時に年、月、日を分けて格納するため、DATE 列に対する `months_add` 演算は `unix_timestamp` より効率的です。

他の型を DATE に変換する方法と、変換時に受け付ける入力については、[DATE へのキャスト](../conversion/date-conversion.md) を参照してください。

日付・時刻型では、算術演算に数学演算子を直接使用できません。数学演算を行う際には、まず日付・時刻型が暗黙的に数値型へ変換され、その後に演算が行われます。時刻型の加減算や丸めを行う場合は、[DATE_ADD](../../../sql-functions/scalar-functions/date-time-functions/date-add.md)、[DATE_SUB](../../../sql-functions/scalar-functions/date-time-functions/date-sub.md)、[TIMESTAMPDIFF](../../../sql-functions/scalar-functions/date-time-functions/timestampdiff.md)、[DATE_TRUNC](../../../sql-functions/scalar-functions/date-time-functions/date-trunc.md) などの関数の使用を検討してください。

DATE 型はタイムゾーンを保存しません。したがって、セッション変数 `time_zone` を変更しても、DATE 型に格納された値には影響しません。

## 例

```sql
select cast('2020-01-02' as date);
```

```text
+----------------------------+
| cast('2020-01-02' as date) |
+----------------------------+
| 2020-01-02                 |
+----------------------------+
```

```sql
select cast('0120-02-29' as date);
```

```text
+----------------------------+
| cast('0120-02-29' as date) |
+----------------------------+
| 0120-02-29                 |
+----------------------------+
```
