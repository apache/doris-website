---
{
  "title": "VARIANT",
  "description": "VARIANT型は半構造化JSONデータを格納します。異なるプリミティブ型（整数、文字列、ブール値など）を含むことができます。",
  "language": "ja"
}
---
## VARIANT

## 概要

VARIANT型は半構造化JSONデータを格納します。異なるプリミティブ型（整数、文字列、真偽値など）、1次元配列、ネストされたオブジェクトを含むことができます。書き込み時に、DorisはJSONパスに基づいてサブパスの構造と型を推論し、頻繁にアクセスされるパスを独立したサブカラムとして実体化することで、カラムナストレージとベクトル化実行を活用して柔軟性とパフォーマンスの両方を実現します。

## VARIANTの使用

### table作成構文

table作成時にVARIANTカラムを宣言します：

```sql
CREATE TABLE IF NOT EXISTS ${table_name} (
    k BIGINT,
    v VARIANT
)
PROPERTIES("replication_num" = "1");
```
Schema Template を使用して特定のパスを制約します（「Extended types」を参照）：

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

VARIANTはサブカラムの型を自動的に推論します。サポートされている型には以下が含まれます：

<table>
<tr><td>サポートされている型<br/></td></tr>
<tr><td>TinyInt<br/></td></tr>
<tr><td>NULL（JSON nullと同等）<br/></td></tr>
<tr><td>BigInt（64ビット）<br/>Double<br/></td></tr>
<tr><td>String（Text）<br/></td></tr>
<tr><td>Jsonb<br/></td></tr>
<tr><td>Variant（ネストされたオブジェクト）<br/></td></tr>
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
ヒント: 日付/時刻などの非標準JSON型は、Schema Templateが提供されない限り文字列として保存されます。計算効率を向上させるため、静的列への抽出やSchema Templateを使用した型宣言を検討してください。

## 拡張型 (Schema Template)

プリミティブ型に加えて、VARIANTはSchema Templateを介して以下の拡張型をサポートします：

- Number (拡張)
  - Decimal: Decimal32 / Decimal64 / Decimal128 / Decimal256
  - LargeInt
- Datetime
- Date
- IPV4 / IPV6
- Boolean
- ARRAY&lt;T&gt; (Tは上記のいずれかで、一次元のみ)

注意: 事前定義されたSchemaはTable作成時にのみ指定可能です。ALTERは現在サポートされていません（将来のバージョンでは新しいサブカラム定義の追加がサポートされる可能性がありますが、既存のサブカラム型の変更はサポートされません）。

例:

```sql
CREATE TABLE test_var_schema (
    id BIGINT NOT NULL,
    v1 VARIANT<
        'large_int_val': LARGEINT,
        'string_val': STRING,
        'decimal_val': DECIMAL(38, 9),
        'datetime_val': DATETIME,
        'ip_val': IPV4
    > NULL
)
PROPERTIES ("replication_num" = "1");

INSERT INTO test_var_schema VALUES (1, '{
    "large_int_val" : "123222222222222222222222",
    "string_val" : "Hello World",
    "decimal_val" : 1.11111111,
    "datetime_val" : "2025-05-16 11:11:11",
    "ip_val" : "127.0.0.1"
}');

SELECT variant_type(v1) FROM test_var_schema;

+----------------------------------------------------------------------------------------------------------------------------+
| variant_type(v1)                                                                                                           |
+----------------------------------------------------------------------------------------------------------------------------+
| {"datetime_val":"datetimev2","decimal_val":"decimal128i","ip_val":"ipv4","large_int_val":"largeint","string_val":"string"} |
+----------------------------------------------------------------------------------------------------------------------------+
```
`{"date": 2020-01-01}` と `{"ip": 127.0.0.1}` は無効なJSONテキストです。正しい形式は `{"date": "2020-01-01"}` と `{"ip": "127.0.0.1"}` です。

Schema Templateが指定されると、JSON値が宣言された型と競合し、変換できない場合、NULLとして保存されます。例えば：

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
スキーマは永続化ストレージの型のみを指定します。クエリ実行時には、実効的な型は実行時の実際のデータに依存します：

```sql
-- At runtime v['a'] may still be STRING
SELECT variant_type(CAST('{"a" : "12345"}' AS VARIANT<'a' : INT>)['a']);
```
ワイルドカード一致と順序：

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
カラム名に `*` が含まれており、それをワイルドカードのプレフィックスとしてではなく、リテラル名として一致させたい場合は、次のようにします：

