---
{
    "title": "VARIANT",
    "language": "ja",
    "description": "VARIANT 型は半構造化 JSON データを格納します。整数、文字列、真偽値などのさまざまなプリミティブ型、一次元配列、ネストしたオブジェクトを含めることができます。書き込み時に、Doris は JSON パスに基づいてサブパスの構造と型を推論し、頻出するパスをサブカラム化して独立した列指向のサブカラムとして公開することで、柔軟性と性能を両立します。"
}
---

## VARIANT

## 概要

VARIANT 型は半構造化 JSON データを格納します。整数、文字列、真偽値などのさまざまなプリミティブ型、一次元配列、ネストしたオブジェクトを含めることができます。書き込み時に、Doris は JSON パスに基づいてサブパスの構造と型を推論し、頻出するパスをサブカラム化して独立した列指向のサブカラムとして公開することで、柔軟性と性能を両立します。

:::tip VARIANT を選ぶ理由
ドキュメントの構造が時間とともに変わっても、クエリが少数の頻繁に使うパスに集中する場合、`VARIANT` が適しています。

- 頻繁に使うパスはサブカラム化の対象となり、列指向の性能、ファイルのプルーニング、ベクトル化実行の恩恵を受けられます。
- 主要なパスにはパス単位のインデックスや全文検索を使用でき、Doris のスパースインデックスによるプルーニングも利用できます。
- ワイドカラム向けの最適化により、10k 規模のサブカラムでも自動サブカラム化を実用的に使用できます。ただし、サブカラム化の対象となるパスが 10,000 に近づくとハードウェア要件が急激に高くなるため、通常は DOC モードから始める方が安全です。

デフォルトの動作、スパースカラム、DOC モード、Schema Template のどれを選ぶか迷う場合は、[VARIANT ワークロードガイド](./variant-workload-guide) を参照してください。このページでは、構文、型の規則、インデックス、制限、設定を説明します。
:::

## VARIANT の使用

### テーブル作成構文

テーブル作成時に VARIANT カラムを宣言します。

```sql
CREATE TABLE IF NOT EXISTS ${table_name} (
    k BIGINT,
    v VARIANT
)
PROPERTIES("replication_num" = "1");
```

最上位の VARIANT カラム名には、バッククォートで囲んでもドット（`.`）を含められません。たとえば、`` `v.x` VARIANT `` は無効です。この制限は `CREATE TABLE` と `ALTER TABLE` に適用されますが、VARIANT 値内の JSON フィールド名は制限しません。

`ADD COLUMN`（一括追加を含む）、`MODIFY COLUMN`、`RENAME COLUMN` でも、ドットを含まない最上位の VARIANT カラム名を使用する必要があります。たとえば、次の文は拒否されます。

```sql
ALTER TABLE ${table_name} ADD COLUMN `v.x` VARIANT;
-- ERROR: Cannot use `VARIANT` type column named with a `.` character: v.x
```

Schema Template を使って特定のパスに制約を設けます（「拡張型」を参照）。

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

VARIANT はサブカラムの型を自動的に推論します。サポートされる型は次のとおりです。

<table>
<tr><td>サポートされる型<br/></td></tr>
<tr><td>TinyInt<br/></td></tr>
<tr><td>NULL（JSON null と同等）<br/></td></tr>
<tr><td>BigInt（64 ビット）<br/>Double<br/></td></tr>
<tr><td>String (Text)<br/></td></tr>
<tr><td>Jsonb<br/></td></tr>
<tr><td>Variant（ネストしたオブジェクト）<br/></td></tr>
<tr><td>Array&lt;T&gt;（一次元のみ）<br/></td></tr>
</table>

単純な INSERT の例：

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

ヒント：日付や時刻など、標準 JSON にない型は、Schema Template を指定しない限り文字列として格納されます。計算効率を高めるには、静的カラムに抽出するか、Schema Template で型を宣言することを検討してください。

## 拡張型（Schema Template）

VARIANT は、プリミティブ型に加えて、Schema Template を通じて次の拡張型をサポートします。

- 数値（拡張型）
  - Decimal：Decimal32 / Decimal64 / Decimal128 / Decimal256
  - LargeInt
