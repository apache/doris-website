---
{
    "title": "UUID データ型",
    "sidebar_label": "UUID",
    "language": "ja",
    "description": "ネイティブの 128 ビット UUID 型について、入力形式、生成、変換、テーブル設計、ファイル形式との互換性を説明します。"
}
---

## 概要

`UUID` は 128 ビットの汎用一意識別子を 16 バイトで格納します。コンパクトな格納、等価条件による絞り込み、結合、またはソートが必要な識別子に使用します。テキスト出力は常に小文字の標準形式 `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` になります。

## 構文と入力形式

```sql
UUID
```

| 項目 | 動作 |
| --- | --- |
| 格納形式 | 固定長の 16 バイト値。標準形式のテキストは 36 文字 |
| 標準形式の入力 | 32 桁の十六進数で、ハイフンを `8-4-4-4-12` の位置に入れる |
| 短縮形式の入力 | ハイフンのない 32 桁の十六進数 |
| 英字の大小 | 十六進数の大文字と小文字を受け付け、出力は小文字 |
| 値の範囲 | `00000000-0000-0000-0000-000000000000` から `ffffffff-ffff-ffff-ffff-ffffffffffff` まで |
| 検証 | テキスト形式を検査し、特定の UUID バージョンやバリアントは要求しない |
| NULL | NULL 許容列で使用可能。すべてゼロの UUID は `NULL` とは異なる有効な値 |
| 順序 | 標準のバイト順での符号なし 128 ビット値としての順序。正規化された標準形式のテキストの辞書順と同じ |

## 基本的な使い方

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

省略した各 `generated_id` には、生成された値が設定されます。具体的なテキスト値は実行ごとに異なります。

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

## 関数と変換

| 関数 | 結果と用途 |
| --- | --- |
| [UUID_V4](../../sql-functions/scalar-functions/uuid-functions/uuid-v4.md) | ネイティブのランダムな UUID v4。別名は `GENERATE_UUID_V4()` と `GENERATEUUIDV4()` |
| [UUID_V7](../../sql-functions/scalar-functions/uuid-functions/uuid-v7.md) | ミリ秒単位のタイムスタンプを含むネイティブの UUID v7。別名は `GENERATE_UUID_V7()` と `GENERATEUUIDV7()` |
| [UUID_VERSION](../../sql-functions/scalar-functions/uuid-functions/uuid-version.md) | `TINYINT` 型のバージョンフィールド（0–15）を返す。バリアントは検証しない |
| [TO_UUID_OR_NULL](../../sql-functions/scalar-functions/uuid-functions/to-uuid-or-null.md) | テキストを解析する。無効なテキストと `NULL` に対して `NULL` を返す |
| [TO_UUID_OR_ZERO](../../sql-functions/scalar-functions/uuid-functions/to-uuid-or-zero.md) | テキストを解析する。無効なテキストに対してすべてゼロの UUID を返し、`NULL` は `NULL` のままにする |
| [TO_UUID_OR_DEFAULT](../../sql-functions/scalar-functions/uuid-functions/to-uuid-or-default.md) | テキストを解析する。無効なテキストまたは `NULL` に対して、指定した代替 UUID を使用する。デフォルトはすべてゼロの UUID |
| [UUID_V7_TO_DATETIME](../../sql-functions/scalar-functions/uuid-functions/uuid-v7-to-datetime.md) | 指定したタイムゾーンでタイムスタンプを `DATETIME(3)` として抽出する |
| [DATETIME_TO_UUID_V7](../../sql-functions/scalar-functions/uuid-functions/datetime-to-uuid-v7.md) | セッションのタイムゾーンで解釈した日時から UUID v7 を生成する |
| [UUID](../../sql-functions/scalar-functions/string-functions/uuid.md) | ネイティブ UUID 型ではなく `VARCHAR` を返す既存の関数 |

テキストの解析には `CAST(text AS UUID)`、標準形式の出力には `CAST(uuid AS STRING)` を使用します。`enable_strict_cast = true` の場合、無効なテキストはエラーになります。無効にした場合は `NULL` を返します。`TRY_CAST(text AS UUID)` は、どちらのモードでも無効なテキストに対して `NULL` を返します。UUID 型と整数型、浮動小数点型、日付/時刻型、IP 型の間では直接キャストできません。暗黙的な変換、VARIANT、および移行のルールについては、[UUID の変換](conversion/uuid-conversion.md)を参照してください。

既存の `IS_UUID()` は、波括弧で囲んだ標準形式の UUID など、ネイティブのパーサーが拒否するテキストも受け付けます。UUID 列に格納するテキストの検証には、`TO_UUID_OR_NULL()` または `TRY_CAST` を使用してください。

## テーブル設計と制約

- UUID 列は、Duplicate、Unique、Aggregate テーブルのキー、およびハッシュ分散列として使用できます。
- UUID 列は、複数列のパーティションや `AUTO PARTITION BY LIST` を含め、RANGE または LIST パーティション列として使用できません。UUID 列での動的パーティション分割もサポートされません。
- UUID 値では、比較、`IN`、ソート、グループ化、結合、`MIN`、`MAX`、`COUNT(DISTINCT ...)` を使用できます。UUID は数値型ではないため、算術演算や `SUM`、`AVG` などの数値集計はサポートされません。
- Aggregate テーブルの UUID 値列では、`MIN`、`MAX`、`REPLACE`、`REPLACE_IF_NOT_NULL` を使用できます。
- UUID は ARRAY の要素、MAP のキーまたは値、STRUCT のフィールドとして使用できます。外側の複合型に対する既存の制約は引き続き適用されます。
- UUID はプレフィックスインデックス、ZoneMap インデックス、BloomFilter インデックス、転置インデックスをサポートします。転置インデックスでは、テキストパーサーを使わずに等価条件や範囲条件で検索します。UUID は NGRAM_BF インデックスとベクトルインデックスをサポートしません。
- UUID は `AUTO_INCREMENT` 列または Sequence 列にできません。
- テーブル作成時に、UUID 列にはリテラルのデフォルト値と、別名を含む `UUID_V4()` / `UUID_V7()` の動的なデフォルト値を指定できます。動的な UUID デフォルト値は UUID 列にのみ指定できます。
- `ALTER TABLE ADD COLUMN` では UUID リテラルをデフォルト値として指定できますが、UUID 生成関数をデフォルト値に指定することはできません。既存行を、それぞれ独立して生成された永続的な値で埋めることができないためです。スキーマ変更によって、別の列の型を UUID に、または UUID を別の型に直接変更することはできません。代わりに新しい列またはテーブルを作成し、挿入時に変換してください。

