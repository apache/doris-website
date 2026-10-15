---
{
    "title": "MySQL 互換性に関する注意事項",
    "language": "ja",
    "description": "Doris と MySQL の互換性の違いを確認するためのクイックリファレンス。データ型、DDL/DML 構文、SQL 関数、SQL Mode を扱います。",
    "keywords": [
        "Doris と MySQL の互換性",
        "Doris と MySQL の違い",
        "Doris のデータ型",
        "Doris の DDL 構文",
        "Doris の DML 構文",
        "Doris の SQL Mode",
        "MySQL プロトコル",
        "標準 SQL"
    ]
}
---

<!-- Knowledge type: Compatibility comparison / Syntax reference -->
<!-- Applicable scenario: Migrating from MySQL to Doris / SQL syntax selection and troubleshooting -->

Doris は MySQL プロトコルおよび標準 SQL 構文と高い互換性があります。業務システム、BI ツール、運用スクリプトは通常、大きな変更を加えずに接続できます。ただし、分析向けの MPP データベースである Doris には、データ型、テーブル作成構文、データモデル、DML の動作などで MySQL との違いがあります。

このドキュメントでは、移行時と日常的な利用時の二つの観点から Doris と MySQL の主な違いを整理し、構文や動作の非互換性をすばやく特定できるようにします。

## 対象読者と利用場面

- MySQL アプリケーションやデータウェアハウスを Doris に移行するにあたり、SQL の互換性をすばやく評価したい場合。
- MySQL で使い慣れた書き方で Doris の SQL を記述し、構文や動作の違いに遭遇した場合。
- 特定のデータ型や DDL/DML 文が Doris でサポートされているか確認したい場合。

## データ型の違い

MySQL との違いを、数値型、日付型、文字列型、JSON 型、Doris 固有の型に分けて以下に示します。

### 数値型

| 型 | MySQL | Doris |
| --- | --- | --- |
| Boolean | - サポートあり<br />- 範囲: 0 は false、1 は true | - サポートあり<br />- キーワード: Boolean<br />- 範囲: 0 は false、1 は true |
| Bit | - サポートあり<br />- 範囲: 1～64 | サポートなし |
| Tinyint | - サポートあり<br />- 符号付きと符号なしをサポート<br />- 範囲: 符号付きは -128～127、符号なしは 0～255 | - サポートあり<br />- 符号付きのみサポート<br />- 範囲: -128～127 |
| Smallint | - サポートあり<br />- 符号付きと符号なしをサポート<br />- 範囲: 符号付きは -2^15～2^15-1、符号なしは 0～2^16-1 | - サポートあり<br />- 符号付きのみサポート<br />- 範囲: -32768～32767 |
| Mediumint | - サポートあり<br />- 符号付きと符号なしをサポート<br />- 範囲: 符号付きは -2^23～2^23-1、符号なしは 0～2^24-1 | サポートなし |
| Int | - サポートあり<br />- 符号付きと符号なしをサポート<br />- 範囲: 符号付きは -2^31～2^31-1、符号なしは 0～2^32-1 | - サポートあり<br />- 符号付きのみサポート<br />- 範囲: -2147483648～2147483647 |
| Bigint | - サポートあり<br />- 符号付きと符号なしをサポート<br />- 範囲: 符号付きは -2^63～2^63-1、符号なしは 0～2^64-1 | - サポートあり<br />- 符号付きのみサポート<br />- 範囲: -2^63～2^63-1 |
| Largeint | サポートなし | - サポートあり<br />- 符号付きのみサポート<br />- 範囲: -2^127～2^127-1 |
| Decimal | - サポートあり<br />- 符号付きと符号なしをサポート（8.0.17 より前はサポート、それ以降のバージョンでは非推奨）<br />- デフォルト: Decimal(10, 0) | - サポートあり<br />- 符号付きのみサポート<br />- デフォルト: Decimal(9, 0) |
| Float/Double | - サポートあり<br />- 符号付きと符号なしをサポート（8.0.17 より前はサポート、それ以降のバージョンでは非推奨） | - サポートあり<br />- 符号付きのみサポート |

### 日付型