- Datetime
- Timestamptz
- Date
- IPV4 / IPV6
- Boolean
- ARRAY&lt;T&gt;（T は上記のいずれかの型、一次元のみ）

注：事前定義スキーマはテーブル作成時にのみ指定できます。現時点で ALTER はサポートされていません（将来のバージョンでサブカラム定義の追加がサポートされる可能性はありますが、既存のサブカラムの型変更はサポートされません）。

例：

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

`{"date": 2020-01-01}` と `{"ip": 127.0.0.1}` は無効な JSON テキストです。正しい形式は `{"date": "2020-01-01"}` と `{"ip": "127.0.0.1"}` です。

Schema Template を指定した場合、JSON 値が宣言した型と一致せず、変換もできないと、その値は NULL として格納されます。例：

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

Schema Template は永続化時の格納型を指定するだけです。クエリ実行時に有効な型は、実行時の実データによって決まります。

```sql
-- At runtime v['a'] may still be STRING
SELECT variant_type(CAST('{"a" : "12345"}' AS VARIANT<'a' : INT>)['a']);
```

ワイルドカードのマッチングと優先順序：

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

カラム名に `*` が含まれ、プレフィックスのワイルドカードではなく文字どおりの名前としてマッチさせたい場合は、次のようにします。

```sql
v1 VARIANT<
    MATCH_NAME 'enumString*' : STRING
> NULL
```

一致したサブパスはデフォルトでサブカラム化の対象となり、カラムとして公開されます。多数のパスが一致してカラムが過剰に生成される場合は、`variant_enable_typed_paths_to_sparse` の有効化を検討してください（「設定」を参照）。

## 型の競合と昇格の規則

同じパスに互換性のない型が現れた場合（たとえば、同じフィールドに整数と文字列の両方が現れた場合）、情報の欠落を避けるため、型は JSONB に昇格します。

```sql
{"a" : 12345678}
{"a" : "HelloWorld"}
-- a will be promoted to JSONB
```

型昇格の規則：

| 元の型         | 現在の型        | 最終的な型   |
| -------------- | --------------- | ------------ |
| `TinyInt`      | `BigInt`        | `BigInt`     |
| `TinyInt`      | `Double`        | `Double`     |
| `TinyInt`      | `String`        | `JSONB`      |
| `TinyInt`      | `Array`         | `JSONB`      |
| `BigInt`       | `Double`        | `JSONB`      |
| `BigInt`       | `String`        | `JSONB`      |
| `BigInt`       | `Array`         | `JSONB`      |
| `Double`       | `String`        | `JSONB`      |
| `Double`       | `Array`         | `JSONB`      |
| `Array<Double>`| `Array<String>` | `Array<Jsonb>` |

インデックスと格納型を安定させるために厳密な型が必要な場合は、Schema Template で宣言してください。

## VARIANT のインデックス

### インデックスの選択

VARIANT はサブパスに対する BloomFilter と転置インデックスをサポートします。
- カーディナリティが高い等価条件や IN 条件には、BloomFilter を優先します（インデックスがより疎で、書き込み性能が高くなります）。
- トークン化、フレーズ検索、範囲検索には転置インデックスを使用し、適切な `parser` / `analyzer` プロパティを設定します。

```sql
...  
PROPERTIES("replication_num" = "1", "bloom_filter_columns" = "v");

-- Use BloomFilter for equality/IN filters
SELECT * FROM tbl WHERE v['id'] = 12345678;
SELECT * FROM tbl WHERE v['id'] IN (1, 2, 3);
```

VARIANT カラムに転置インデックスを作成すると、すべてのサブパスに同じインデックスプロパティ（たとえば parser）が継承されます。

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

### サブパス単位のインデックス

3.1.x / 4.0 以降では、特定の VARIANT サブパスにインデックスプロパティを指定でき、同じパスにトークン化する転置インデックスとトークン化しない転置インデックスの両方を設定することもできます。パス固有のインデックスを使うには、Schema Template でそのパスの型を宣言する必要があります。

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

ワイルドカードを使ったパスのインデックス：

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

注：2.1.7 以降でサポートされるのは InvertedIndex V2 のプロパティのみです（ファイル数と書き込み IOPS が少なく、ストレージとコンピュートを分離した構成に適しています）。2.1.8 以降では、オフラインの Build Index は削除されています。

