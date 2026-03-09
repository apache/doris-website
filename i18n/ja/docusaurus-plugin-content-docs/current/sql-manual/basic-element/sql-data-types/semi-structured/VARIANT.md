---
{
  "title": "バリアント",
  "language": "ja",
  "description": "VARIANT型は半構造化JSONデータを格納します。異なるプリミティブ型（整数、文字列、ブール値など）、一次元配列、ネストされたオブジェクトを含むことができます。書き込み時に、DorisはJSONパスに基づいてサブパスの構造と型を推論し、頻繁に使用されるパスを独立したサブカラムとしてマテリアライズし、柔軟性とパフォーマンスの両方を実現するためにカラムナストレージとベクトル化実行を活用します。"
}
---
## VARIANT

## 概要

VARIANT型は半構造化JSONデータを格納します。異なるプリミティブ型（整数、文字列、真偽値など）、一次元配列、およびネストされたオブジェクトを含むことができます。書き込み時に、DorisはJSONパスに基づいてサブパスの構造と型を推論し、頻繁に使用されるパスを独立したサブカラムとして実体化することで、カラムナーストレージとベクトル化実行を活用して柔軟性とパフォーマンスの両方を実現します。

## VARIANTの使用

### テーブル作成構文

テーブル作成時にVARIANTカラムを宣言します：

```sql
CREATE TABLE IF NOT EXISTS ${table_name} (
    k BIGINT,
    v VARIANT
)
PROPERTIES("replication_num" = "1");
```
Schema Template を使用して特定のパスを制約する（「Extended types」を参照）：

```sql
CREATE TABLE IF NOT EXISTS ${table_name} (
    k BIGINT,
    v VARIANT <
        'id' : INT,            -- restrict path id to INT
        'message*' : STRING,   -- restrict message* prefix to STRING
        'tags*' : ARRAY<TEXT>  -- restrict tags* prefix to ARRAY<TEXT>
    >
)
PROPERTIES("replication_num" = "1");
```
### クエリ構文

```sql
-- Access nested fields (returns VARIANT; explicit or implicit CAST is required for aggregation/comparison)
SELECT v['properties']['title'] FROM ${table_name};

-- CAST to a concrete type before aggregation
SELECT CAST(v['properties']['title'] AS STRING) AS title
FROM ${table_name}
GROUP BY title;

-- Query arrays
SELECT *
FROM ${table_name}
WHERE ARRAY_CONTAINS(CAST(v['tags'] AS ARRAY<TEXT>), 'Doris');
```
## プリミティブ型

VARIANTはサブカラムの型を自動的に推論します。サポートされている型は以下の通りです：

<table>
<tr><td>サポートされている型<br/></td></tr>
<tr><td>TinyInt<br/></td></tr>
<tr><td>NULL（JSON nullと同等）<br/></td></tr>
<tr><td>BigInt（64ビット）<br/>Double<br/></td></tr>
<tr><td>String（Text）<br/></td></tr>
<tr><td>Jsonb<br/></td></tr>
<tr><td>Variant（ネストしたオブジェクト）<br/></td></tr>
<tr><td>Array&lt;T&gt;（1次元のみ）<br/></td></tr>
</table>

シンプルなINSERTの例：

```sql
INSERT INTO vartab VALUES
  (1, 'null'),
  (2, NULL),
  (3, 'true'),
  (4, '-17'),
  (5, '123.12'),
  (6, '1.912'),
  (7, '"A quote"'),
  (8, '[-1, 12, false]'),
  (9, '{ "x": "abc", "y": false, "z": 10 }'),
  (10, '"2021-01-01"');
```
ヒント: date/timeなどの非標準JSON型は、Schema Templateが提供されない限り文字列として保存されます。計算効率を向上させるため、これらを静的列に抽出するか、Schema Templateを介してその型を宣言することを検討してください。

## 拡張型（Schema Template）

プリミティブ型に加えて、VARIANTはSchema Templateを介して以下の拡張型をサポートします：

- Number（拡張）
  - Decimal: Decimal32 / Decimal64 / Decimal128 / Decimal256
  - LargeInt