```sql
v1 VARIANT<
    MATCH_NAME 'enumString*' : STRING
> NULL
```
マッチした subpath はデフォルトで列として具体化されます。あまりに多くのパスがマッチして過度な列が生成される場合は、`variant_enable_typed_paths_to_sparse` の有効化を検討してください（「構成」を参照）。

## 型の競合とプロモーションルール

同一パス上に互換性のない型が現れた場合（例：同じフィールドが integer と string の両方として現れる場合）、情報の損失を避けるために型は JSONB にプロモーションされます：

```sql
{"a" : 12345678}
{"a" : "HelloWorld"}
-- a will be promoted to JSONB
```
プロモーションルール:

| ソースタイプ    | Current type  | Final type   |
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

厳密な型が必要な場合（安定したインデックス作成とストレージのため）は、Schema Templateを介して宣言してください。

## Variantインデックス

### インデックスの選択

VARIANTはサブパス上でBloomFilterとInverted Indexをサポートします。
- 高カーディナリティの等価/INフィルタ: BloomFilterを使用（よりスパースなインデックス、書き込みパフォーマンスが向上）。
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

3.1.x/4.0以降では、特定のVARIANT subpathに対してインデックスプロパティを指定でき、同じパスに対してトークン化された転置インデックスとトークン化されていない転置インデックスの両方を設定することも可能です。パス固有のインデックスでは、Schema Templateを介してパスタイプを宣言する必要があります。

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
ワイルドカードパスインデックス:

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
注意: 2.1.7+ は InvertedIndex V2 プロパティのみをサポートします（ファイル数が少なく、書き込み IOPS が低い；分散ストレージ/コンピュートに適している）。2.1.8+ では offline Build Index が削除されます。

### インデックスが動作しない場合

1. 型の変更によるインデックスの損失: サブパスが互換性のない型に変更された場合（例：INT → JSONB）、インデックスが失われます。Schema Template を使用して型とインデックスを固定することで修正してください。
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
参照: `https://doris.apache.org/docs/dev/data-operate/import/complex-types/variant`

読み込み後は、`SELECT count(*)`で検証するか、`SELECT * ... LIMIT 1`でサンプリングしてください。高スループットでの取り込みには、RANDOMバケットを使用し、Group Commitを有効にすることを推奨します。

## サポートされる操作とCASTルール

- VARIANTは他の型と直接比較/操作することはできません。2つのVARIANT間の比較もサポートされていません。
- 比較、フィルタリング、集約、並び替えには、サブパスを（明示的または暗黙的に）具体的な型にCASTしてください。

```sql
-- Explicit CAST
SELECT CAST(v['arr'] AS ARRAY<TEXT>) FROM tbl;
SELECT * FROM tbl WHERE CAST(v['decimal'] AS DECIMAL(27, 9)) = 1.111111111;
SELECT * FROM tbl WHERE CAST(v['date'] AS DATE) = '2021-01-02';

-- Implicit CAST
SELECT * FROM tbl WHERE v['bool'];
SELECT * FROM tbl WHERE v['str'] MATCH 'Doris';
```
- VARIANT自体はORDER BY、GROUP BY、JOIN KEY、または集約引数として直接使用することはできません。代わりにsubpathをCASTしてください。
- StringsはVARIANTに暗黙的に変換できます。

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

## 制限事項

- `variant_max_subcolumns_count`: デフォルト0（制限なし）。本番環境では2048（tabletレベル）に設定して、マテリアライズされたパスの数を制御してください。閾値を超えると、低頻度/スパースなパスは共有データ構造に移動され、そこからの読み取りは遅くなる可能性があります（「構成」を参照）。
- Schema Templateでパスタイプが指定されている場合、そのパスは強制的にマテリアライズされます。`variant_enable_typed_paths_to_sparse = true`の場合、これも閾値にカウントされ、共有構造に移動される可能性があります。
- JSONキー長は255以下です。
- プライマリキーやソートキーにすることはできません。
- 他の型内にネストすることはできません（例：`Array<Variant>`、`Struct<Variant>`）。
- VARIANT列全体を読み取ると、すべてのsubpathがスキャンされます。列に多くのsubpathがある場合は、`LIKE`などのオブジェクト全体の検索用に、元のJSON文字列を追加のSTRING/JSONB列に保存することを検討してください：

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
## 構成

3.1+より、VARIANTは列における型レベルプロパティをサポートしています：

