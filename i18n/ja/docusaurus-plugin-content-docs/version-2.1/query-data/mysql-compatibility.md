---
{
  "title": "MySQL互換性",
  "language": "ja",
  "description": "DorisはMySQLの構文と高い互換性があり、標準SQLをサポートしています。しかし、DorisとMySQLの間にはいくつかの違いがあります。"
}
---
Dorisは高いMySQLシンタックス互換性を持ち、標準SQLをサポートしています。しかし、DorisとMySQLの間にはいくつかの相違点があり、以下に説明します。

## データ型

### 数値型

| 型           | MySQL                                                        | Doris                                                        |
| ------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
| Boolean      | <p>- サポート済み</p>  <p>- 範囲: 0がfalse、1がtrueを表す</p>  | <p>- サポート済み</p>  <p>- キーワード: Boolean</p>  <p>- 範囲: 0がfalse、1がtrueを表す</p> |
| Bit          | <p>- サポート済み</p>  <p>- 範囲: 1から64</p>                                | サポートされていません                                                |
| Tinyint      | <p>- サポート済み</p> <p>- 符号付きと符号なしをサポート</p>  <p>- 範囲: 符号付きは-128から127、符号なしは0から255 </p> | <p>- サポート済み</p>  <p>- 符号付きのみサポート</p>  <p>- 範囲: -128から127</p>    |
| Smallint     | <p>- サポート済み</p> <p>- 符号付きと符号なしをサポート</p> <p> - 範囲: 符号付きは-2^15から2^15-1、符号なしは0から2^16-1</p> | <p>- サポート済み</p>  <p>- 符号付きのみサポート</p>  <p>- 範囲: -32768から32767</p> |
| Mediumint    | <p>- サポート済み</p> <p>- 符号付きと符号なしをサポート</p>  <p>- 範囲: 符号付きは-2^23から2^23-1、符号なしは0から2^24-1</p> | - サポートされていません                                              |
| Int          | <p>- サポート済み</p> <p>- 符号付きと符号なしをサポート</p>  <p>- 範囲: 符号付きは-2^31から2^31-1、符号なしは0から2^32-1</p> | <p>- サポート済み</p>  <p>- 符号付きのみサポート</p>  <p>- 範囲: -2147483648から2147483647</p> |
| Bigint       | <p>- サポート済み</p> <p>- 符号付きと符号なしをサポート</p> <p>- 範囲: 符号付きは-2^63から2^63-1、符号なしは0から2^64-1</p> | <p>- サポート済み</p>  <p>- 符号付きのみサポート</p>  <p>- 範囲: -2^63から2^63-1</p> |
| Largeint     | - サポートされていません                                              | <p>- サポート済み</p>  <p>- 符号付きのみサポート</p>  <p>- 範囲: -2^127から2^127-1</p> |
| Decimal      | <p>- サポート済み</p>  <p>- 符号付きと符号なしをサポート（8.0.17以降では非推奨）</p>  <p>- デフォルト: Decimal(10, 0)</p> | <p>- サポート済み</p>  <p>- 符号付きのみサポート</p>  <p>- デフォルト: Decimal(9, 0)</p> |
| Float/Double | <p>-サポート済み</p>  <p>- 符号付きと符号なしをサポート（8.0.17以降では非推奨）</p> | <p>- サポート済み</p>  <p>- 符号付きのみサポート</p>                          |

### 日付型

| 型        | MySQL                                                        | Doris                                                        |
| --------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| Date      | <p>- サポート済み</p> <p>- 範囲: ['1000-01-01', '9999-12-31']</p>   - フォーマット: YYYY-MM-DD | <p>- サポート済み</p> <p>- 範囲: ['0000-01-01', '9999-12-31']</p>   - フォーマット: YYYY-MM-DD |
| DateTime  | <p>- サポート済み</p> <p>- DATETIME([P])、Pは精度を定義するオプションパラメータ</p>  - 範囲: '1000-01-01 00:00:00.000000'から'9999-12-31 23:59:59.999999'  <p>- フォーマット: YYYY-MM-DD hh:mm:ss[.fraction]</p> | <p>- サポート済み</p> <p>- DATETIME([P])、Pは精度を定義するオプションパラメータ</p>  <p>- 範囲: ['0000-01-01 00:00:00[.000000]', '9999-12-31 23:59:59[.999999]']</p>   - フォーマット: YYYY-MM-DD hh:mm:ss[.fraction] |
| Timestamp | <p>- サポート済み</p> <p>- Timestamp[(p)]、Pは精度を定義するオプションパラメータ</p> <p>- 範囲: ['1970-01-01 00:00:01.000000' UTC, '2038-01-19 03:14:07.999999' UTC]</p>   <p>- フォーマット: YYYY-MM-DD hh:mm:ss[.fraction]</p> | - サポートされていません                                              |
| Time      | <p>- サポート済み</p> <p>- Time[(p)]</p>  <p>- 範囲: ['-838:59:59.000000'から'838:59:59.000000']</p>   <p>- フォーマット: hh:mm:ss[.fraction]</p> | - サポートされていません                                              |
| Year      | <p>- サポート済み</p> <p>- 範囲: 1901から2155、または0000</p>   - フォーマット: yyyy  | - サポートされていません                                              |