- Datetime
- Timestamptz
- Date
- IPV4 / IPV6
- Boolean
- ARRAY&lt;T&gt;（Tは上記のいずれかで、1次元のみ）

注意: 事前定義されたSchemaはテーブル作成時にのみ指定できます。ALTERは現在サポートされていません（将来のバージョンでは新しいサブカラム定義の追加をサポートする可能性がありますが、既存のサブカラム型の変更はサポートされません）。

例:

```sql
CREATE TABLE test_var_schema (
    id BIGINT NOT NULL,
    v1 VARIANT<
        'large_int_val': LARGEINT,
        'string_val': STRING,
        'decimal_val': DECIMAL(38, 9),
        'datetime_val': DATETIME,
        'tz_val': TIMESTAMPTZ,
        'ip_val': IPV4
    > NULL
)
PROPERTIES ("replication_num" = "1");

INSERT INTO test_var_schema VALUES (1, '{
    "large_int_val" : "123222222222222222222222",
    "string_val" : "Hello World",
    "decimal_val" : 1.11111111,
    "datetime_val" : "2025-05-16 11:11:11",
    "tz_val" : "2025-05-16 11:11:11+08:00",
    "ip_val" : "127.0.0.1"
}');

SELECT variant_type(v1) FROM test_var_schema;

+---------------------------------------------------------------------------------------------------------------------------------------------------+
| variant_type(v1)                                                                                                                                  |
+---------------------------------------------------------------------------------------------------------------------------------------------------+
| {"datetime_val":"datetimev2","decimal_val":"decimal128i","ip_val":"ipv4","large_int_val":"largeint","string_val":"string","tz_val":"timestamptz"} |
+---------------------------------------------------------------------------------------------------------------------------------------------------+
```
`{"date": 2020-01-01}`と`{"ip": 127.0.0.1}`は無効なJSONテキストです。正しい形式は`{"date": "2020-01-01"}`と`{"ip": "127.0.0.1"}`です。

Schema Templateが指定されると、JSON値が宣言された型と競合し、変換できない場合は、NULLとして保存されます。例えば：

```sql
INSERT INTO test_var_schema VALUES (1, '{
  "decimal_val" : "1.11111111",
  "ip_val" : "127.xxxxxx.xxxx",
  "large_int_val" : "aaabbccc"
}');

-- Only decimal_val remains
SELECT * FROM test_var_schema;

+------+-----------------------------+
| id   | v1                          |
+------+-----------------------------+
|    1 | {"decimal_val":1.111111110} |
+------+-----------------------------+
```
スキーマは永続化ストレージの型のみを指定します。クエリ実行時には、実効型は実行時の実際のデータに依存します：

```sql
-- At runtime v['a'] may still be STRING
SELECT variant_type(CAST('{"a" : "12345"}' AS VARIANT<'a' : INT>)['a']);
```
ワイルドカードマッチングと順序:

```sql
CREATE TABLE test_var_schema (
    id BIGINT NOT NULL,
    v1 VARIANT<
        'enumString*' : STRING,
        'enum*' : ARRAY<TEXT>,
        'ip*' : IPV6
    > NULL
)
PROPERTIES ("replication_num" = "1");

-- If enumString1 matches both patterns, the first matching pattern in definition order (STRING) is used
```
カラム名に`*`が含まれており、プレフィックスワイルドカードとしてではなく文字通りの名前でマッチさせたい場合は、以下を使用してください：

```sql
v1 VARIANT<
    MATCH_NAME 'enumString*' : STRING
> NULL
```
マッチしたサブパスは、デフォルトで列として具現化されます。マッチするパスが多すぎて過剰な列が生成される場合は、`variant_enable_typed_paths_to_sparse`を有効にすることを検討してください（「Configuration」を参照）。

## 型の競合と昇格ルール

同じパスで互換性のない型が現れた場合（例：同じフィールドが整数と文字列の両方として現れる）、情報の損失を避けるためにJSONBに型が昇格されます：

```sql
{"a" : 12345678}
{"a" : "HelloWorld"}
-- a will be promoted to JSONB
```
プロモーションルール:

| Source type    | Current type  | Final type   |
| -------------- | ------------- | ------------ |
| `TinyInt`      | `BigInt`      | `BigInt`     |
| `TinyInt`      | `Double`      | `Double`     |
| `TinyInt`      | `String`      | `JSONB`      |
| `TinyInt`      | `Array`       | `JSONB`      |
| `BigInt`       | `Double`      | `JSONB`      |
| `BigInt`       | `String`      | `JSONB`      |
| `BigInt`       | `Array`       | `JSONB`      |
| `Double`       | `String`      | `JSONB`      |
| `Double`       | `Array`       | `JSONB`      |
| `Array<Double>`| `Array<String>`| `Array<Jsonb>` |

厳密な型が必要な場合（安定したインデックス作成とストレージのため）は、Schema Templateを使用して宣言してください。

## Variantインデックス

### インデックスの選択

VARIANTはサブパス上でBloomFilterとInverted Indexをサポートします。
- 高カーディナリティの等価/INフィルタ: BloomFilterを選択（よりスパースなインデックス、優れた書き込みパフォーマンス）。
- トークン化/フレーズ/範囲検索: Inverted Indexを使用し、適切な`parser`/`analyzer`プロパティを設定。

```sql
...  
PROPERTIES("replication_num" = "1", "bloom_filter_columns" = "v");

-- Use BloomFilter for equality/IN filters
SELECT * FROM tbl WHERE v['id'] = 12345678;
SELECT * FROM tbl WHERE v['id'] IN (1, 2, 3);
```
VARIANT列に転置インデックスが作成されると、すべてのサブパスは同じインデックスプロパティ（例：parser）を継承します：

```sql
CREATE TABLE IF NOT EXISTS tbl (
    k BIGINT,
    v VARIANT,
    INDEX idx_v(v) USING INVERTED PROPERTIES("parser" = "english")
);

-- All subpaths inherit the english parser
SELECT * FROM tbl WHERE v['id_1'] MATCH 'Doris';
SELECT * FROM tbl WHERE v['id_2'] MATCH 'Apache';
```
### subpathによるインデックス

3.1.x/4.0以降では、特定のVARIANT subpathに対してインデックスプロパティを指定でき、同じパスに対してトークン化されたインデックスとトークン化されていないインデックスの両方を設定することも可能です。パス固有のインデックスでは、Schema Templateを介してパスタイプを宣言する必要があります。

```sql
-- Common properties: field_pattern (target path), analyzer, parser, support_phrase, etc.
CREATE TABLE IF NOT EXISTS tbl (
    k BIGINT,
    v VARIANT<'content' : STRING>,
    INDEX idx_tokenized(v) USING INVERTED PROPERTIES("parser" = "english", "field_pattern" = "content"),
    INDEX idx_v(v) USING INVERTED PROPERTIES("field_pattern" = "content")
);

-- v.content has both tokenized and non-tokenized inverted indexes
SELECT * FROM tbl WHERE v['content'] MATCH 'Doris';
SELECT * FROM tbl WHERE v['content'] = 'Doris';
```
ワイルドカードパスのインデックス化:

```sql
CREATE TABLE IF NOT EXISTS tbl (
    k BIGINT,
    v VARIANT<'pattern_*' : STRING>,
    INDEX idx_tokenized(v) USING INVERTED PROPERTIES("parser" = "english", "field_pattern" = "pattern_*"),
    INDEX idx_v(v) USING INVERTED -- global non-tokenized inverted index
);

SELECT * FROM tbl WHERE v['pattern_1'] MATCH 'Doris';
SELECT * FROM tbl WHERE v['pattern_1'] = 'Doris';
```
注意: 2.1.7+では、InvertedIndex V2プロパティのみをサポートします（ファイル数の削減、書き込みIOPSの低減。ストレージ/コンピュート分離に適しています）。2.1.8+では、オフラインBuild Indexが削除されました。

### インデックスが機能しない場合