### インデックスが機能しない場合

1. 型の変更によりインデックスが失われる：サブパスが互換性のない型に変わると（例：INT → JSONB）、インデックスが失われます。Schema Template で型とインデックスを固定してください。
2. クエリの型が一致しない：
   ```sql
   -- v['id'] is actually STRING; using INT equality causes index not to be used
   SELECT * FROM tbl WHERE v['id'] = 123456;
   ```
3. インデックスの設定が適切でない：インデックスはサブパスに適用され、VARIANT カラム全体には適用されません。
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

## INSERT とロード

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

### ロード（Stream Load）

```bash
# Line-delimited JSON (one JSON record per line)
curl --location-trusted -u root: -T gh_2022-11-07-3.json \
  -H "read_json_by_line:true" -H "format:json" \
  http://127.0.0.1:8030/api/test_variant/github_events/_stream_load
```

関連情報：`https://doris.apache.org/docs/dev/data-operate/import/complex-types/variant`

ロード後は、`SELECT count(*)` で確認するか、`SELECT * ... LIMIT 1` でサンプルを確認してください。高スループットで取り込む場合は、RANDOM バケットを優先し、Group Commit を有効にしてください。

## 出力

VARIANT カラムの読み取り時に返される JSON テキストは、書き込んだ JSON テキストとバイト単位では一致しません。JSON オブジェクト内のキーは、入力 JSON に現れた順序に関係なく、辞書順で出力されます。

```sql
INSERT INTO variant_tbl VALUES
  (2, '{ "b": 2, "a": 1, "c": { "y": 20, "x": 10 } }');

SELECT v FROM variant_tbl WHERE k = 2;
+-----------------------------------+
| v                                 |
+-----------------------------------+
| {"a":1,"b":2,"c":{"x":10,"y":20}} |
+-----------------------------------+
```

ソートはすべての階層に適用されます。最上位のキーは `a`、`b`、`c` の順になり、ネストしたオブジェクト内のキーは `x`、`y` の順になります。

## サポートされる操作と CAST の規則

- VARIANT を他の型と直接比較したり、他の型との演算に使用したりすることはできません。二つの VARIANT 同士の比較もサポートされません。
- 比較、フィルタリング、集約、並べ替えを行うには、サブパスを具体的な型に CAST します（明示的または暗黙的に）。

```sql
-- Explicit CAST
SELECT CAST(v['arr'] AS ARRAY<TEXT>) FROM tbl;
SELECT * FROM tbl WHERE CAST(v['decimal'] AS DECIMAL(27, 9)) = 1.111111111;
SELECT * FROM tbl WHERE CAST(v['date'] AS DATE) = '2021-01-02';

-- Implicit CAST
SELECT * FROM tbl WHERE v['bool'];
SELECT * FROM tbl WHERE v['str'] MATCH 'Doris';
```

- VARIANT 自体を ORDER BY、GROUP BY、JOIN KEY、集約関数の引数として直接使用することはできません。代わりにサブパスを CAST してください。
- 文字列は暗黙的に VARIANT に変換できます。

| VARIANT         | CAST 可能 | 暗黙的に変換可能 |
| --------------- | --------- | ---------------- |
| `ARRAY`         | ✔         | ❌               |
| `BOOLEAN`       | ✔         | ✔                |
| `DATE/DATETIME` | ✔         | ✔                |
| `FLOAT`         | ✔         | ✔                |
| `IPV4/IPV6`     | ✔         | ✔                |
| `DECIMAL`       | ✔         | ✔                |
| `MAP`           | ❌        | ❌               |
| `TIMESTAMP`     | ✔         | ✔                |
| `VARCHAR`       | ✔         | ✔                |
| `JSON`          | ✔         | ✔                |

## ワイドカラム

取り込むデータに異なる JSON キーが多数含まれると、サブカラム化で生成されるサブカラム数が急増します。規模が大きくなると、メタデータの肥大化、書き込みやマージのコスト増加、クエリの速度低下につながる可能性があります。このような「ワイドカラム」（サブカラムが多すぎる状態）に対処するため、VARIANT には **スパースカラム** と **DOC エンコーディング** の二つの仕組みがあります。

