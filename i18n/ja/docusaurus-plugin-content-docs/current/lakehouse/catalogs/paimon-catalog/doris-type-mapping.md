---
{
    "title": "Paimon から Doris へのデータ型マッピング",
    "sidebar_label": "Doris のデータ型マッピング",
    "description": "データ型、精度、ネストした型、サポートされない型を扱う、Doris 4.2 の Paimon 型マッピングのリファレンス。"
}
---

次の表は、Doris 4.2（`branch-4.2`）が Paimon 外部テーブルのスキーマを読み取る際の型マッピングを示します。書き込みは、書き込み先のスキーマとサポートされる書き込み操作にも依存します。読み取り時のマッピングを逆に適用しても、書き込み時のマッピングにはなりません。

| Paimon の型 | Doris の型 | 備考 |
| ---------------------------------- | ------------- | ----------------------------------------------------------------------- |
| boolean | boolean | |
| tinyint | tinyint | |
| smallint | smallint | |
| integer | int | |
| bigint | bigint | |
| float | float | |
| double | double | |
| decimal(P, S) | decimal(P, S) | |
| varchar(N) | VARCHAR(N) / STRING | `VARCHAR(N)` は `N <= 65533` の場合に使用し、それ以外は `STRING` にマッピングします。 |
| char(N) | CHAR(N) / STRING | `CHAR(N)` は `N <= 255` の場合に使用し、それ以外は `STRING` にマッピングします。 |
| binary(N), varbinary(N) | VARBINARY(N) | 宣言されたバイト長を保持します。 |
| date | date | |
| timestamp_without_time_zone(P) | DATETIME(P) / TIMESTAMP_NS | `DATETIME(P)` は `P <= 6` の場合に使用します。4.2 では `P > 6` の場合に `TIMESTAMP_NS` にマッピングし、マイクロ秒未満の精度を保持します。 |
| timestamp\_with\_local\_time\_zone | TIMESTAMPTZ(N) | 4.1.5 以降、この型は常に `TIMESTAMPTZ(N)` にマッピングします。精度の上限は 6 桁で、それを超える精度は失われます。 |
| array | array | |
| map | map | |
| row | struct | |
| variant | VARIANT | 読み取りには FE の設定 `enable_variant_v2=true` が必要です。 |
| time_without_time_zone | UNSUPPORTED | |
| other | UNSUPPORTED | |

## 使用上の注意 {#usage-notes}

複合型の子フィールドにも、同じマッピングを再帰的に適用します。`TIMESTAMPTZ` はある時点を表し、セッションの `time_zone` に従って表示されます。

タイムゾーンのないタイムスタンプとローカルタイムゾーン付きのタイムスタンプでは、精度の扱いが異なります。4.2 では前者のナノ秒精度を保持できますが、後者は小数部が六桁までに制限されます。`TIMESTAMP_NS` の範囲は `1677-09-21 00:12:43.145224192` から `2262-04-11 23:47:16.854775807` までです。

`DESCRIBE table_name` では、Extra 列の `WITH_TIMEZONE` がタイムゾーン情報を持つソースフィールドを示します。

実装の参照先：[PaimonUtil.java](https://github.com/apache/doris/blob/bcaaa5f293674f1adba0dfa52c8f8f57fb5e9549/fe/fe-core/src/main/java/org/apache/doris/datasource/paimon/PaimonUtil.java)（`branch-4.2`）。