1. 型変更によるインデックス喪失: サブパスが互換性のない型に変更された場合（例：INT → JSONB）、インデックスが失われます。Schema Templateを使用して型とインデックスを固定することで修正できます。
2. クエリ型の不一致:

   ```sql
   -- v['id'] is actually STRING; using INT equality causes index not to be used
   SELECT * FROM tbl WHERE v['id'] = 123456;
   ```
3. インデックスの設定ミス: インデックスはサブパスに適用され、VARIANT列全体には適用されません。

   ```sql
   -- VARIANT itself cannot be indexed as a whole
   SELECT * FROM tbl WHERE v MATCH 'Doris';

   -- If whole-JSON search is needed, store a duplicate STRING column and index it
   CREATE TABLE IF NOT EXISTS tbl (
       k BIGINT,
       v VARIANT,
       v_str STRING,
       INDEX idx_v_str(v_str) USING INVERTED PROPERTIES("parser" = "english")
   );
   SELECT * FROM tbl WHERE v_str MATCH 'Doris';
   ```
## INSERT と load

### INSERT INTO VALUES

```sql
CREATE TABLE IF NOT EXISTS variant_tbl (
    k BIGINT,
    v VARIANT
) PROPERTIES("replication_num" = "1");

INSERT INTO variant_tbl VALUES (1, '{"a" : 123}');

select * from variant_tbl;
+------+-----------+
| k    | v         |
+------+-----------+
|    1 | {"a":123} |
+------+-----------+

-- v['a'] is a VARIANT
select v['a'] from variant_tbl;
+--------+
| v['a'] |
+--------+
| 123    |
+--------+

-- Accessing a non-existent key returns NULL
select v['a']['no_such_key'] from variant_tbl;;
+-----------------------+
| v['a']['no_such_key'] |
+-----------------------+
| NULL                  |
+-----------------------+

```
### Load (Stream Load)

```bash
# Line-delimited JSON (one JSON record per line)
curl --location-trusted -u root: -T gh_2022-11-07-3.json \
  -H "read_json_by_line:true" -H "format:json" \
  http://127.0.0.1:8030/api/test_variant/github_events/_stream_load
```
こちらも参照してください: `https://doris.apache.org/docs/dev/data-operate/import/complex-types/variant`

読み込み後、`SELECT count(*)`で検証するか、`SELECT * ... LIMIT 1`でサンプリングしてください。高スループットでの取り込みには、RANDOMバケッティングを使用し、Group Commitを有効にすることを推奨します。

## サポートされている操作とCASTルール

- VARIANTは他の型と直接比較/操作することはできません。2つのVARIANT間での比較もサポートされていません。
- 比較、フィルタリング、集約、および順序付けには、サブパスを具体的な型に（明示的または暗黙的に）CASTしてください。

```sql
-- Explicit CAST
SELECT CAST(v['arr'] AS ARRAY<TEXT>) FROM tbl;
SELECT * FROM tbl WHERE CAST(v['decimal'] AS DECIMAL(27, 9)) = 1.111111111;
SELECT * FROM tbl WHERE CAST(v['date'] AS DATE) = '2021-01-02';

-- Implicit CAST
SELECT * FROM tbl WHERE v['bool'];
SELECT * FROM tbl WHERE v['str'] MATCH 'Doris';
```
- VARIANT自体はORDER BY、GROUP BY、JOIN KEY、または集約引数として直接使用することはできません。代わりにサブパスをCASTしてください。
- 文字列はVARIANTに暗黙的に変換できます。

| VARIANT         | Castable | Coercible |
| --------------- | -------- | --------- |
| `ARRAY`         | ✔        | ❌        |
| `BOOLEAN`       | ✔        | ✔         |
| `DATE/DATETIME` | ✔        | ✔         |
| `FLOAT`         | ✔        | ✔         |
| `IPV4/IPV6`     | ✔        | ✔         |
| `DECIMAL`       | ✔        | ✔         |
| `MAP`           | ❌        | ❌        |
| `TIMESTAMP`     | ✔        | ✔         |
| `VARCHAR`       | ✔        | ✔         |
| `JSON`          | ✔        | ✔         |

## ワイドカラム

