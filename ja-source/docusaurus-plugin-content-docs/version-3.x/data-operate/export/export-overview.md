---
{
  "title": "Export概要",
  "description": "データエクスポート機能は、クエリ結果セットまたはDorisTableデータを、指定されたファイル形式で指定されたストレージシステムに書き込むために使用されます。",
  "language": "ja"
}
---
データエクスポート機能は、クエリ結果セットまたはDorisTableデータを、指定されたファイル形式で指定されたストレージシステムに書き込むために使用されます。

エクスポート機能とデータバックアップ機能の違いは以下の通りです：

| |データエクスポート|データバックアップ|
| ----- | ----- | ----- |
|最終保存場所|HDFS、オブジェクトストレージ、ローカルファイルシステム|HDFS、オブジェクトストレージ|
|データ形式|Parquet、ORC、CSVなどのオープンファイル形式|Doris内部ストレージ形式|
|実行速度|中程度（データの読み取りとターゲットデータ形式への変換が必要）|高速（解析と変換が不要、Dorisデータファイルを直接アップロード）|
|柔軟性|SQL文を通じてエクスポートするデータを柔軟に定義可能|tableレベルの完全バックアップのみサポート|
|使用例|結果セットのダウンロード、異なるシステム間でのデータ交換|データバックアップ、Dorisクラスタ間でのデータ移行|

## エクスポート方法の選択

Dorisでは3つの異なるデータエクスポート方法を提供しています：

* **SELECT INTO OUTFILE**: 任意のSQL結果セットのエクスポートをサポート。
* **EXPORT**: 部分的または完全なtableデータのエクスポートをサポート。
* **MySQL DUMP**: データエクスポート用のMySQL dumpコマンドと互換。

3つのエクスポート方法の共通点と相違点は以下の通りです：

| |SELECT INTO OUTFILE|EXPORT|MySQL DUMP|
| ----- | ----- | ----- | ----- |
|同期/非同期|同期|非同期（EXPORTタスクを送信し、SHOW EXPORTコマンドでタスクの進行状況を確認）|同期|
|任意のSQLをサポート|はい|いいえ|いいえ|
|特定のパーティションのエクスポート|はい|はい|いいえ|
|特定のタブレットのエクスポート|はい|いいえ|いいえ|
|並行エクスポート|高い並行性でサポート（SQL文に単一ノードで処理する必要があるORDER BYなどの演算子があるかどうかに依存）|高い並行性でサポート（タブレットレベルの並行エクスポートをサポート）|サポートなし、シングルスレッドエクスポートのみ|
|サポートするエクスポートデータ形式|Parquet、ORC、CSV|Parquet、ORC、CSV|MySQL Dump固有形式|
|外部tableのエクスポートをサポート|はい|部分的にサポート|いいえ|
|ビューのエクスポートをサポート|はい|はい|はい|
|サポートするエクスポート場所|S3、HDFS|S3、HDFS|LOCAL|

### SELECT INTO OUTFILE

以下のシナリオに適しています：

* フィルタリング、集計、結合などの複雑な計算後にデータをエクスポートする必要がある場合。
* 同期タスクが必要なシナリオに適している。

### EXPORT

以下のシナリオに適しています：

* 大規模な単一tableのエクスポートで、シンプルなフィルタリング条件。
* 非同期タスク送信が必要なシナリオ。

### MySQL Dump

以下のシナリオに適しています：

* MySQLエコシステムとの互換性が必要で、table構造とデータの両方をエクスポートする必要がある場合。
* 開発テストのみ、または非常に小さなデータ量のシナリオ。

## エクスポートファイルのカラム型マッピング

ParquetとORCファイル形式には独自のデータ型があります。Dorisのエクスポート機能は、Dorisのデータ型をParquetとORCファイル形式の対応するデータ型に自動的にマッピングできます。CSV形式には型がなく、すべてのデータはテキストとして出力されます。

以下の表は、Dorisデータ型とParquet、ORCファイル形式データ型間のマッピングを示しています：

- ORC

    | Doris タイプ | Orc タイプ |
    | ---------- | -------- |
    | boolean    | boolean |
    | tinyint    | tinyint |
    | smallint   | smallint |
    | int        | int |
    | bigint     | bigint |
    | largeInt   | string |
    | date       | string |
    | datev2     | string |
    | datetime   | string |
    | datetimev2 | timestamp |
    | float      | float |
    | double     | double |
    | char / varchar / string| string |
    | decimal    | decimal |
    | struct     | struct |
    | map        | map |
    | array      | array |
    | json       | string |
    | variant    | string |
    | bitmap     | binary |
    | quantile_state| binary |
    | hll        | binary |

- Parquet

    DorisがParquetファイル形式にエクスポートされる場合、Dorisメモリデータは最初にArrowメモリデータ形式に変換され、その後ArrowによってParquetファイル形式に書き出されます。

    | Doris タイプ | Arrow タイプ | Parquet Physical タイプ | Parquet Logical タイプ |
    | ---------- | ---------- | -------- | ------- |
    | boolean    | boolean | BOOLEAN | |
    | tinyint    | int8 | INT32 | INT_8 |
    | smallint   | int16 | INT32 | INT_16 |
    | int        | int32 | INT32 | INT_32 |
    | bigint     | int64 | INT64 | INT_64 |
    | largeInt   | utf8 | BYTE_ARRAY | UTF8 |
    | date       | utf8 | BYTE_ARRAY | UTF8 |
    | datev2     | date32 | INT32 | DATE |
    | datetime   | utf8 | BYTE_ARRAY | UTF8 |
    | datetimev2 | timestamp | INT96/INT64 | TIMESTAMP(MICROS/MILLIS/SECONDS) |
    | float      | float32 | FLOAT | |
    | double     | float64 | DOUBLE | |
    | char / varchar / string| utf8 | BYTE_ARRAY | UTF8 |
    | decimal    | decimal128 | FIXED_LEN_BYTE_ARRAY | DECIMAL(scale, precision) |
    | struct     | struct |  | Parquet Group |
    | map        | map | | Parquet Map |
    | array      | list | | Parquet List |
    | json       | utf8 | BYTE_ARRAY | UTF8 |
    | variant    | utf8 | BYTE_ARRAY | UTF8 |
    | bitmap     | binary | BYTE_ARRAY | |
    | quantile_state| binary | BYTE_ARRAY | |
    | hll        | binary | BYTE_ARRAY | |

    > 注意：バージョン2.1.11および3.0.7では、`parquet.enable_int96_timestamps`プロパティを指定して、Dorisのdatetimev2型がParquetのINT96ストレージまたはINT64を使用するかを決定できます。デフォルトではINT96が使用されます。ただし、INT96はParquet標準では廃止予定であり、一部の古いシステム（Hive 4.0以前のバージョンなど）との互換性のためにのみ使用されます。