| 型 | MySQL | Doris |
| --- | --- | --- |
| Date | - サポートあり<br />- 範囲: ['1000-01-01', '9999-12-31']<br />- 形式: YYYY-MM-DD | - サポートあり<br />- 範囲: ['0000-01-01', '9999-12-31']<br />- 形式: YYYY-MM-DD |
| DateTime | - サポートあり<br />- DATETIME([P])。省略可能なパラメータ P は精度<br />- 範囲: '1000-01-01 00:00:00.000000'～'9999-12-31 23:59:59.999999'<br />- 形式: YYYY-MM-DD hh:mm:ss[.fraction] | - サポートあり<br />- DATETIME([P])。省略可能なパラメータ P は精度<br />- 範囲: ['0000-01-01 00:00:00[.000000]', '9999-12-31 23:59:59[.999999]']<br />- 形式: YYYY-MM-DD hh:mm:ss[.fraction] |
| Timestamp | - サポートあり<br />- Timestamp[(p)]。省略可能なパラメータ P は精度<br />- 範囲: ['1970-01-01 00:00:01.000000' UTC, '2038-01-19 03:14:07.999999' UTC]<br />- 形式: YYYY-MM-DD hh:mm:ss[.fraction] | - サポートあり<br />- TIMESTAMPTZ([P])。省略可能なパラメータ P は精度<br />- 範囲: ['0000-01-01 00:00:00[.000000]' UTC, '9999-12-31 23:59:59[.999999]' UTC]<br />- 形式: YYYY-MM-DD hh:mm:ss[.fraction]+XX.XX |
| Time | - サポートあり<br />- Time[(p)]<br />- 範囲: ['-838:59:59.000000', '838:59:59.000000']<br />- 形式: hh:mm:ss[.fraction] | - 計算ではサポートされるが、OLAP テーブルの列としては格納不可<br />- Time[(p)]<br />- 範囲: ['-838:59:59.999999', '838:59:59.999999']<br />- 形式: hh:mm:ss[.fraction] |
| Year | - サポートあり<br />- 範囲: 1901～2155、または 0000<br />- 形式: yyyy | サポートなし |

### 文字列型

| 型 | MySQL | Doris |
| --- | --- | --- |
| Char | - サポートあり<br />- CHAR(M)。M は文字数で、デフォルトは 1<br />- 固定長<br />- 範囲: [0, 255] バイト | - サポートあり<br />- CHAR(M)。M はバイト長<br />- 可変長<br />- 範囲: [1, 255] |
| Varchar | - サポートあり<br />- VARCHAR(M)。M は文字数<br />- 範囲: [0, 65535] バイト | - サポートあり<br />- VARCHAR(M)。M はバイト長<br />- 範囲: [1, 65533] |
| String | サポートなし | - サポートあり<br />- 1048576 バイト（1 MB）。最大 2147483643 バイト（2 GB）まで増やせる |
| Binary | - サポートあり<br />- Char に類似 | サポートなし |
| Varbinary | - サポートあり<br />- Varchar に類似 | サポートなし |
| Blob | - サポートあり<br />- TinyBlob、Blob、MediumBlob、LongBlob | サポートなし |
| Text | - サポートあり<br />- TinyText、Text、MediumText、LongText | サポートなし |
| Enum | - サポートあり<br />- 最大 65535 要素 | サポートなし |
| Set | - サポートあり<br />- 最大 64 要素 | サポートなし |

### JSON データ型

| 型 | MySQL | Doris |
| --- | --- | --- |
| JSON | サポートあり | サポートあり |

### Doris 固有のデータ型

以下の型は、Doris が MySQL に加えて提供する分析向けのデータ型です。重複を除いた件数の集計、分位数の計算、半構造化データの処理などでよく使われます。

- **HyperLogLog**

    HLL 型は Key 列として使用できません。Aggregate モデルのテーブルで使用する場合、テーブル作成時に対応する集約型として HLL_UNION を指定します。長さやデフォルト値を指定する必要はありません。長さはデータの集約レベルに基づき、システム内部で制御されます。HLL 列は、対応する HLL_UNION_AGG、HLL_RAW_AGG、HLL_CARDINALITY、HLL_HASH 関数を通してのみクエリまたは使用できます。

    HLL は重複を除いた件数を概算する方法で、大量のデータでは Count Distinct より高い性能を発揮します。HLL の誤差率は通常約 1% ですが、場合によっては 2% に達することもあります。

