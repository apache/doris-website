---
{
    "title": "UUID データ型",
    "sidebar_label": "UUID",
    "language": "ja",
    "description": "ネイティブの128ビットUUID型について、入力形式、生成、変換、テーブル設計、ファイルとの互換性を説明します。"
}
---

## 概要 {#description}

`UUID` は、128ビットの汎用一意識別子を16バイトで格納します。コンパクトな格納、等価条件による絞り込み、結合、ソートが必要な識別子に使用します。テキスト出力には常に小文字の標準形式 `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` が使われます。

## 構文と入力形式 {#syntax-and-input-format}

```sql
UUID
```

| 項目 | 動作 |
| --- | --- |
| ストレージ | 固定長の16バイト値。標準形式のテキストは36文字 |
| 標準形式の入力 | `8-4-4-4-12` の位置にハイフンを入れた32桁の16進数 |
| コンパクト形式の入力 | ハイフンを含まない32桁の16進数 |
| 英字の大文字と小文字 | 16進数の英字は大文字と小文字の両方を受け付け、出力には小文字を使用 |
| 値の範囲 | `00000000-0000-0000-0000-000000000000` から `ffffffff-ffff-ffff-ffff-ffffffffffff` まで |
| 検証 | テキスト形式を検証。特定のUUIDバージョンやバリアントであることは要求しない |
| NULL | NULLを許容するカラムで使用可能。すべてゼロのUUIDは、`NULL` とは異なる有効な値 |
| 順序 | 標準のバイト順による符号なし128ビット値としての順序。正規化された標準形式のテキストを辞書順で比較した順序と同じ |

## 基本的な使い方 {#basic-usage}

```sql
CREATE DATABASE IF NOT EXISTS uuid_demo;
USE uuid_demo;

CREATE TABLE uuid_events (
    id INT NOT NULL,
    event_id UUID NULL,
    generated_id UUID NOT NULL DEFAULT UUID_V7()
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ('replication_num' = '1');

INSERT INTO uuid_events (id, event_id) VALUES
    (1, '550E8400E29B41D4A716446655440000'),
    (2, '00000000-0000-0000-0000-000000000000'),
    (3, NULL);

SELECT id, event_id, UUID_VERSION(generated_id) AS generated_version
FROM uuid_events ORDER BY id;
```

```text
+----+--------------------------------------+-------------------+
| id | event_id                             | generated_version |
+----+--------------------------------------+-------------------+
| 1  | 550e8400-e29b-41d4-a716-446655440000 | 7                 |
| 2  | 00000000-0000-0000-0000-000000000000 | 7                 |
| 3  | NULL                                 | 7                 |
+----+--------------------------------------+-------------------+
```

`generated_id` を省略した各行には、生成された値が設定されます。実際のテキスト値は実行ごとに異なります。

```sql
SELECT id FROM uuid_events
WHERE event_id = CAST('550e8400-e29b-41d4-a716-446655440000' AS UUID);
```

```text
+----+
| id |
+----+
| 1  |
+----+
```

## 関数と変換 {#functions-and-conversion}

| 関数 | 戻り値と用途 |
| --- | --- |
| [UUID_V4](../../sql-functions/scalar-functions/uuid-functions/uuid-v4.md) | ネイティブのランダムなUUID v4を生成。別名は `GENERATE_UUID_V4()` と `GENERATEUUIDV4()` |
| [UUID_V7](../../sql-functions/scalar-functions/uuid-functions/uuid-v7.md) | ミリ秒単位のタイムスタンプを含むネイティブのUUID v7を生成。別名は `GENERATE_UUID_V7()` と `GENERATEUUIDV7()` |
| [UUID_VERSION](../../sql-functions/scalar-functions/uuid-functions/uuid-version.md) | バリアントを検証せず、バージョンフィールド（0–15）を `TINYINT` として返す |
| [TO_UUID_OR_NULL](../../sql-functions/scalar-functions/uuid-functions/to-uuid-or-null.md) | テキストを解析。不正なテキストと `NULL` は `NULL` を返す |
| [TO_UUID_OR_ZERO](../../sql-functions/scalar-functions/uuid-functions/to-uuid-or-zero.md) | テキストを解析。不正なテキストはすべてゼロのUUIDを返し、`NULL` は `NULL` のまま |
| [TO_UUID_OR_DEFAULT](../../sql-functions/scalar-functions/uuid-functions/to-uuid-or-default.md) | テキストを解析。不正なテキストまたは `NULL` には、指定した代替UUIDを使用する。指定しない場合はすべてゼロのUUIDを使用 |
| [UUID_V7_TO_DATETIME](../../sql-functions/scalar-functions/uuid-functions/uuid-v7-to-datetime.md) | 指定したタイムゾーンでタイムスタンプを `DATETIME(3)` として抽出 |
| [DATETIME_TO_UUID_V7](../../sql-functions/scalar-functions/uuid-functions/datetime-to-uuid-v7.md) | セッションのタイムゾーンで解釈した日時からUUID v7を生成 |
| [UUID](../../sql-functions/scalar-functions/string-functions/uuid.md) | ネイティブのUUID型ではなく `VARCHAR` を返す既存の関数 |