取り込まれたデータに多くの異なるJSONキーが含まれている場合、VARIANTのマテリアライズされたサブカラムは急速に増加する可能性があります。スケール時にはメタデータの肥大化、書き込み/マージコストの増加、クエリの遅延を引き起こす場合があります。「ワイドカラム」（サブカラムが多すぎる状況）に対処するため、VARIANTは2つのメカニズムを提供します：**Sparse columns**と**DOC encoding**です。

注：これら2つのメカニズムは相互排他的です。DOC encodingを有効にするとsparse columnsが無効になり、その逆も同様です。

### Sparse columns

**動作原理**

- システムは非NULL比率/スパース性によってパスをランク付けします。高頻度（スパースでない）パスは独立したサブカラムとしてマテリアライズされ、残りの低頻度（スパース）パスはマージされてsparse columnsに保存されます。マテリアライズされるサブカラムの最大数は`variant_max_subcolumns_count`によって制御されます。
- Schema Templateでパスが宣言されている場合、デフォルトではsparse columnsに移動されません。型付きパスをsparse columnsに移動できるようにするには、`variant_enable_typed_paths_to_sparse`を設定してください。
- Sparse columnsはシャーディングをサポートします：スパースサブパスを複数のsparse columnsに分散して、カラムごとの読み取りオーバーヘッドを削減し、読み取り効率を向上させます。物理的に保存されるsparse columnsの数を指定するには`variant_sparse_hash_shard_count`を使用してください。

**使用すべき場面**

- 全体的には多くのJSONキーがあるが、クエリは主に高頻度フィールド（ホットフィールド）の小さなサブセットをターゲットとする場合。
- 高度に偏ったキー分布（少数のキーが頻繁に出現し、多数のキーが時々出現する場合）：ロングテールキーをクエリ可能な状態に保ちながら（通常は遅くなります）、ホットパスの良好なパフォーマンスを求める場合。

**制限と設定に関する注意事項**

- ほとんどのキーが似たような非NULL比率を持つ場合（スパース性のコントラストが少ない）、真にスパースなパスを特定することが困難で、sparse columnsの恩恵は減少します。
- `variant_max_subcolumns_count`（マテリアライズされたサブカラム）は≤ 10000に保つことを推奨します。
- 型付きパス（Schema Templateで宣言）に対して高いクエリ要件がある場合は、`variant_enable_typed_paths_to_sparse = false`を推奨します。
- `variant_sparse_hash_shard_count`は「スパースパス数 / 128」として大まかに見積もることができます。例：総JSONキー数 ≈ 10,000、`variant_max_subcolumns_count = 2000`の場合、スパースパス ≈ 8000なので、`variant_sparse_hash_shard_count`は`8000/128`から開始できます。

### DOC encoding（DOCモード）

**動作原理**

- パスベースクエリのために独立したサブカラムとしてパスをマテリアライズできると同時に、完全なJSONドキュメントを効率的に返すために元のJSONがstored fieldとして追加保存されます。
- DOC encodingはシャーディングをサポートします：元のJSONは保存のために複数のカラムに分割され、完全なJSONをクエリする際に再組み立てされます。DOCシャード数を指定するには`variant_doc_hash_shard_count`を使用してください。
- 小バッチ書き込みの場合、サブカラムをスキップしてマージ中に後でマテリアライズできます。これは`variant_doc_materialization_min_rows`によって制御されます。例えば、`variant_doc_materialization_min_rows = 10000`の場合、10,000行未満の書き込みは元のJSONのみを保存し、そのバッチではサブカラムをマテリアライズしません。

**使用すべき場面**

- 全体的には多くの異なるキーがあるが、各行には少数のキーのみが含まれる場合（例：行ごとのキー数 < 総キー数の5%）：典型的なスパースワイドカラムワークロード。
- 完全なJSONドキュメント（例：`SELECT *` / 全行返却）を頻繁に必要とし、多数のサブカラムからのJSON組み立てを避けたいワークロード。
- 小バッチのサブカラムマテリアライゼーションオーバーヘッドを削減し、後のマージまで延期したい場合。
- 追加のストレージコスト（元のJSONがstored fieldとして保存されるため）を受け入れられる場合。

**制限と設定に関する注意事項**