### 文字列型

| 型        | MySQL                                                        | Doris                                                        |
| --------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| Char      | <p>-サポート済み - CHAR[(M)]、Mは文字長。省略時、デフォルト長は1</p>  <p>- 固定長</p>  - 範囲: [0, 255]バイト | <p>- サポート済み</p> <p>- CHAR[(M)]、Mはバイト長</p>  <p>- 可変長</p>  - 範囲: [1, 255] |
| Varchar   | <p>- サポート済み</p> <p>- VARCHAR(M)、Mは文字長</p> <p>- 範囲: [0, 65535]バイト</p> | <p>- サポート済み</p> <p>- VARCHAR(M)、Mはバイト長</p>  <p>- 範囲: [1, 65533]</p> |
| String    | - サポートされていません                                              | <p>- サポート済み</p> <p>- 1,048,576バイト（1MB）、2,147,483,643バイト（2GB）まで増加可能</p> |
| Binary    | <p>- サポート済み</p> <p>- Charに類似</p>                                | - サポートされていません                                              |
| Varbinary | <p>- サポート済み</p> <p>- Varcharに類似</p>                             | <p>- サポートされていません</p>                                              |
| Blob      | <p>- サポート済み</p> <p>- TinyBlob、Blob、MediumBlob、LongBlob</p>           | - サポートされていません                                              |
| Text      | <p>- サポート済み</p> <p>- TinyText、Text、MediumText、LongText</p>           | - サポートされていません                                              |
| Enum      | <p>- サポート済み</p> <p>- 最大65,535要素をサポート</p>                 | - サポートされていません                                              |
| Set       | <p>- サポート済み</p> <p>- 最大64要素をサポート</p>                     | - サポートされていません                                              |

### JSON型

| 型   | MySQL       | Doris     |
| ---- | ----------- | --------- |
| JSON |  サポート済み | サポート済み |

### Doris固有のデータ型

Dorisにはいくつかの固有のデータ型があります。詳細は以下の通りです：

- **HyperLogLog**

  HLL（HyperLogLog）は、キー列として使用できないデータ型です。集約モデルテーブルでは、HLLに対応する集約タイプはHLL_UNIONです。長さとデフォルト値の指定は不要です。長さはデータ集約レベルに基づいて内部的に制御されます。HLL列は`HLL_UNION_AGG`、`HLL_RAW_AGG`、`HLL_CARDINALITY`、`HLL_HASH`などの関連関数でのみクエリまたは使用できます。

  HLLは近似ファジー重複除去に使用され、大量のデータを扱う際にcount distinctよりも優れたパフォーマンスを発揮します。HLLの一般的なエラー率は約1%で、時には2%に達することもあります。

- **Bitmap**

  Bitmapは、キー列として使用できないデータ型です。集約モデルテーブルでは、BITMAPに対応する集約タイプはBITMAP_UNIONです。HLLと同様に、長さとデフォルト値の指定は不要で、長さはデータ集約レベルに基づいて内部的に制御されます。Bitmap列は`BITMAP_UNION_COUNT`、`BITMAP_UNION`、`BITMAP_HASH`、`BITMAP_HASH64`などの関数でのみクエリまたは使用できます。

  従来のシナリオでBITMAPを使用するとロード速度に影響する可能性がありますが、大量のデータを扱う際には一般的にCount Distinctよりも優れたパフォーマンスを発揮します。リアルタイムシナリオでは、グローバル辞書なしでbitmap_hash()関数を使用してBITMAPを使用すると約0.1%のエラーが発生する可能性があることにご注意ください。このエラーが受け入れられない場合は、代わりにbitmap_hash64を使用できます。

