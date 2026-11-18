---
{
    "title": "Lance から Doris へのデータ型マッピング",
    "sidebar_label": "Doris のデータ型マッピング",
    "description": "Doris 4.2 における Lance の型マッピングのリファレンス。データ型、精度、ネストした型、サポートされない型を扱います。"
}
---

次の表は、Doris 4.2（`branch-4.2`）における Lance Catalog と Lance ファイル TVF の読み取り時の型マッピングを示します。Doris は Lance への書き込みをサポートしていません。

| Lance / Arrow の型 | Doris の型 | 説明 |
|---|---|---|
| `null`（NULL を許容するフィールド） | `NULL` | すべての値が SQL NULL になります。NULL を許容しない Null フィールドはサポートされません |
| `duration(s/ms/us/ns)` | `BIGINT` | 宣言された単位での符号付きの値を保持し、秒への換算は行いません |
| `bool` | `BOOLEAN` | |
| `int8` | `TINYINT` | |
| `uint8` | `SMALLINT` | 符号なし整数を情報を失わずにより大きな型に変換します |
| `int16` | `SMALLINT` | |
| `uint16` | `INT` | 符号なし整数を情報を失わずにより大きな型に変換します |
| `int32` | `INT` | |
| `uint32` | `BIGINT` | 符号なし整数を情報を失わずにより大きな型に変換します |
| `int64` | `BIGINT` | |
| `uint64` | `LARGEINT` | 符号なし整数を情報を失わずにより大きな型に変換します |
| `float16` | `FLOAT` | 32 ビット浮動小数点値に変換します |
| `float32` | `FLOAT` | |
| `float64` | `DOUBLE` | |
| `decimal128(P,S)` | `DECIMAL(P,S)` | 最大精度は 38 です |
| `decimal256(P,S)` | `DECIMAL(P,S)` | 最大精度は 76 です |
| `utf8`, `large_utf8` | `STRING` | |
| `arrow.json` Extension | `JSON` | 格納型は `utf8` または `large_utf8` である必要があります |
| `lance.json` Extension | `JSON` | 格納型は `large_binary` である必要があります。論理的な JSON 型として読み取ります |
| `lance.bfloat16` Extension | `FLOAT` | 格納型は `fixed_size_binary(2)` である必要があります。精度を失わずに Float32 に変換します |
| `binary`, `large_binary` | `VARBINARY(2147483647)` | |
| `fixed_size_binary(N)` | `VARBINARY(N)` | 固定のバイト幅を維持します |
| `date32(day)`, `date64(ms)` | `DATE` | `date64` の値は完全な暦日を表す必要があります |
| `time32(s)` | `TIME(0)` | |
| `time32(ms)` | `TIME(3)` | |
| `time64(us)`, `time64(ns)` | `TIME(6)` | ナノ秒の精度はマイクロ秒まで切り捨てられます |
| タイムゾーン情報のない `timestamp(s)` | `DATETIME(0)` | Session Time Zone に基づく変換は行われません |
| タイムゾーン情報のない `timestamp(ms)` | `DATETIME(3)` | Session Time Zone に基づく変換は行われません |
| タイムゾーン情報のない `timestamp(us)`, `timestamp(ns)` | `DATETIME(6)` | ナノ秒の精度はマイクロ秒まで切り捨てられます |
| タイムゾーン情報のある `timestamp` | `TIMESTAMPTZ(P)` | 時点を保持し、Doris の Session Time Zone で表示します |
| `struct` | `STRUCT` | 子フィールドの型を再帰的にマッピングします |
| `list`, `large_list`, `fixed_size_list` | `ARRAY` | 要素の型を再帰的にマッピングします |
| `map` | `MAP` | キーと値の型を再帰的にマッピングします |

## 使用上の注意 {#usage-notes}

タイムスタンプの精度 `P` は、秒では 0、ミリ秒では 3、マイクロ秒またはナノ秒では 6 です。Iceberg/Paimon のナノ秒マッピングとは異なり、Lance のナノ秒タイムスタンプは `DATETIME(6)` または `TIMESTAMPTZ(6)` にマッピングされ、マイクロ秒まで切り捨てられます。DECIMAL 型では `1 <= P <= 76` と `0 <= S <= P` を満たす必要があります。負のスケールはサポートされません。

Doris は `ARROW:extension:name` メタデータを通じてこれらの拡張型を認識し、その格納型を検証します。JSON 拡張型は Doris の `JSON`（内部的には `JSONB`）にマッピングされます。JSON テキストを含む通常の `utf8`/`large_utf8` 列は、引き続き `STRING` にマッピングされます。内容によって型が自動的に変わることはありません。JSON を読み取れることは、任意の JSON パス式をプッシュダウンできることを意味しません。サポートされる述語の形式は別途確認する必要があります。

JSON、Duration、Null、BFloat16 を読み取るには、FE と、クエリを処理する BE の両方が対応する型をサポートしている必要があります。古いビルドでは、これらの型がサポートされていないと報告される場合があります。アップグレード時には、スキーマの検出と実際の読み取りの両方を確認してください。

現在、次の型はサポートされていません。

- NULL を許容しない Arrow の `null` フィールド。
- サポート対象として記載されていない Arrow/Lance Extension 型（Lance Blob v2 など）。既知の拡張型でも、格納型に互換性がない場合はサポートされません。
- 子の型を再帰的にマッピングできない複合型。
- Dictionary マーカーを保持している Arrow Dictionary 型。

サポートされていない最上位の列については、Catalog テーブルに対する `DESC` と Lance ファイル TVF に対する `DESC FUNCTION` のどちらも列を保持し、`unknown type: UNSUPPORTED_TYPE` と表示します。複合型の子のいずれかをマッピングできない場合、その最上位の複合型列全体がサポート対象外としてマークされます。サポートされている列だけを射影するクエリは引き続き実行できます。SQL でサポートされていない列を射影すると、Doris は解析時にエラーを報告します。例：

```sql
SELECT * EXCEPT(blob_col)
FROM lance_catalog.default.all_types;
```

:::note
Lance Java SDK の一部のバージョンでは、Schema の読み取り時に Dictionary マーカーが失われ、Dictionary 列が物理的なインデックス型として公開される場合があります。この動作は、Doris が論理的な Dictionary 値をサポートしていることを意味しません。この動作に依存しないでください。
:::

実装の参照先：[LanceTypeConverter.java](https://github.com/apache/doris/blob/bcaaa5f293674f1adba0dfa52c8f8f57fb5e9549/fe/fe-core/src/main/java/org/apache/doris/datasource/lance/metadata/LanceTypeConverter.java)（`branch-4.2`）。