ワークロードに応じた選択方法は、[VARIANT ワークロードガイド](./variant-workload-guide) を参照してください。この節では、それぞれの仕組みと関連プロパティのみを説明します。

注：この二つの仕組みは同時に使用できません。DOC エンコーディングを有効にするとスパースカラムは無効になり、その逆も同様です。

### スパースカラム

**仕組み**

- システムは、非 NULL 値の割合や疎性に基づいてパスを順位付けします。出現頻度が高い（疎性が低い）パスはサブカラム化され、独立したサブカラムとして格納されます。出現頻度が低い残りのパスは、まとめてスパースカラムに格納されます。抽出されるサブカラムの最大数は `variant_max_subcolumns_count` で制御します。
- Schema Template で宣言したパスは、デフォルトではスパースカラムに移動しません。型を宣言したパスもスパースカラムに移動できるようにするには、`variant_enable_typed_paths_to_sparse` を設定します。
- スパースカラムはシャーディングをサポートします。スパースなサブパスを複数のスパースカラムに分散させることで、カラムごとの読み取り負荷を減らし、読み取り効率を向上させます。物理的に格納するスパースカラム数は `variant_sparse_hash_shard_count` で指定します。

**参考事項**

- ほとんどのキーで非 NULL 値の割合が似ている（疎性の差が小さい）場合、真にスパースなパスを特定しにくく、スパースカラムの効果は小さくなります。
- `variant_max_subcolumns_count` のデフォルト値は `2048` で、ほとんどのワークロードには十分です。抽出されるサブカラムを増やすためだけに、この値を大幅に引き上げることは避けてください。ワークロードで大規模なサブカラム化が本当に必要な場合は、<a href="./variant-workload-guide#doc-mode-template">DOC モード</a>を優先してください。実用上の上限は、引き続き `10000` 以下に抑えることを推奨します。
- `variant_sparse_hash_shard_count` は、おおよそ「スパースなパス数 / 128」で見積もれます。たとえば、JSON キーの合計が約 10,000、`variant_max_subcolumns_count = 2000` の場合、スパースなパスは約 8000 となるため、`variant_sparse_hash_shard_count` は `8000/128` 程度から試せます。

### DOC エンコーディング（DOC モード）

**仕組み**

- パス単位のクエリに備えて引き続きサブカラム化を行える一方、JSON ドキュメント全体を効率よく返すために、元の JSON をストアドフィールドとして追加で格納します。
- DOC エンコーディングはシャーディングをサポートします。元の JSON を複数のカラムに分割して格納し、JSON 全体をクエリするときに再構成します。DOC シャード数は `variant_doc_hash_shard_count` で指定します。
- 少量ずつ書き込む場合は、サブカラム化を省略して後続のマージまで延期できます。これは `variant_doc_materialization_min_rows` で制御します。たとえば、`variant_doc_materialization_min_rows = 10000` の場合、10,000 行未満の書き込みでは元の JSON のみを格納し、そのバッチのサブカラム化は実行しません。
- 非常に幅広いワークロードでサブカラム化の規模が約一万サブカラムに近づく場合も、DOC モードの方が安定した選択肢です。デフォルトの即時サブカラム化と比べて、コンパクション時のメモリ使用量を約三分の二削減でき、スパースなワイドカラムの取り込みスループットを約 5-10x に改善できます。
- `VARIANT` カラムが非常に幅広く、クエリでドキュメント全体を頻繁に読む場合、DOC モードでは多数のサブカラムからドキュメントを再構成する場合と比べて、`SELECT variant_col` の性能が桁違いに向上する可能性があります。

**参考事項**

- DOC モードには `variant_enable_doc_mode = true` が必要です。
- DOC モードで Schema Template を使って宣言できる型付きパスは、数値型、文字列型、配列型に限られます。
- `variant_doc_hash_shard_count` は、おおよそ「JSON キーの合計数 / 128」で見積もれます。

プロパティの一覧は、以下の「設定」を参照してください。

## 制限事項