テキストの解析には `CAST(text AS UUID)`、標準形式での出力には `CAST(uuid AS STRING)` を使用します。`enable_strict_cast = true` の場合、不正なテキストはエラーになります。無効にすると、不正なテキストは `NULL` を返します。`TRY_CAST(text AS UUID)` は、どちらのモードでも不正なテキストに対して `NULL` を返します。UUIDと整数、浮動小数点数、日時、IPの各型の間では直接キャストできません。暗黙的な変換、VARIANT、移行のルールについては、[UUIDの変換](conversion/uuid-conversion.md)を参照してください。

既存の `IS_UUID()` は、波括弧で囲んだ標準形式のUUIDなど、ネイティブのパーサーが拒否するテキストも受け付けます。UUIDカラムに格納するテキストの検証には、`TO_UUID_OR_NULL()` または `TRY_CAST` を使用してください。

## テーブル設計と制約 {#table-design-and-restrictions}

- UUIDカラムは、Duplicate、Unique、Aggregateテーブルのキー、およびハッシュ分散カラムとして使用できます。
- UUIDカラムは、複数カラムによるパーティションや `AUTO PARTITION BY LIST` を含め、RANGEまたはLISTパーティションのカラムとして使用できません。UUIDカラムでの動的パーティション分割もサポートされません。
- UUID値は、比較、`IN`、ソート、グループ化、結合、`MIN`、`MAX`、`COUNT(DISTINCT ...)` に対応しています。UUIDは数値型ではないため、算術演算や `SUM`、`AVG` などの数値集計はサポートされません。
- AggregateテーブルのUUID値カラムは、`MIN`、`MAX`、`REPLACE`、`REPLACE_IF_NOT_NULL` に対応しています。
- UUIDは、ARRAYの要素、MAPのキーまたは値、STRUCTのフィールドとして使用できます。外側の複合型に対する既存の制約は引き続き適用されます。
- UUIDは、プレフィックスインデックス、ZoneMap、BloomFilter、転置インデックスに対応しています。転置インデックスでは、テキストパーサーを使用せずに等価検索または範囲検索を行います。UUIDはNGRAM_BFインデックスとベクトルインデックスには対応していません。
- UUIDカラムを `AUTO_INCREMENT` カラムまたはSequenceカラムにすることはできません。
- テーブル作成時、UUIDカラムのデフォルト値にはリテラル、および別名を含む `UUID_V4()` / `UUID_V7()` の動的デフォルト値を指定できます。動的なUUIDデフォルト値はUUIDカラムにのみ指定できます。
- `ALTER TABLE ADD COLUMN` はUUIDリテラルのデフォルト値を受け付けますが、UUID生成関数によるデフォルト値は拒否します。既存の行を、個別に生成した永続的な値で埋め戻せないためです。スキーマ変更によって別のカラム型をUUIDに、またはUUIDを別の型に直接変更することはサポートされません。代わりに新しいカラムまたはテーブルを作成し、挿入時に変換してください。

## データロード、エクスポート、クライアント {#loading-export-and-clients}

CSV入力では、UUIDのテキストをフィールドとして指定します。JSON入力では、JSON文字列または `null` として指定します。標準形式とコンパクト形式の両方を受け付けます。代替値を明示的に指定するには、元データをテキストとしてデータロードし、カラムマッピングで `TO_UUID_OR_*` 関数のいずれかを使用します。