- DOCモードには`variant_enable_doc_mode = true`が必要です。
- DOCモードでは、Schema Templateで宣言された型付きパスは数値、文字列、配列型に制限されます。
- `variant_doc_hash_shard_count`は「総JSONキー数 / 128」として大まかに見積もることができます。

完全なプロパティリストについては、以下の「Configuration」セクションを参照してください。

## 制限事項

- **ワイドテーブル最適化**：`VARIANT`型によって生成される動的サブカラムが多数（例：2000カラム以上）あるワイドテーブルの場合、テーブルの`PROPERTIES`で`"storage_format" = "V3"`を指定して**Storage Format V3**を有効にすることを強く推奨します。これによりカラムメタデータがSegment Footerから切り離され、ファイルオープンが高速化され、メモリオーバーヘッドが削減されます。
- JSONキー長 ≤ 255。
- プライマリキーまたはソートキーにはできません。
- 他の型内でネストできません（例：`Array<Variant>`、`Struct<Variant>`）。
- VARIANT カラム全体を読み取ると、すべてのサブパスがスキャンされます。カラムに多くのサブパスがある場合、`LIKE`などのオブジェクト全体検索のために追加のSTRING/JSONBカラムに元のJSON文字列を保存することを検討してください：

```sql
CREATE TABLE example_table (
  id INT,
  data_variant VARIANT
);
SELECT * FROM example_table WHERE data_variant LIKE '%doris%';

-- Better: keep the original JSON string for whole-object matching
CREATE TABLE example_table (
  id INT,
  data_string STRING,
  data_variant VARIANT
);
SELECT * FROM example_table WHERE data_string LIKE '%doris%';
```
## Configuration

3.1+ から、VARIANT は列に対する型レベルプロパティをサポートします：

```sql
CREATE TABLE example_table (
  id INT,
  data_variant VARIANT<
      'path_1' : INT,
      'path_2' : STRING,
      properties(
          'variant_max_subcolumns_count' = '2048',
          'variant_enable_typed_paths_to_sparse' = 'true',
          'variant_sparse_hash_shard_count' = '64'
      )
  >
);
```
<table>
<tr><td>プロパティ</td><td>説明</td></tr>
<tr><td>`variant_max_subcolumns_count`</td><td>マテリアライズされたパスの最大数。この閾値を超えると、新しいパスは共有データ構造に格納される場合があります。デフォルト: 2048（推奨）。0は制限なしを意味します；10000を超えないでください。</td></tr>
<tr><td>`variant_enable_typed_paths_to_sparse`</td><td>デフォルトでは、型付きパスは常にマテリアライズされます（`variant_max_subcolumns_count`にはカウントされません）。`true`に設定すると、型付きパスも閾値にカウントされ、共有構造に移動される場合があります。</td></tr>
<tr><td>`variant_sparse_hash_shard_count`</td><td>スパース列のシャード数。読み取りパフォーマンスを向上させるため、スパースサブパスを複数のスパース列に分散します。デフォルト: 1；スパースサブパスの数に基づいて調整してください。</td></tr>
</table>

```sql
CREATE TABLE example_table (
  id INT,
  data_variant VARIANT<
      'path_1' : INT,
      'path_2' : STRING,
      properties(
          'variant_enable_doc_mode' = 'true',
          'variant_doc_materialization_min_rows' = '10000',
          'variant_doc_hash_shard_count' = '64'
      )
  >
);
```
<table>
<tr><td>プロパティ</td><td>説明</td></tr>
<tr><td>`variant_enable_doc_mode`</td><td>DOCエンコーディングモードを有効にします。`true`の場合、元のJSONがstored fieldとして保存され、JSON文書全体を素早く返すことができます。DOCモードはsparse columnsと相互排他的です。デフォルト: `false`。</td></tr>
<tr><td>`variant_doc_materialization_min_rows`</td><td>DOCモードでサブカラムを物質化するための最小行閾値。行数がこの値を下回る場合、元のJSONのみが保存されます。compactionがファイルをマージして閾値に達した後、サブカラムが物質化されます。小バッチ書き込みのオーバーヘッドを削減します。</td></tr>
<tr><td>`variant_doc_hash_shard_count`</td><td>DOCエンコーディングのシャード数。元のJSONが指定された数のカラムに分割されて保存され、JSON全体をクエリする際に再組み立てされます。デフォルト: 64。JSONサイズと並行性に基づいて調整してください。</td></tr>
</table>