- **QUANTILE_PERCENT**

  QUANTILE_STATEは、キー列として使用できないデータ型です。集約モデルテーブルでは、QUANTILE_STATEに対応する集約タイプはQUANTILE_UNIONです。長さとデフォルト値の指定は不要で、長さはデータ集約レベルに基づいて内部的に制御されます。QUANTILE_STATE列は`QUANTILE_PERCENT`、`QUANTILE_UNION`、`TO_QUANTILE_STATE`などの関数でのみクエリまたは使用できます。

  QUANTILE_STATEは近似分位値の計算に使用されます。インポート時には、同じキーで異なる値に対して事前集約を実行します。値の数が2048を超えない場合、すべてのデータを詳細に格納します。値の数が2048を超える場合、TDigestアルゴリズムを使用してデータを集約（クラスター化）し、クラスターの重心を保存します。

- **Array<T\>**

  Arrayは、T型の要素で構成される配列を表すDorisのデータ型です。キー列として使用することはできません。

- **MAP<K, V\>**

  MAPは、K型とV型の要素で構成されるマップを表すDorisのデータ型です。

- **STRUCT<field_name:field_type,...>**

  構造体（STRUCT）は複数のフィールドで構成されます。複数の列のコレクションとしても識別できます。

  - field_name: フィールドの識別子。一意である必要があります。
  - field_type: フィールドの型。

- **Agg_State**

  AGG_STATEは、キー列として使用できないDorisのデータ型です。テーブル作成時に、集約関数のシグネチャを宣言する必要があります。

  長さとデフォルト値の指定は不要で、実際のストレージサイズは関数の実装に依存します。

  AGG_STATEは、アグリゲータ用のSQLマニュアルから[STATE](../sql-manual/sql-functions/combinators/state) / [MERGE](../sql-manual/sql-functions/combinators/merge)/ [UNION](../sql-manual/sql-functions/combinators/union)関数と組み合わせてのみ使用できます。

## シンタックス

### DDL

#### 01 DorisでのCreate Tableシンタックス

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
#### 02 MySQLとの違い


| パラメータ              | MySQLとの違い                                       |
| ---------------------- | ------------------------------------------------------------ |
| Column_definition_list | - フィールドリスト定義：基本構文はMySQLと似ていますが、集約タイプに対する追加の操作が含まれています。<br />- 集約タイプの操作は主にAggregateをサポートしています。<br />- テーブル作成時、MySQLではフィールドリスト定義の後にIndex（例：Primary Key、Unique Key）などの制約を追加できますが、Dorisはデータモデルを定義することでこれらの制約と計算をサポートしています。 |
| Index_definition_list  | - インデックスリスト定義：基本構文はMySQLと似ており、bitmapインデックス、転置インデックス、N-Gramインデックスをサポートしていますが、Bloomフィルターインデックスはpropertiesを通じて設定されます。<br />- MySQLはB+TreeおよびHashインデックスをサポートしています。 |
| Engine_type            | - テーブルエンジンタイプ：オプション。<br />- 現在サポートされているテーブルエンジンは主にOLAPネイティブエンジンです。<br />- MySQLはInnodb、MyISAMなどのストレージエンジンをサポートしています。 |
| Keys_type              | - データモデル：オプション。<br />- サポートされるタイプには以下が含まれます：1) DUPLICATE KEY（デフォルト）：指定された列はソート列です。2) AGGREGATE KEY：指定された列はディメンション列です。3) UNIQUE KEY：指定された列は主キー列です。<br />- MySQLにはデータモデルの概念がありません。 |
| Table_comment          | テーブルコメント                                                |
| Partition_info         | - パーティショニングアルゴリズム：オプション。Dorisがサポートするパーティショニングアルゴリズムには以下が含まれます：<br />- LESS THAN：パーティションの上限のみを定義します。下限は前のパーティションの上限によって決定されます。<br />- FIXED RANGE：パーティションの左閉右開区間を定義します。<br />- MULTI RANGE：複数のRANGEパーティションを一括作成し、左閉右開区間を定義して、時間単位とステップを設定します。時間単位は年、月、日、週、時間をサポートしています。<br />MySQLはHash、Range、List、Keyなどのアルゴリズムをサポートしています。MySQLはサブパーティションもサポートしており、サブパーティションにはHashとKeyのみがサポートされています。 |
| Distribution_desc      | - バケットアルゴリズム：必須。以下が含まれます：1) Hashバケット構文：DISTRIBUTED BY HASH (k1[,k2 ...]) [BUCKETS num\|auto]。説明：指定されたキー列を使用してハッシュバケットを行います。2) ランダムバケット構文：DISTRIBUTED BY RANDOM [BUCKETS num\|auto]。説明：ランダム数を使用してバケットを行います。<br />- MySQLにはバケットアルゴリズムがありません。 |
| Rollup_list            | - テーブル作成時に複数の同期マテリアライズドビューを作成できます。<br />- 構文：`rollup_name (col1[, col2, ...]) [DUPLICATE KEY(col1[, col2, ...])][PROPERTIES("key" = "value")]`<br />- MySQLはこれをサポートしていません。 |
| Properties             | テーブルプロパティ：MySQLのテーブルプロパティとは異なり、テーブルプロパティを定義する構文もMySQLとは異なります。 |


