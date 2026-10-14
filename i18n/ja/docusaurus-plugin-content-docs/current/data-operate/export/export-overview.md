---
{
    "title": "データエクスポートの概要",
    "language": "ja",
    "description": "Apache Doris のデータエクスポートの概要。クエリ結果セットやテーブルデータを Parquet、ORC、CSV などの形式で HDFS、S3、ローカルファイルシステムにエクスポートする方法を説明します。"
}
---

<!-- Knowledge type: Architecture selection decision -->
<!-- Applicable scenarios: Data export solution selection / Cross-system data exchange -->

データエクスポート機能は、**クエリ結果セット**または **Apache Doris のテーブルデータ**を、指定したファイル形式で指定したストレージシステムに書き出します。結果セットのダウンロードや、異なるシステム間でのデータ交換に使用します。

## データエクスポートとデータバックアップの違い

データエクスポートとデータバックアップは、どちらも Apache Doris のデータを外部ストレージに出力できますが、用途が異なります。主な違いを次の表に示します。

| 比較項目                 | データエクスポート                                                   | データバックアップ                                                   |
| ------------------------ | ---------------------------------------------------------------------- | ----------------------------------------------------------------- |
| 最終的な保存先           | HDFS、オブジェクトストレージ、ローカルファイルシステム               | HDFS、オブジェクトストレージ                                       |
| データ形式               | Parquet、ORC、CSV などのオープンな形式                                | Apache Doris の内部ストレージ形式                                  |
| 実行速度                 | 中程度（データの読み取りと対象形式への変換が必要）                   | 高速（Doris のデータファイルを解析や変換なしで直接アップロード）   |
| 柔軟性                   | SQL を使ってエクスポート範囲を柔軟に指定できる                        | テーブル単位の完全バックアップのみをサポート                       |
| 主な用途                 | 結果セットのダウンロード、異なるシステム間でのデータ交換             | データのバックアップ、Apache Doris クラスター間のデータ移行       |

## エクスポート方法の選択

<!-- Knowledge type: Architecture selection decision -->

Apache Doris は、用途に応じて次の三つのデータエクスポート方法を提供します。

- **[SELECT INTO OUTFILE](./outfile.md)**: 任意の SQL 結果セットをエクスポートできます。
- **[EXPORT](./export-manual.md)**: テーブル単位でデータの一部または全体をエクスポートできます。
- **[MySQL DUMP](./export-with-mysql-dump.md)**: MySQL Dump コマンドと互換性のある方法でデータをエクスポートできます。

### 三つの方法の機能比較

次の表では、実行方式、SQL の対応範囲、並行処理、対応形式などを比較します。用途に合った方法を選ぶ際の参考にしてください。

| 比較項目                 | SELECT INTO OUTFILE                                                          | EXPORT                                                | MySQL DUMP             |
| ------------------------ | ---------------------------------------------------------------------------- | ----------------------------------------------------- | ---------------------- |
| 同期 / 非同期            | 同期                                                                         | 非同期（送信後に `SHOW EXPORT` で進捗を確認）          | 同期                   |
| 任意の SQL に対応        | 対応                                                                         | 非対応                                                | 非対応                 |
| 指定したパーティションのエクスポート | 対応                                                               | 対応                                                  | 非対応                 |
| 指定したタブレットのエクスポート | 対応                                                                  | 非対応                                                | 非対応                 |
| 並行エクスポート         | 対応、高い並行性（`ORDER BY` などの単一ノードで実行するオペレーターによる制約あり） | 対応、高い並行性（Tablet 単位の並行処理） | 非対応、シングルスレッドでエクスポート |
| 対応するエクスポート形式 | Parquet、ORC、CSV                                                            | Parquet、ORC、CSV                                     | MySQL Dump 独自の形式 |
| 外部テーブルに対応       | 対応                                                                         | 一部対応                                              | 非対応                 |
| ビューに対応             | 対応                                                                         | 対応                                                  | 対応                   |
| 対応する出力先           | S3、HDFS                                                                     | S3、HDFS                                              | LOCAL                  |

### 適した利用シナリオ

#### SELECT INTO OUTFILE

次のような場合に適しています。

- エクスポートするデータに、フィルタリング、集計、結合などの複雑な計算が必要な場合。
- 同期タスクとして実行する場合。

詳しい使い方は、[SELECT INTO OUTFILE](./outfile.md) を参照してください。

#### EXPORT

次のような場合に適しています。

- 単純なフィルター条件だけを使って、単一テーブルの大量のデータをエクスポートする場合。
- タスクを非同期で送信する必要がある場合。

詳しい使い方は、[非同期エクスポート](./export-manual.md) を参照してください。

#### MySQL Dump

次のような場合に適しています。

- MySQL エコシステムとの互換性が必要で、テーブルのスキーマとデータの両方をエクスポートする場合。
- 開発、テスト、またはデータ量が非常に少ない場合に限って使用する場合。

詳しい使い方は、[MySQL Dump](./export-with-mysql-dump.md) を参照してください。

## エクスポートしたファイルの列型マッピング

<!-- Knowledge type: Configuration parameters / Type mapping reference -->

Parquet と ORC のファイル形式にはそれぞれデータ型の定義があり、Apache Doris はエクスポート時に内部データ型を対応する Parquet/ORC の型へ自動的に変換します。CSV 形式には型の定義がなく、すべてのデータをテキストとして出力します。

Apache Doris のデータ型と ORC および Parquet の形式との対応を以下に示します。