```sql
CREATE TABLE example_table (
  id INT,
  data_variant VARIANT<
      'path_1' : INT,
      'path_2' : STRING,
      properties(
          'variant_max_subcolumns_count' = '2048',
          'variant_enable_typed_paths_to_sparse' = 'true'
      )
  >
);
```
<table>
<tr><td>プロパティ<br/></td><td>説明<br/></td></tr>
<tr><td>`variant_max_subcolumns_count`<br/></td><td>マテリアライズされたパスの最大数。閾値を超えると、新しいパスは共有データ構造に格納される可能性があります。デフォルト0（無制限）。推奨値2048、10000を超えないでください。<br/></td></tr>
<tr><td>`variant_enable_typed_paths_to_sparse`<br/></td><td>デフォルトでは、型付きパスは常にマテリアライズされ（`variant_max_subcolumns_count`にはカウントされません）。`true`に設定すると、型付きパスも閾値にカウントされ、共有構造に移動される可能性があります。<br/></td></tr>
</table>

制限時の動作とチューニング提案：

1. 閾値を超えた後、新しいパスは共有構造に書き込まれます。Rowsetのマージにより、一部のパスが共有構造にリサイクルされることもあります。
2. システムは、非null率が高く、アクセス頻度が高いパスをマテリアライズされた状態で保持することを優先します。
3. 10,000個近いマテリアライズされたパスには、強力なハードウェアが必要です（ノードあたり≥128G RAM、≥32C推奨）。
4. 取り込みチューニング：クライアントの`batch_size`を適切に増やすか、Group Commitを使用します（必要に応じて`group_commit_interval_ms`/`group_commit_data_bytes`を増やす）。
5. パーティションプルーニングが不要な場合は、RANDOMバケッティングを検討し、単一タブレット読み込みを有効にしてコンパクション書き込み増幅を減らします。
6. BEチューニングノブ：`max_cumu_compaction_threads`（≥8）、`vertical_compaction_num_columns_per_group=500`（垂直コンパクションを改善しますが、メモリを増加）、`segment_cache_memory_percentage=20`（メタデータキャッシュ効率を改善）。
7. コンパクション Scoreを監視してください。継続的に上昇している場合、コンパクションが遅れています—取り込み圧力を減らしてください。
8. VARIANTで大きな`SELECT *`を避けてください。`SELECT v['path']`のような特定のプロジェクションを優先してください。

注意：Stream Loadエラー`[DATA_QUALITY_ERROR]Reached max column size limit 2048`が表示された場合（2.1.xおよび3.0.xのみ）、マージされたタブレットスキーマがカラム制限に達したことを意味します。`variant_max_merged_tablet_schema_size`を増やすことができます（4096を超えることは推奨されません。強力なハードウェアが必要）。

## カラム数と型の検査

アプローチ1：`variant_type`を使用して行ごとのスキーマを検査（より正確、高コスト）：

```sql
SELECT variant_type(v) FROM variant_tbl;
```
アプローチ2: 拡張された`DESC`でマテリアライズされたサブパス（抽出されたもののみ）を表示:

```sql
SET describe_extend_variant_column = true;
DESC variant_tbl;
```
``` sql
DESCRIBE ${table_name} PARTITION ($partition_name);
```
両方を使用してください：アプローチ1は正確で、アプローチ2は効率的です。

## JSONタイプとの比較

- ストレージ：JSONはJSONBとして格納されます（行指向）。VARIANTは推論され、書き込み時に列へ実体化されます（高い圧縮率、小さなサイズ）。
- クエリ：JSONは解析が必要です。VARIANTは列を直接スキャンし、通常はるかに高速です。

ClickBench（43クエリ）：
- ストレージ：VARIANTはJSONと比較して約65%節約。
- クエリ：VARIANTはJSONより8倍以上高速で、事前定義された静的列に近い性能。

**ストレージ容量**

| タイプ                | サイズ      |
| ------------------- | ---------- |
| Predefined columns  | 12.618 GB  |
| VARIANT             | 12.718 GB  |
| JSON                | 35.711 GB  |

**約65%の容量削減**

| 実行            | Predefined | VARIANT | JSON            |
| ----------------| ---------- | ------- | --------------- |
| First (cold)    | 233.79s    | 248.66s | Most timed out  |
| Second (hot)    | 86.02s     | 94.82s  | 789.24s         |
| Third (hot)     | 83.03s     | 92.29s  | 743.69s         |

## FAQ

1. VARIANTの`null`とSQLの`NULL`は異なりますか？
   - いいえ。これらは等価です。
2. クエリ/インデックスが動作しないのはなぜですか？
   - パスを正しい型にCASTしているか、型の競合によってJSONBに昇格されたか、またはサブパスではなくVARIANT全体にインデックスを期待していないか確認してください。
