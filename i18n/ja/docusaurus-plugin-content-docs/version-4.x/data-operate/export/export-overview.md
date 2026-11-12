---
{
    "title": "データエクスポートの概要",
    "language": "ja",
    "description": "Apache Doris のデータエクスポートの概要。クエリ結果セットやテーブルデータを Parquet、ORC、CSV などの形式で HDFS、S3、ローカルファイルシステムにエクスポートする方法を説明します。"
}
---

<!-- Knowledge type: Architecture selection decision -->
<!-- Applicable scenarios: Data export solution selection / Cross-system data exchange -->

データエクスポート機能は、**クエリ結果セット**または **Apache Doris のテーブルデータ**を、指定したファイル形式で指定したストレージシステムに書き出します。主に結果セットのダウンロードやシステム間のデータ交換に使用します。

## データエクスポートとデータバックアップの違い {#data-export-vs-data-backup}

データエクスポートとデータバックアップは、どちらも Apache Doris から外部ストレージにデータを出力できますが、用途が異なります。主な違いを次の表に示します。

| 比較項目                 | データエクスポート                                                     | データバックアップ                                                |
| ------------------------ | ---------------------------------------------------------------------- | ----------------------------------------------------------------- |
| 出力先                   | HDFS、オブジェクトストレージ、ローカルファイルシステム                 | HDFS、オブジェクトストレージ                                      |
| データ形式               | Parquet、ORC、CSV などのオープンな形式                                 | Apache Doris の内部ストレージ形式                                 |
| 実行速度                 | 中程度（データの読み取りと出力先の形式への変換が必要）                 | 高速（Doris のデータファイルを直接アップロードし、解析や変換は不要） |
| 柔軟性                   | SQL でエクスポート範囲を柔軟に指定できる                               | テーブル単位の完全バックアップのみをサポート                      |
| 主な用途                 | 結果セットのダウンロード、異なるシステム間のデータ交換                 | データのバックアップ、Apache Doris クラスター間のデータ移行       |

## エクスポート方法の選択 {#choosing-an-export-method}

<!-- Knowledge type: Architecture selection decision -->

Apache Doris には、用途に応じて選べる次の三つのデータエクスポート方法があります。

- **[SELECT INTO OUTFILE](./outfile.md)**: 任意の SQL 結果セットをエクスポートできます。
- **[EXPORT](./export-manual.md)**: テーブル単位でデータの一部または全体をエクスポートできます。
- **[MySQL DUMP](./export-with-mysql-dump.md)**: MySQL Dump コマンドと互換性のあるデータエクスポート方法です。

### 三つの方法の機能比較 {#capability-comparison-of-the-three-methods}

実行方式、SQL の機能、同時実行、対応形式について、三つのエクスポート方法を次の表で比較します。

| 比較項目                 | SELECT INTO OUTFILE                                                          | EXPORT                                                | MySQL DUMP             |
| ------------------------ | ---------------------------------------------------------------------------- | ----------------------------------------------------- | ---------------------- |
| 同期 / 非同期            | 同期                                                                         | 非同期（送信後、`SHOW EXPORT` で進捗を確認）          | 同期                   |
| 任意の SQL をサポート    | 対応                                                                         | 非対応                                                | 非対応                 |
| 指定したパーティションのエクスポート | 対応                                                              | 対応                                                  | 非対応                 |
| 指定した Tablet のエクスポート | 対応                                                                   | 非対応                                                | 非対応                 |
| 同時エクスポート         | 対応、高い同時実行性（`ORDER BY` など単一ノードの演算子による制約あり）      | 対応、高い同時実行性（Tablet 単位で同時実行）         | 非対応、シングルスレッドでエクスポート |
| 対応する出力形式         | Parquet、ORC、CSV                                                            | Parquet、ORC、CSV                                     | MySQL Dump 独自形式    |
| 外部テーブルをサポート   | 対応                                                                         | 一部対応                                              | 非対応                 |
| ビューをサポート         | 対応                                                                         | 対応                                                  | 対応                   |
| 対応する出力先           | S3、HDFS                                                                     | S3、HDFS                                              | LOCAL                  |

### 適した用途 {#applicable-scenarios}