- **BITMAP**

    BITMAP 型は Key 列として使用できません。Aggregate テーブルで使用する場合は、BITMAP_UNION 集約定義と組み合わせる必要があります。長さやデフォルト値を指定する必要はありません。長さはデータの集約レベルに基づき、システム内部で制御されます。BITMAP 列は、対応する BITMAP_UNION_COUNT、BITMAP_UNION、BITMAP_HASH、BITMAP_HASH64 などの関数を通してのみクエリまたは使用できます。

    オフラインの処理で BITMAP を使用すると、データの取り込み速度に影響する場合があります。大量のデータでは、クエリ速度は HLL より遅く、Count Distinct より速くなります。注意: リアルタイム処理で、グローバル辞書を使わずに BITMAP を使用し、代わりに BITMAP_HASH() を使うと、約千分の一の誤差が生じる場合があります。この誤差を許容できない場合は、BITMAP_HASH64 を使用できます。

- **QUANTILE_PERCENT (QUANTILE_STATE)**

    QUANTILE_STATE 型は Key 列として使用できません。Aggregate モデルのテーブルで使用する場合、テーブル作成時に対応する集約型として QUANTILE_UNION を指定します。長さやデフォルト値を指定する必要はありません。長さはデータの集約レベルに基づき、システム内部で制御されます。QUANTILE_STATE 列は、対応する QUANTILE_PERCENT、QUANTILE_UNION、TO_QUANTILE_STATE などの関数を通してのみクエリまたは使用できます。

    QUANTILE_STATE は分位数を概算するための型です。データの取り込み時に、同じ Key に対する異なる Value を事前集約します。Value の数が 2048 以下の場合はすべてのデータを詳細に記録し、2048 を超える場合は [TDigest](https://github.com/tdunning/t-digest/blob/main/docs/t-digest-paper/histo.pdf) アルゴリズムでデータを集約（クラスタ化）して、各クラスタの重心を保存します。

- **Array\<T\>**

    Array\<T\> は型 T の要素からなる配列で、Key 列としては使用できません。

- **MAP\<K, V\>**

    Map は型 K と V の要素の対応関係を表し、Key 列としては使用できません。

- **STRUCT\<field_name:field_type, ...\>**

    Struct は複数の Field で構成される構造体で、複数の列の集合とも捉えられます。Key としては使用できません。

    Struct 内の Field の名前と数は固定されており、Field は常に Nullable です。Field は通常、次の要素で構成されます。

    - field_name: Field の識別子。一意である必要があります
    - field_type: Field の型

- **Agg_State**

    AGG_STATE は Key 列として使用できません。テーブルを作成する際は、集約関数のシグネチャも宣言する必要があります。

    長さやデフォルト値を指定する必要はありません。実際の保存サイズは関数の実装によって異なります。

    AGG_STATE は、[STATE](../sql-manual/sql-functions/combinators/state) / [MERGE](../sql-manual/sql-functions/combinators/merge) / [UNION](../sql-manual/sql-functions/combinators/union) 関数コンビネータと組み合わせてのみ使用できます。

## 構文の違い

Doris の SQL 構文は全体として MySQL に近いものの、テーブル作成、インデックス、ビューなどでは Doris 固有の拡張や制約があります。移行時には特に注意してください。

### DDL の違い

#### CREATE TABLE

Doris のテーブル作成構文は次のとおりです。

```sql
CREATE TABLE [IF NOT EXISTS] [database.]table
(
    column_definition_list
    [, index_definition_list]
)
[engine_type]
[keys_type]
[table_comment]
[partition_info]
distribution_desc
[rollup_list]
[properties]
[extra_properties]
```

各句と MySQL の違いは次のとおりです。

| パラメータ | MySQL との違い |
| --- | --- |
| column_definition_list | - 列の一覧を定義します。基本構文は MySQL と似ています。<br />- Doris では、主に Aggregate Key データモデルで使用する集約型の操作もサポートします。<br />- MySQL では列の一覧を定義した後に Index、Primary Key、Unique Key などの制約を追加できます。Doris では、これらの制約と計算をデータモデルによってサポートします。 |
| index_definition_list | - インデックスの一覧を定義します。基本構文は MySQL と似ています。<br />- Doris は bitmap インデックス、転置インデックス、N-Gram インデックスをサポートし、プロパティを通じて Bloom filter インデックスを有効にすることもできます。<br />- MySQL は B+Tree インデックスと Hash インデックスをサポートします。 |
| engine_type | - テーブルエンジンの種類を指定します。省略可能です。<br />- 現在サポートされているテーブルエンジンは、主に OLAP ネイティブエンジンです。<br />- MySQL は InnoDB や MyISAM などのストレージエンジンをサポートします。 |
| keys_type | - データモデルを指定します。省略可能です。<br />- サポートされる種類は次のとおりです。<br />&nbsp;&nbsp;1) DUPLICATE KEY（デフォルト）: 後に指定する列はソート列です。<br />&nbsp;&nbsp;2) AGGREGATE KEY: 後に指定する列はディメンション列です。<br />&nbsp;&nbsp;3) UNIQUE KEY: 後に指定する列は主キー列です。<br />- MySQL にはデータモデルという概念がありません。 |
| table_comment | テーブルのコメント。 |
| partition_info | パーティション分割アルゴリズム。省略可能です。<br />Doris は次のパーティション分割アルゴリズムをサポートします。<br />- LESS THAN: パーティションの上限のみを定義し、下限は前のパーティションの上限によって決まります。<br />- FIXED RANGE: 左閉右開の区間を定義します。<br />- MULTI RANGE: 時間単位とステップ幅を指定して左閉右開の区間を定義し、RANGE パーティションを一括作成します。サポートされる時間単位は年、月、日、週、時です。<br /><br />MySQL がサポートするアルゴリズム: Hash、Range、List Key。サブパーティションもサポートされ、Hash と Key を使用できます。 |
| distribution_desc | - バケット分割アルゴリズム。必須です。次を含みます。<br />&nbsp;&nbsp;1) Hash バケット分割: `DISTRIBUTED BY HASH (k1[, k2 ...]) [BUCKETS num\|auto]`。指定したキー列を使って Hash バケットに分割します。<br />&nbsp;&nbsp;2) Random バケット分割: `DISTRIBUTED BY RANDOM [BUCKETS num\|auto]`。乱数を使ってバケットに分割します。<br />- MySQL にはバケット分割アルゴリズムがありません。 |
| rollup_list | - テーブル作成と同時に、複数の同期マテリアライズドビューを作成できます。<br />- 構文: `rollup_name (col1[, col2, ...]) [DUPLICATE KEY(col1[, col2, ...])][PROPERTIES("key" = "value")]`。<br />- MySQL ではサポートされません。 |
| properties | テーブルプロパティ。プロパティは MySQL のものと異なり、定義する構文も MySQL と異なります。 |