- **ワイドテーブルの最適化**：`VARIANT` 型によって多数の動的サブカラム（たとえば 2000 カラム超）が生成されるワイドテーブルでは、`"storage_format" = "V3"` をテーブルの `PROPERTIES` に指定して **Storage Format V3** を有効にすることを強く推奨します。これにより、カラムのメタデータが Segment Footer から分離され、ファイルのオープンが高速化し、メモリのオーバーヘッドが削減されます。
- JSON キーの長さは 255 以下です。
- JSON 文字列を明示的に VARIANT に変換するには、[`PARSE_TO_VARIANT`](../../../sql-functions/scalar-functions/variant-functions/parse-to-variant.md) と [`TRY_PARSE_TO_VARIANT`](../../../sql-functions/scalar-functions/variant-functions/try-parse-to-variant.md)（4.1.4 以降でサポート）を使用します。前者は解析に失敗するとエラーを返し、後者は NULL を返します。
- プライマリキーまたはソートキーには使用できません。
- 他の型の内部にネストできません（例：`Array<Variant>`、`Struct<Variant>`）。
- DOC モード以外で VARIANT カラム全体を読み取ると、すべてのサブパスがスキャンされます。非常に幅広いカラムでは、DOC モードが有効でない限り、通常は `SELECT variant_col` を直接実行しないことを推奨します。サブパスが多数あるカラムでは、`LIKE` のようなオブジェクト全体の検索に備え、元の JSON 文字列を別の STRING / JSONB カラムに格納することを検討してください。

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

## 設定

3.1 以降、VARIANT はカラムの型レベルのプロパティをサポートします。

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
<tr><td>`variant_max_subcolumns_count`</td><td>サブカラム化できるパスの最大数。しきい値を超えると、新しいパスは共有データ構造に格納される場合があります。デフォルトは 2048（推奨値）で、ほとんどのワークロードには十分です。大きすぎる値は避けてください。ワークロードで抽出されるサブカラムを非常に多く必要とする場合は、<a href="./variant-workload-guide#doc-mode-template">DOC モード</a>を優先してください。0 は無制限を意味しますが、10000 を超えないようにしてください。</td></tr>
<tr><td>`variant_enable_typed_paths_to_sparse`</td><td>デフォルトでは、型を宣言したパスは常にサブカラム化され、`variant_max_subcolumns_count` の上限にも算入されません。`true` に設定すると、型を宣言したパスもこのしきい値に算入され、共有データ構造に移動する場合があります。</td></tr>
<tr><td>`variant_sparse_hash_shard_count`</td><td>スパースカラムのシャード数。スパースなサブパスを複数のスパースカラムに分散し、読み取り性能を向上させます。デフォルトは 1 です。スパースなサブパス数に応じて調整してください。</td></tr>
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
<tr><td>`variant_enable_doc_mode`</td><td>DOC エンコーディングモードを有効にします。`true` の場合、JSON ドキュメント全体をすばやく返せるよう、元の JSON がストアドフィールドとして格納されます。DOC モードとスパースカラムは同時に使用できません。デフォルトは `false` です。</td></tr>
<tr><td>`variant_doc_materialization_min_rows`</td><td>DOC モードでサブカラム化を開始するために必要な最小行数。行数がこの値に満たない場合は、元の JSON のみが格納されます。コンパクションによってファイルがマージされ、このしきい値に達するとサブカラム化が行われます。少量ずつ書き込む場合のオーバーヘッドを減らせます。</td></tr>
<tr><td>`variant_doc_hash_shard_count`</td><td>DOC エンコーディングのシャード数。元の JSON は指定した数のカラムに分割して格納され、JSON 全体をクエリする際に再構成されます。デフォルトは 64 です。JSON のサイズと並行実行数に応じて調整してください。</td></tr>
</table>

上限に達したときの動作と調整の提案：