制限値での動作と調整提案:

1. 閾値を超えた後、新しいパスは共有構造に書き込まれます。Rowsetマージも一部のパスを共有構造にリサイクルする場合があります。
2. システムは、null以外の比率が高く、アクセス頻度が高いパスを物質化状態で保持することを優先します。
3. 10,000個の物質化パスに近づく場合は、強力なハードウェア（ノードあたり≥128G RAM、≥32C推奨）が必要です。
4. 取り込み調整: クライアントの`batch_size`を適切に増やすか、Group Commitを使用します（必要に応じて`group_commit_interval_ms`/`group_commit_data_bytes`を増やす）。
5. パーティションプルーニングが不要な場合は、RANDOMバケッティングを検討し、single-tablet loadingを有効にしてcompaction書き込み増幅を削減してください。
6. BE調整ノブ: `max_cumu_compaction_threads`（≥8）、`vertical_compaction_num_columns_per_group=500`（vertical compactionを改善しますがメモリを増加）、`segment_cache_memory_percentage=20`（メタデータキャッシュ効率を改善）。
7. Compaction Scoreを監視してください。継続的に上昇している場合、compactionが遅れています—取り込み圧力を減らしてください。
8. VARIANTで大きな`SELECT *`は避けてください。`SELECT v['path']`のような特定のプロジェクションを優先してください。

注意: Stream Loadエラー`[DATA_QUALITY_ERROR]Reached max column size limit 2048`が表示される場合（2.1.xと3.0.xでのみ）、マージされたタブレットスキーマがカラム制限に達したことを意味します。`variant_max_merged_tablet_schema_size`を増やすことができます（4096を超えることは推奨されません。強力なハードウェアが必要です）。

## カラム数と型の検査

アプローチ1: `variant_type`を使用して行単位のスキーマを検査（より正確、高コスト）:

```sql
SELECT variant_type(v) FROM variant_tbl;
```
アプローチ2: マテリアライズされたサブパスのみを表示するように`DESC`を拡張（抽出されたもののみ）：

```sql
SET describe_extend_variant_column = true;
DESC variant_tbl;
```
``` sql
DESCRIBE ${table_name} PARTITION ($partition_name);
```
両方を使用する：アプローチ1は正確、アプローチ2は効率的。

## JSON型との比較

- ストレージ：JSONはJSONB（行指向）として格納される。VARIANTは推論され、書き込み時に列にマテリアライズされる（より高い圧縮率、より小さなサイズ）。
- クエリ：JSONは解析が必要。VARIANTは列を直接スキャンし、通常はるかに高速。

ClickBench（43クエリ）：
- ストレージ：VARIANTはJSONと比較して約65%節約。
- クエリ：VARIANTはJSONより8倍以上高速で、事前定義された静的列に近い。

**ストレージ容量**

| 型                  | サイズ     |
| ------------------- | ---------- |
| Predefined columns  | 12.618 GB  |
| VARIANT             | 12.718 GB  |
| JSON                | 35.711 GB  |

**約65%の容量節約**

| 実行            | Predefined | VARIANT | JSON            |
| ----------------| ---------- | ------- | --------------- |
| First (cold)    | 233.79s    | 248.66s | Most timed out  |
| Second (hot)    | 86.02s     | 94.82s  | 789.24s         |
| Third (hot)     | 83.03s     | 92.29s  | 743.69s         |

## FAQ

1. VARIANTの`null`とSQLの`NULL`は異なりますか？
   - いいえ。これらは同等です。
2. なぜ私のクエリ/インデックスが動作しないのですか？
   - パスを正しい型にCASTしているかどうか、競合によって型がJSONBに昇格されたかどうか、またはサブパスではなくVARIANT全体にインデックスを期待していないかどうかを確認してください。