## ロード、エクスポート、クライアント

CSV 入力では UUID テキストをフィールドとして指定し、JSON 入力では JSON 文字列または `null` として指定します。標準形式と短縮形式の両方を受け付けます。代替値を明示的に選ぶには、ソースをテキストとしてロードし、列マッピングで `TO_UUID_OR_*` 関数のいずれかを使用します。

構造化インターフェースでは、テキスト形式ではなく 16 バイトの値を扱います。Arrow IPC と Arrow Flight SQL は標準の `arrow.uuid` 拡張型を `fixed_size_binary(16)` 上で使用し、Parquet と ORC へのエクスポートではバイナリ値と型メタデータを書き込みます。`STRING` 列には影響しません。UUID テキストを含んでいる文字列も、テキストとして転送およびエクスポートされます。

| インターフェースまたは形式 | UUID の表現 |
| --- | --- |
| MySQL プロトコル | 標準形式のテキスト。Doris の列が UUID でも、クライアントには文字列型として報告される場合がある |
| Arrow Flight SQL | ARRAY、MAP、STRUCT に入れ子になった UUID 要素を含め、ネイティブ UUID を標準の `arrow.uuid` 拡張型として、16 バイトのビッグエンディアンの `fixed_size_binary(16)` 値上で表現する。Arrow Flight SQL JDBC ドライバーでは、列の型は `Types.OTHER`、`getObject()` は `java.util.UUID`、`getString()` は標準形式のテキスト、`getBytes()` は 16 バイトを返す |
| CSV、JSON、Hive Text 出力 | 標準形式のテキスト。JSON では UUID 値を文字列として表現する |
| Parquet への `OUTFILE` / `EXPORT` | 入れ子になった UUID 要素を含め、標準のビッグエンディアンのバイト順で Parquet UUID 論理型アノテーションを付けた `FIXED_LEN_BYTE_ARRAY(16)`。ファイルにはネイティブ型が保持されるが、TVF のスキーマ推論では UUID の末端要素は引き続き `STRING`/`VARBINARY` として公開される |
| ORC への `OUTFILE` / `EXPORT` | 入れ子になった UUID 要素を含め、`BINARY` に Doris 固有の `doris.logical_type=uuid` 属性を付ける。ORC には標準の UUID 型がないため、他のツールには通常のバイナリとして見える |
| ネイティブ Parquet UUID 入力 | 標準のビッグエンディアンのバイト順で、`FIXED_LEN_BYTE_ARRAY(16)` の UUID 論理型アノテーションをサポートする。TVF のスキーマ推論では、`enable_mapping_varbinary` によって制御される既存の STRING / VARBINARY マッピングが維持される。標準形式の STRING は `CAST(value AS UUID)`、生の VARBINARY は `CAST(HEX(value) AS UUID)` で変換する |
| ORC 入力 | `BINARY` 列に `doris.logical_type=uuid` 属性が付いている場合は、入れ子になった要素を含め、両方の ORC リーダーでネイティブ UUID として読み戻される。このような列について、TVF は `uuid`、`array<uuid>`、`struct<k:uuid>` を報告する。それ以外の ORC `BINARY` 列と `STRING` 列には、既存の STRING マッピングが適用される |
| Iceberg | カタログの UUID マッピングは、`enable.mapping.varbinary` に応じて STRING / VARBINARY のままとなる。どちらのマッピングでも生の 16 バイトが保持される。ネイティブ UUID への変換には `CAST(HEX(value) AS UUID)` を使用する。Iceberg の UUID フィールドへの書き込みでは、Parquet の UUID 論理型アノテーションが保持される |
| ClickHouse JDBC Catalog | ClickHouse の UUID は Doris のネイティブ UUID にマッピングされる。以前に文書化されたリリースでは STRING にマッピングされる |
| Python UDF | SQL UUID は `uuid.UUID` に、`NULL` は `None` にマッピングされる。スカラー関数、ベクトル化関数（`list` と `pandas.Series`）、集約関数、テーブル関数で適用され、ARRAY、MAP、STRUCT に入れ子になった UUID 要素も含む。UUID を返す関数は `uuid.UUID` オブジェクトまたは `None` を返す必要がある |
| Java UDF | SQL UUID は、サポートされる複合型の内部を含め、`java.util.UUID` にマッピングされる |

## ベストプラクティス

識別子が UUID であり、16 バイトでの格納や UUID の比較が有用な場合は、ネイティブ型を使用してください。移行前に既存の文字列データを正規化して検証してください。元の表記や UUID 以外の識別子を保持する必要がある場合は、テキストとしての格納を続けてください。ランダムな識別子には `UUID_V4()`、時間的に近い値を得たい識別子には `UUID_V7()` を使用してください。イベント時刻による絞り込みには別の日付/時刻列を用意してください。分散環境で生成される UUID v7 は、全体で一意の連番や正確なイベント時刻を提供しません。
