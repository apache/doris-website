---
{
    "title": "Iceberg から Doris へのデータ型マッピング",
    "sidebar_label": "Doris のデータ型マッピング",
    "description": "Doris 4.2 における Iceberg の型マッピングのリファレンス。データ型、精度、ネストされた型、サポートされない型を扱います。"
}
---

次の表は、Doris 4.2（`branch-4.2`）が Iceberg 外部テーブルのスキーマを読み取る際の型マッピングを示します。書き込みは、対象のスキーマとサポートされる書き込み操作にも依存します。読み取り時のマッピングを逆に適用しても、自動的に書き込み時のマッピングにはなりません。

| Iceberg の型 | Doris の型 | 備考 |
| --- | --- | --- |
| boolean | boolean | |
| integer | int | |
| long | bigint | |
| float | float | |
| double | double | |
| decimal(P, S) | decimal(P, S) | |
| date | date | |
| timestamp（タイムゾーンなしの Timestamp） | datetime(6) | 精度 6 の datetime にマッピングされます。 |
| timestamptz（タイムゾーン付きの Timestamp） | TIMESTAMPTZ(6) | 4.1.5 以降、常に `TIMESTAMPTZ(6)` にマッピングされます。精度は最大 6 に制限され、それを超える精度は失われます。 |
| fixed(N) | VARBINARY(N) | 4.1.5 以降、固定長バイナリの長さが保持されます。 |
| string | string | |
| binary | VARBINARY | 4.1.5 以降、常に `VARBINARY` にマッピングされます。 |
| uuid | UUID | 4.2 ではネイティブの `UUID` にマッピングされます。Doris 4.1.5 では `VARBINARY(16)` にマッピングされます。 |
| struct | struct（バージョン 2.1.3 以降でサポート） | |
| map | map（バージョン 2.1.3 以降でサポート） | |
| list | array | |
| timestamp_ns（タイムゾーンなし） | TIMESTAMP_NS | セッションのタイムゾーンに応じた変換を行わず、ナノ秒精度を保持します。 |
| timestamptz_ns（タイムゾーン付き） | UNSUPPORTED | タイムゾーン付きのナノ秒精度のタイムスタンプはサポートされません。 |
| time | UNSUPPORTED | Doris の `TIME` にはマッピングされません。 |
| variant | VARIANT | Iceberg V3 Variant。読み取りに参加する BE が Variant の読み取りをサポートしている必要があります。 |
| other | UNSUPPORTED | |

## 使用上の注意 {#usage-notes}

複合型の子フィールドにも、同じマッピングが再帰的に適用されます。`TIMESTAMPTZ` は特定の時点を表し、セッションの `time_zone` で表示されます。

`timestamp` と `timestamptz` はマイクロ秒精度を使用します。タイムゾーンのない `timestamp_ns` のみが `TIMESTAMP_NS` にマッピングされます。その範囲は `1677-09-21 00:12:43.145224192` から `2262-04-11 23:47:16.854775807` までで、範囲外の値は表現できません。

`DESCRIBE table_name` では、Extra 列の `WITH_TIMEZONE` が、元のフィールドにタイムゾーンがあることを示します。

Iceberg の UUID フィールドに Parquet 形式で書き込む際は、ネストされたフィールドを含め、UUID の論理型アノテーションが保持されます。

実装の参照先：[IcebergUtils.java](https://github.com/apache/doris/blob/bcaaa5f293674f1adba0dfa52c8f8f57fb5e9549/fe/fe-core/src/main/java/org/apache/doris/datasource/iceberg/IcebergUtils.java)（`branch-4.2`）。