#### CREATE INDEX

```sql
CREATE INDEX [IF NOT EXISTS] index_name ON table_name (column [, ...],) [USING BITMAP];
```

- Doris は現在、bitmap インデックス、転置インデックス、N-Gram インデックス、Bloom filter インデックス（別の構文で設定）をサポートします。
- MySQL は B+Tree と Hash のインデックスアルゴリズムをサポートします。

#### CREATE VIEW

```sql
CREATE VIEW [IF NOT EXISTS]
 [db_name.]view_name
 (column1[ COMMENT "col comment"][, column2, ...])
AS query_stmt

CREATE MATERIALIZED VIEW [IF NOT EXISTS] mvName=multipartIdentifier
        (LEFT_PAREN cols=simpleColumnDefs RIGHT_PAREN)? buildMode?
        (REFRESH refreshMethod? refreshTrigger?)?
        (KEY keys=identifierList)?
        (COMMENT STRING_LITERAL)?
        (PARTITION BY LEFT_PAREN partitionKey = identifier RIGHT_PAREN)?
        (DISTRIBUTED BY (HASH hashKeys=identifierList | RANDOM) (BUCKETS (INTEGER_VALUE | AUTO))?)?
        propertyClause?
        AS query
```

- 基本構文は MySQL と同じです。
- Doris は論理ビューに加えて、同期マテリアライズドビューと非同期マテリアライズドビューもサポートします。
- MySQL はマテリアライズドビューをサポートしません。

