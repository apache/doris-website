---
{
    "title": "DATE | 日付と時刻",
    "language": "ja",
    "description": "DATE 型は日付を格納します。値の範囲は [0000-01-01, 9999-12-31] で、デフォルトの出力形式は 'yyyy-MM-dd' です。",
    "sidebar_label": "DATE"
}
---

# DATE {#date}

## 説明 {#description}

DATE 型は日付を格納します。値の範囲は `[0000-01-01, 9999-12-31]` ですが、`0000-02-29` は含まれません。デフォルトの出力形式は 'yyyy-MM-dd' です。

Doris はグレゴリオ暦の規則を使用し、`0000` 年は紀元前1年（BCE 1）を表します。境界上の特別な日付である `0000-02-29` はサポートされません。

4.1.5 以降、DATE の Arrow、Parquet、ORC V2 におけるエポックからの日数への変換で、ゼロ年の最初の二か月に生じるオフセットが修正されています。古い Doris エンコーディングで作成されたファイルは自動的に識別できません。`0000-01-01` から `0000-02-28` までの日付を含むファイルについては、書き込み元を特定し、[アップグレードガイド](../../../../admin-manual/cluster-management/upgrade.md#year-zero-date-file-migration) に従って移行してください。

DATE 型は主キー、パーティション列、バケット列として使用できます。Doris では、DATE 型のフィールドは実際に 4 バイトを占めます。DATE は実行時に年・月・日を別々に保持するため、DATE 列に対する `months_add` の実行は `unix_timestamp` より効率的です。

他の型を DATE に変換する方法と、変換時に受け付けられる入力については、[DATE へのキャスト](../conversion/date-conversion.md)を参照してください。

日付型と時刻型では、算術演算に数学演算子を直接使用することはできません。数学演算を行う際は、まず日付型と時刻型が暗黙的に数値型へ変換され、その後で演算が行われます。時刻型の加算、減算、丸めを行う場合は、[DATE_ADD](../../../sql-functions/scalar-functions/date-time-functions/date-add.md)、[DATE_SUB](../../../sql-functions/scalar-functions/date-time-functions/date-sub.md)、[TIMESTAMPDIFF](../../../sql-functions/scalar-functions/date-time-functions/timestampdiff.md)、[DATE_TRUNC](../../../sql-functions/scalar-functions/date-time-functions/date-trunc.md) などの関数の使用を検討してください。

DATE 型はタイムゾーンを格納しません。そのため、セッション変数 `time_zone` を変更しても、DATE 型に格納された値には影響しません。

## 例 {#examples}

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
