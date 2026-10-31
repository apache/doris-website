---
{
    "title": "DATE | 日時",
    "language": "ja",
    "description": "DATE 型は日付を格納し、値の範囲は [0000-01-01, 9999-12-31] で、既定の出力形式は 'yyyy-MM-dd' です。",
    "sidebar_label": "DATE"
}
---

# DATE {#date}

## 説明 {#description}

DATE 型は日付を格納し、値の範囲は `[0000-01-01, 9999-12-31]` で、`0000-02-29` は除外されます。既定の出力形式は 'yyyy-MM-dd' です。

Doris はグレゴリオ暦の規則を使用し、`0000` 年は紀元前 1 年（BCE 1）を表します。特殊な境界日 `0000-02-29` はサポートされません。

4.1.5 以降、Arrow、Parquet、ORC V2 における DATE のエポック日変換では、零年の最初の二か月にあるオフセットが修正されています。旧 Doris エンコーディングのファイルは自動的に識別できません。`0000-01-01` から `0000-02-28` までの日付を含むファイルについては、書き込み元を特定し、[アップグレードガイド](../../../../admin-manual/cluster-management/upgrade.md#year-zero-date-file-migration) に記載されている方法で移行してください。

DATE 型は主キー、パーティション列、またはバケット列として使用できます。DATE 型のフィールドは、Doris では実際に 4 バイトを使用します。DATE は実行時に年、月、日ごとに個別に格納されるため、DATE 列で `months_add` 演算を実行する方が `unix_timestamp` より効率的です。

他の型を DATE に変換する方法と、変換時に受け入れられる入力については、[DATE への変換](../conversion/date-conversion.md) を参照してください。

日付時刻型では、算術演算に数学演算子を直接使用できません。数学演算を行う際は、まず日付時刻型を暗黙的に数値型へ変換してから演算します。時間型に対して加算、減算、または丸め処理を行う必要がある場合は、[DATE_ADD](../../../sql-functions/scalar-functions/date-time-functions/date-add.md)、[DATE_SUB](../../../sql-functions/scalar-functions/date-time-functions/date-sub.md)、[TIMESTAMPDIFF](../../../sql-functions/scalar-functions/date-time-functions/timestampdiff.md)、[DATE_TRUNC](../../../sql-functions/scalar-functions/date-time-functions/date-trunc.md) などの関数の使用を検討してください。

DATE 型はタイムゾーンを格納しません。つまり、セッション変数 `time_zone` の変更は、格納されている DATE 型の値に影響しません。

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