#### 03 CREATE INDEX

```sql
CREATE INDEX [IF NOT EXISTS] index_name ON table_name (column [, ...],) [USING BITMAP];
```
- Dorisは現在、Bitmapインデックス、転置インデックス、N-Gramインデックスをサポートしています。BloomFilterインデックスもサポートされていますが、設定には別の構文があります。

- MySQLはB+TreeやHashなどのインデックスアルゴリズムをサポートしています。

#### 04 CREATE VIEW

```sql
CREATE VIEW [IF NOT EXISTS]
 [db_name.]view_name
 (column1[ COMMENT "col comment"][, column2, ...])
AS query_stmt

CREATE MATERIALIZED VIEW (IF NOT EXISTS)? mvName=multipartIdentifier
        (LEFT_PAREN cols=simpleColumnDefs RIGHT_PAREN)? buildMode?
        (REFRESH refreshMethod? refreshTrigger?)?
        (KEY keys=identifierList)?
        (COMMENT STRING_LITERAL)?
        (PARTITION BY LEFT_PAREN partitionKey = identifier RIGHT_PAREN)?
        (DISTRIBUTED BY (HASH hashKeys=identifierList | RANDOM) (BUCKETS (INTEGER_VALUE | AUTO))?)?
        propertyClause?
        AS query
```
- 基本構文はMySQLと一致しています。
- Dorisは論理ビューをサポートし、2種類のマテリアライズドビューをサポートします：同期マテリアライズドビューと非同期マテリアライズドビュー
- MySQLは非同期マテリアライズドビューをサポートしていません。

#### 05 ALTER TABLE / ALTER INDEX

DorisのALTER構文は基本的にMySQLと同じです。

### DROP TABLE / DROP INDEX

DorisのDROP構文は基本的にMySQLと同じです。

### DML

#### INSERT

```sql
INSERT INTO table_name
    [ PARTITION (p1, ...) ]
    [ WITH LABEL label]
    [ (column [, ...]) ]
    [ [ hint [, ...] ] ]
    { VALUES ( { expression | DEFAULT } [, ...] ) [, ...] | query }
```
DorisのINSERT構文は基本的にMySQLと同じです。

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
DorisのUPDATE構文は基本的にMySQLと同じですが、**`WHERE`条件を必ず追加する必要がある**ことに注意してください。

#### Delete

```sql
DELETE FROM table_name [table_alias] 
    [PARTITION partition_name | PARTITIONS (partition_name [, partition_name])]
    WHERE column_name op { value | value_list } [ AND column_name op { value | value_list } ...];
```
構文はフィルター述語のみを指定できます

```sql
DELETE FROM table_name [table_alias]
    [PARTITION partition_name | PARTITIONS (partition_name [, partition_name])]
    [USING additional_tables]
    WHERE condition
```
この構文はUNIQUE KEYモデルテーブルでのみ使用できます。

DorisのDELETE構文は基本的にMySQLと同じです。ただし、Dorisは分析データベースであるため、削除を頻繁に行うことはできません。

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
DorisのSELECT構文は基本的にMySQLと同じです。

## SQL Function

Doris FunctionはMySQLの関数の大部分をカバーしています。

## SQL Mode

| 名前 | 有効時の動作 | 無効時の動作 | 備考 |
| :-- | :-- | :-- | :-- |
| PIPES_AS_CONCAT | `\|\|`を`concat`関数として解析 | `\|\|`を論理AND演算子として解析 | - |
| NO_BACKSLASH_ESCAPES | 文字列内のバックスラッシュをリテラル文字として扱う | 文字列内のバックスラッシュをエスケープ文字として扱う | - |