構造化インターフェースは、テキスト形式ではなく16バイトの値を転送します。Arrow IPCとArrow Flight SQLは、`fixed_size_binary(16)` 上の標準的な `arrow.uuid` 拡張型を使用します。ParquetとORCへのエクスポートでは、バイナリ値と型メタデータを書き込みます。`STRING` カラムには影響しません。UUIDのテキストを含む文字列も、引き続きテキストとして転送およびエクスポートされます。

| インターフェースまたは形式 | UUIDの表現 |
| --- | --- |
| MySQLプロトコル | 標準形式のテキスト。DorisのカラムがUUIDでも、クライアントが文字列型として報告する場合がある |
| Arrow Flight SQL | ネイティブUUIDを、16バイトのビッグエンディアン値 `fixed_size_binary(16)` 上の標準的な `arrow.uuid` 拡張型として表現。ARRAY、MAP、STRUCT内のUUID要素も含む。Arrow Flight SQL JDBCドライバーでは、カラム型は `Types.OTHER`、`getObject()` は `java.util.UUID`、`getString()` は標準形式のテキスト、`getBytes()` は16バイトを返す |
| CSV、JSON、Hive Text出力 | 標準形式のテキスト。JSONではUUID値を文字列として表現 |
| Parquetへの `OUTFILE` / `EXPORT` | ParquetのUUID論理型アノテーションが付いた `FIXED_LEN_BYTE_ARRAY(16)`。標準のビッグエンディアンのバイト順を使用し、ネストしたUUID要素も含む。開発版では、TVFのスキーマ推論時にもネイティブUUIDを復元する |
| ORCへの `OUTFILE` / `EXPORT` | Doris固有の `doris.logical_type=uuid` 属性が付いた `BINARY`。ネストしたUUID要素も含む。ORCには標準のUUID型がないため、ほかのツールには通常のバイナリとして見える |
| ネイティブParquet UUID入力 | UUIDアノテーションが付いた `FIXED_LEN_BYTE_ARRAY(16)` を、標準のビッグエンディアンのバイト順でサポート。ネストした要素も含む。開発版では `enable_mapping_varbinary` に関係なくネイティブの `UUID` と推論する。4.1.5のTVFは、そのオプションに応じてSTRING / VARBINARYを使用する |
| ORC入力 | `doris.logical_type=uuid` 属性を持つ `BINARY` カラムは、ネストした要素を含め、両方のORCリーダーでネイティブUUIDとして読み戻される。TVFは、そのようなカラムを `uuid`、`array<uuid>`、`struct<k:uuid>` と報告する。開発版では、属性のない `BINARY` は `VARBINARY` にマッピングされ、`STRING` は `STRING` のまま |
| Iceberg | 開発版では、`enable.mapping.varbinary` に関係なくIceberg UUIDをネイティブのDoris UUIDに直接マッピングする。Doris 4.1.5では `VARBINARY(16)` にマッピングする。Parquetへの書き込みではUUID論理型アノテーションが保持される |
| ClickHouse JDBC Catalog | ClickHouse UUIDはネイティブのDoris UUIDにマッピングされる。以前のドキュメントに記載されたリリースではSTRINGにマッピングされる |
| Python UDF | SQL UUIDは `uuid.UUID` に、`NULL` は `None` にマッピングされる。スカラー関数、ベクトル化関数（`list` と `pandas.Series`）、集約関数、テーブル関数に対応し、ARRAY、MAP、STRUCT内のUUID要素も含む。UUIDを返す関数は `uuid.UUID` オブジェクトまたは `None` を返す必要がある |
| Java UDF | SQL UUIDは、サポート対象の複合型内も含めて `java.util.UUID` にマッピングされる |

## ベストプラクティス {#best-practices}

識別子がUUIDであり、16バイトでの格納やUUIDの比較が役立つ場合は、ネイティブ型を使用します。移行前に既存の文字列データを正規化して検証してください。元の表記やUUID以外の識別子を保持する必要がある場合は、テキスト形式での格納を続けます。ランダムな識別子には `UUID_V4()`、時間的に近い値がまとまる識別子には `UUID_V7()` を使用します。イベント時刻による絞り込みには別の日時カラムを用意してください。分散環境でのUUID v7の生成では、グローバルな連番や正確なイベント時刻は得られません。