1. しきい値を超えると、新しいパスは共有データ構造に書き込まれます。Rowset のマージによって、一部のパスが共有データ構造に移される場合もあります。
2. システムは、非 NULL 値の割合が高く、アクセス頻度も高いパスをサブカラム化の対象として優先します。
3. サブカラム化されたパスが 10,000 に近づくと、高性能なハードウェアが必要です（ノードあたり ≥128G RAM、≥32C を推奨）。ワークロードがすでにこの規模に近い場合は、先に DOC モードを評価してください。
4. 取り込みの調整：クライアントの `batch_size` を適切に増やすか、Group Commit を使用します（必要に応じて `group_commit_interval_ms` / `group_commit_data_bytes` を増やします）。
5. パーティションのプルーニングが不要な場合は、コンパクションによる書き込み増幅を減らすため、RANDOM バケットと単一タブレットへのロードの有効化を検討してください。
6. BE の調整項目：`max_cumu_compaction_threads`（8 以上）、`vertical_compaction_num_columns_per_group=500`（垂直コンパクションを改善しますが、メモリ使用量が増えます）、`segment_cache_memory_percentage=20`（メタデータキャッシュの効率を改善します）。
7. Compaction Score を監視してください。上昇し続ける場合はコンパクションが追いついていないため、取り込み負荷を下げてください。
8. VARIANT に対する大規模な `SELECT *` は避け、`SELECT v['path']` のように必要なパスだけを選択してください。

注：Stream Load で `[DATA_QUALITY_ERROR]Reached max column size limit 2048` というエラーが発生した場合（2.1.x と 3.0.x のみ）、マージ後のタブレットスキーマがカラム数の上限に達したことを意味します。`variant_max_merged_tablet_schema_size` を増やすことができますが、4096 を超える設定は推奨されず、高性能なハードウェアが必要です。

## カラム数と型の確認

方法 1：`variant_type` を使って行ごとのスキーマを確認します（より正確ですが、コストも高くなります）。

```sql
SELECT variant_type(v) FROM variant_tbl;
```

方法 2：拡張 `DESC` で、サブカラム化によって抽出されたサブパスを表示します。

```sql
SET describe_extend_variant_column = true;
DESC variant_tbl;
```

``` sql
DESCRIBE ${table_name} PARTITION ($partition_name);
```

両方を使い分けてください。方法 1 は正確で、方法 2 は効率的です。

## JSON 型との比較

- 格納方法：JSON は JSONB（行指向）として格納されます。VARIANT は書き込み時にサブカラム化します（圧縮率が高く、サイズが小さくなります）。
- クエリ：JSON は解析が必要です。VARIANT はカラムを直接スキャンするため、通常は大幅に高速です。

ClickBench（43 クエリ）：
- 格納方法：VARIANT は JSON より約 65% 省スペースです。
- クエリ：VARIANT は JSON より 8x+ 高速で、事前定義された静的カラムに近い性能です。

**ストレージ容量**

| 型                     | サイズ   |
| ---------------------- | -------- |
| 事前定義されたカラム   | 12.618 GB |
| VARIANT                | 12.718 GB |
| JSON                   | 35.711 GB |

**約 65% の容量削減**

| 実行回                 | 事前定義 | VARIANT | JSON             |
| ---------------------- | -------- | ------- | ---------------- |
| 初回（コールド）      | 233.79s  | 248.66s | ほとんどタイムアウト |
| 二回目（ウォーム）     | 86.02s   | 94.82s  | 789.24s          |
| 三回目（ウォーム）     | 83.03s   | 92.29s  | 743.69s          |

## FAQ

1. VARIANT 内の `null` と SQL の `NULL` は異なりますか？
   - いいえ。同等です。
2. クエリやインデックスが機能しないのはなぜですか？
   - パスを正しい型に CAST しているか、型の競合によって JSONB に昇格していないか、VARIANT 全体にインデックスが適用されると誤解していないかを確認してください。インデックスはサブパスに適用されます。
3. VARIANT カラムに書き込むと DECIMAL の精度が失われるのはなぜですか？
   - VARIANT カラムへの書き込み時に、サブカラムの型は DECIMAL として推論されません。数値は DOUBLE として格納されるため、小数部の末尾が失われる場合があります。Schema Template でサブパスを DECIMAL と宣言しても（例：`pm25 VARIANT<'xxx': DECIMAL(6, 2)>`）、精度が完全に保証されるわけではありません。書き込み経路で、値がまず DOUBLE として解析され、その後 DECIMAL に変換されるためです。JSON 値を文字列として書き込み（例：`'{"num": "12.345"}'`）、対応する Schema Template の DECIMAL 宣言（例：`DECIMAL(9, 3)`）を併用すると、書き込み時に文字列が直接 DECIMAL として解析され、精度が維持されます。