#### SELECT INTO OUTFILE {#select-into-outfile}

次のような場合に適しています。

- エクスポートするデータに、フィルタリング、集計、結合などの複雑な処理が必要な場合。
- タスクを同期的に実行したい場合。

詳しい使い方は、[SELECT INTO OUTFILE](./outfile.md) を参照してください。

#### EXPORT {#export}

次のような場合に適しています。

- 単純なフィルター条件だけを使い、大量のデータを単一のテーブルからエクスポートする場合。
- タスクを非同期で送信したい場合。

詳しい使い方は、[EXPORT による非同期エクスポート](./export-manual.md) を参照してください。

#### MySQL Dump {#mysql-dump}

次のような場合に適しています。

- MySQL エコシステムとの互換性が必要で、テーブルのスキーマとデータの両方をエクスポートする場合。
- 開発、テスト、またはデータ量がごく少ない場合に限って使用する場合。

詳しい使い方は、[MySQL Dump](./export-with-mysql-dump.md) を参照してください。

## エクスポートしたファイルの列の型マッピング {#column-type-mapping-for-exported-files}

<!-- Knowledge type: Configuration parameters / Type mapping reference -->

Parquet と ORC のファイル形式にはそれぞれ独自のデータ型定義があります。エクスポート時、Apache Doris は内部のデータ型を対応する Parquet または ORC の型に自動変換します。CSV には型定義がなく、すべてのデータがテキストとして出力されます。

Apache Doris のデータ型と ORC および Parquet の形式との対応を以下に示します。

### ORC の型マッピング {#orc-type-mapping}

| Doris の型              | ORC の型  |
| ----------------------- | --------- |
| boolean                 | boolean   |
| tinyint                 | tinyint   |
| smallint                | smallint  |
| int                     | int       |
| bigint                  | bigint    |
| largeInt                | string    |
| date                    | string    |
| datev2                  | date      |
| datetime                | string    |
| datetimev2              | timestamp |
| timestamptz | timestamp with local time zone (ORC TIMESTAMP_INSTANT; 4.1.5 以降、時点の意味を保持) |
| varbinary | binary |
| float                   | float     |
| double                  | double    |
| char / varchar / string | string    |
| decimal                 | decimal   |
| struct                  | struct    |
| map                     | map       |
| array                   | array     |
| json                    | string    |
| variant                 | string    |
| bitmap                  | binary    |
| quantile_state          | binary    |
| hll                     | binary    |

### Parquet の型マッピング {#parquet-type-mapping}

Apache Doris が Parquet ファイル形式にエクスポートする際は、まずメモリ内の Doris データを Arrow のメモリ内形式に変換し、その後 Arrow が Parquet ファイルに書き出します。型の対応は次のとおりです。

| Doris の型              | Arrow の型 | Parquet の物理型      | Parquet の論理型                |
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
4.1.5 以降、Outfile と Export では `enable_int96_timestamps` によって Parquet のタイムスタンプのエンコード方式を制御します。デフォルトは `false` で、論理タイムスタンプ型を付けた `INT64` を書き出します。以前のバージョンでは `INT96` がデフォルトでした。レガシーリーダーとの互換性が必要な場合にのみ `true` に設定してください。指定できる値は `true` と `false` のみです。代わりに `parquet.enable_int96_timestamps` を使用しないでください。時点と壁時計時刻のタイムスタンプの意味については、[Parquet](../../lakehouse/file-formats/parquet.md) を参照してください。
:::

## 関連ドキュメント {#related-documents}

- [EXPORT による非同期エクスポート](./export-manual.md): `EXPORT` コマンドを使用して、テーブルまたはパーティションのデータを非同期でエクスポートします。
- [SELECT INTO OUTFILE](./outfile.md): `SELECT INTO OUTFILE` を使用して、クエリ結果を同期的にエクスポートします。
- [MySQL Dump](./export-with-mysql-dump.md): `mysqldump` ツールを使用して、テーブルのスキーマとデータをエクスポートします。
- [データエクスポートのベストプラクティス](./export-best-practice.md): エクスポートの同時実行数の調整方法と、エクスポート速度の評価方法を説明します。