#### ALTER TABLE / ALTER INDEX

Doris の ALTER 構文は基本的に MySQL と同じです。

#### DROP TABLE / DROP INDEX

Doris の DROP 構文は基本的に MySQL と同じです。

### DML の違い

#### INSERT

```sql
INSERT INTO table_name
    [ PARTITION (p1, ...) ]
    [ WITH LABEL label]
    [ (column [, ...]) ]
    [ [ hint [, ...] ] ]
    { VALUES ( { expression | DEFAULT } [, ...] ) [, ...] | query }
```

Doris の INSERT 構文は基本的に MySQL と同じです。

#### UPDATE

```sql
UPDATE target_table [table_alias]
    SET assignment_list
    WHERE condition

assignment_list:
    assignment [, assignment] ...

assignment:
    col_name = value

value:
    {expr | DEFAULT}
```

Doris の UPDATE 構文は基本的に MySQL と同じですが、**WHERE 条件が必須**である点に注意してください。

#### DELETE

```sql
DELETE FROM table_name [table_alias]
    [PARTITION partition_name | PARTITIONS (partition_name [, partition_name])]
    WHERE column_name op { value | value_list } [ AND column_name op { value | value_list } ...];
```

Doris では、上記の構文ではフィルタ述語のみを指定できます。

```sql
DELETE FROM table_name [table_alias]
    [PARTITION partition_name | PARTITIONS (partition_name [, partition_name])]
    [USING additional_tables]
    WHERE condition
```

Doris では、上記の構文は Unique Key モデルのテーブルでのみ使用できます。

Doris の DELETE 構文は基本的に MySQL と同じです。ただし、Doris は分析向けのデータベースであるため、削除操作を頻繁に実行することは避けてください。

#### SELECT

```sql
SELECT
    [hint_statement, ...]
    [ALL | DISTINCT]
    select_expr [, select_expr ...]
    [EXCEPT ( col_name1 [, col_name2, col_name3, ...] )]
    [FROM table_references
      [PARTITION partition_list]
      [TABLET tabletid_list]
      [TABLESAMPLE sample_value [ROWS | PERCENT]
        [REPEATABLE pos_seek]]
    [WHERE where_condition]
    [GROUP BY [GROUPING SETS | ROLLUP | CUBE] {col_name | expr | position}]
    [HAVING where_condition]
    [ORDER BY {col_name | expr | position} [ASC | DESC], ...]
    [LIMIT {[offset_count,] row_count | row_count OFFSET offset_count}]
    [INTO OUTFILE 'file_name']
```

Doris の SELECT 構文は基本的に MySQL と同じです。

## SQL 関数

Doris の関数は MySQL の関数の大部分を網羅しています。一般的な文字列関数、日付関数、集約関数、ウィンドウ関数はそのまま使用できます。

## SQL Mode

Doris は、一部の SQL Mode の設定をサポートしています。これにより SQL の解析や実行の動作を制御し、MySQL の規約に合わせやすくなります。

| 名前 | 設定した場合の動作 | 設定しない場合の動作 | 備考 |
| :-- | :-- | :-- | :-- |
| PIPES_AS_CONCAT | `\|\|` 記号を concat 関数として解釈します | `\|\|` 記号を論理 OR 演算子として解釈します | - |
| NO_BACKSLASH_ESCAPES | 文字列内のバックスラッシュを通常の文字として扱います | 文字列内のバックスラッシュをエスケープシーケンスの開始として扱います | - |
| ONLY_FULL_GROUP_BY | 標準的な集約のみを許可します | 集約結果の出力に、集約 KEY に含まれないスカラー値を含めることを許可します | バージョン 3.1.0 以降でサポート |