UUID 値を CSV にエクスポートする場合は、36 文字の小文字の正規形式テキストとして書き出します。Parquet では、UUID 列は Parquet の UUID 論理型アノテーションを付けた `FIXED_LEN_BYTE_ARRAY(16)` として、正規のビッグエンディアンのバイト順で書き込まれます。ORC には標準の UUID 型がないため、ORC では `BINARY` に Doris 固有の `doris.logical_type=uuid` 属性を付けて書き込まれます。ARRAY、MAP、STRUCT にネストされた UUID 要素には、最上位の列と同じ表現が使用されます。Doris が書き込んだ ORC ファイルをテーブル値関数で再読み込みすると、ネイティブの UUID 型が復元されます。一方、Parquet のスキーマ推論では UUID の末端要素は引き続き `STRING`/`VARBINARY` として公開されます。Parquet ファイルを再読み込みする際は、対象列の型を UUID に指定するか、`CAST(value AS UUID)` を使用してください。Iceberg の UUID フィールドへの書き込みについては、[Iceberg の列型マッピング](../../lakehouse/catalogs/iceberg-catalog.mdx#column-type-mapping)を参照してください。

### ORC の型マッピング

| Doris の型               | ORC の型  |
| ----------------------- | --------- |
| boolean                 | boolean   |
| tinyint                 | tinyint   |
| smallint                | smallint  |
| int                     | int       |
| bigint                  | bigint    |
| largeInt                | string    |
| date                    | string    |
| datev2                  | string    |
| datetime                | string    |
| datetimev2              | timestamp |
| float                   | float     |
| double                  | double    |
| char / varchar / string | string    |
| uuid                    | binary    |
| decimal                 | decimal   |
| struct                  | struct    |
| map                     | map       |
| array                   | array     |
| json                    | string    |
| variant                 | string    |
| bitmap                  | binary    |
| quantile_state          | binary    |
| hll                     | binary    |

### Parquet の型マッピング

Apache Doris が Parquet ファイル形式にエクスポートする際は、まずメモリ内の Doris データを Arrow のメモリ内形式に変換し、その後 Arrow が Parquet ファイルに書き込みます。型の対応は次のとおりです。

| Doris の型               | Arrow の型   | Parquet の物理型       | Parquet の論理型                  |
| ----------------------- | ----------- | --------------------- | -------------------------------- |
| boolean                 | boolean     | BOOLEAN               |                                  |
| tinyint                 | int8        | INT32                 | INT_8                            |
| smallint                | int16       | INT32                 | INT_16                           |
| int                     | int32       | INT32                 | INT_32                           |
| bigint                  | int64       | INT64                 | INT_64                           |
| largeInt                | utf8        | BYTE_ARRAY            | UTF8                             |
| date                    | utf8        | BYTE_ARRAY            | UTF8                             |
| datev2                  | date32      | INT32                 | DATE                             |
| datetime                | utf8        | BYTE_ARRAY            | UTF8                             |
| datetimev2              | timestamp   | INT96 / INT64         | TIMESTAMP(MICROS/MILLIS/SECONDS) |
| float                   | float32     | FLOAT                 |                                  |
| double                  | float64     | DOUBLE                |                                  |
| char / varchar / string | utf8        | BYTE_ARRAY            | UTF8                             |
| uuid                    | fixed_size_binary(16) | FIXED_LEN_BYTE_ARRAY | UUID                    |
| decimal                 | decimal128  | FIXED_LEN_BYTE_ARRAY  | DECIMAL(scale, precision)        |
| struct                  | struct      |                       | Parquet Group                    |
| map                     | map         |                       | Parquet Map                      |
| array                   | list        |                       | Parquet List                     |
| json                    | utf8        | BYTE_ARRAY            | UTF8                             |
| variant                 | utf8        | BYTE_ARRAY            | UTF8                             |
| bitmap                  | binary      | BYTE_ARRAY            |                                  |
| quantile_state          | binary      | BYTE_ARRAY            |                                  |
| hll                     | binary      | BYTE_ARRAY            |                                  |

:::note
Parquet Export と Outfile では、`enable_int96_timestamps` プロパティを使用して Doris の `DATETIMEV2` 値の物理エンコーディングを選択します。デフォルトは `false` で、Parquet のタイムスタンプ論理型を付けた `INT64` として書き込みます。`true` に設定して非推奨の `INT96` エンコーディングで書き込むのは、Hive 2 や Hive 3 など、古い下流の読み取り側が必要とする場合に限ってください。非同期 Export はこのプロパティをエクスポートジョブとともに保存し、ジョブの実行時に適用します。その後 Doris が明示的にエクスポートされた `INT96` ファイルを読み取る場合、FileScannerV2 が元の現地時刻の値を復元できるように、Hive Catalog またはファイルのテーブル値関数で `hive.parquet.time-zone` をエクスポートセッションのタイムゾーンに設定してください。
:::

## 関連ドキュメント

- [非同期エクスポート](./export-manual.md): `EXPORT` コマンドを使用して、テーブルまたはパーティションのデータを非同期でエクスポートします。
- [SELECT INTO OUTFILE](./outfile.md): `SELECT INTO OUTFILE` を使用して、クエリ結果を同期的にエクスポートします。
- [MySQL Dump](./export-with-mysql-dump.md): `mysqldump` ツールを使用して、テーブルのスキーマとデータをエクスポートします。
- [データエクスポートのベストプラクティス](./export-best-practice.md): エクスポートの並行処理の調整と、エクスポート速度の評価方法を説明します。
