---
{
    "title": "VARIANT",
    "language": "ja",
    "description": "VARIANT 型は半構造化 JSON データを格納します。整数、文字列、ブール値などの異なるプリミティブ型、1 次元配列、ネストされたオブジェクトを含めることができます。書き込み時、Doris は JSON パスに基づいてサブパスの構造と型を推論し、頻繁に使用されるパスに対して Subcolumnization を実行します。これらのパスは独立した列指向サブカラムとして公開され、柔軟性とパフォーマンスを両立できます。"
}
---

## VARIANT {#variant}

## 概要 {#overview}

VARIANT 型は半構造化 JSON データを格納します。整数、文字列、ブール値などの異なるプリミティブ型、1 次元配列、ネストされたオブジェクトを含めることができます。書き込み時、Doris は JSON パスに基づいてサブパスの構造と型を推論し、頻繁に使用されるパスに対して Subcolumnization を実行します。これらのパスは独立した列指向サブカラムとして公開され、柔軟性とパフォーマンスを両立できます。

:::tip VARIANT を使用する理由
ドキュメントの形状が時間とともに変化しても、クエリが少数のホットパスに集中している場合、`VARIANT` が適しています。

- ホットパスは Subcolumnization に参加するため、列指向のパフォーマンス、ファイルプルーニング、ベクトル化実行のメリットを得られます。
- 主要なパスではパスレベルのインデックスや全文検索を利用でき、Doris のスパースインデックスプルーニングのメリットも引き続き得られます。
- ワイドカラム向けの最適化により、10k 規模のサブカラムでも自動 Subcolumnization を実用的に維持できます。Subcolumnization に参加するパスが 10,000 に近づくと、ハードウェア要件が急速に高くなるため、通常は DOC mode から始める方が安全です。

デフォルト動作、スパースカラム、DOC mode、Schema Template のどれを選ぶか迷う場合は、まず [Variant Workload Guide](./variant-workload-guide) を参照してください。このページでは、構文、型規則、インデックス、制限、設定を詳しく説明します。
:::

## VARIANT の使用 {#using-variant}

### テーブル作成構文 {#create-table-syntax}

テーブル作成時に VARIANT カラムを宣言します。

```sql
CREATE TABLE IF NOT EXISTS ${table_name} (
    k BIGINT,
    v VARIANT
)
PROPERTIES("replication_num" = "1");
```

トップレベルの VARIANT カラム名にはドット（`.`）を含められません。バッククォートで囲んだ場合も同様です。たとえば、`` `v.x` VARIANT `` は無効です。この制限は `CREATE TABLE` と `ALTER TABLE` に適用されますが、VARIANT 値内部の JSON フィールド名には適用されません。

`ADD COLUMN`（バッチ追加を含む）、`MODIFY COLUMN`、`RENAME COLUMN` でも、ドットを含まないトップレベルの VARIANT カラム名を使用する必要があります。たとえば、次のステートメントは拒否されます。

```sql
ALTER TABLE ${table_name} ADD COLUMN `v.x` VARIANT;
-- ERROR: Cannot use `VARIANT` type column named with a `.` character: v.x
```

Schema Template（「拡張型」を参照）を使用して、特定のパスを制約できます。

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

### クエリ構文 {#query-syntax}

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

## プリミティブ型 {#primitive-types}

VARIANT はサブカラムの型を自動的に推論します。サポートされる型は次のとおりです。

<table>
<tr><td>サポートされる型<br/></td></tr>
<tr><td>TinyInt<br/></td></tr>
<tr><td>NULL（JSON null と同等）<br/></td></tr>
<tr><td>BigInt（64 bit）<br/>Double<br/></td></tr>
<tr><td>String（Text）<br/></td></tr>
<tr><td>Jsonb<br/></td></tr>
<tr><td>Variant（ネストされたオブジェクト）<br/></td></tr>
<tr><td>Array&lt;T&gt;（1 次元のみ）<br/></td></tr>
</table>

単純な INSERT の例です。

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

ヒント: 日付や時刻などの非標準 JSON 型は、Schema Template を指定しない限り文字列として格納されます。計算効率を高めるには、静的カラムに抽出するか、Schema Template で型を宣言することを検討してください。

## 拡張型（Schema Template） {#extended-types-schema-template}

プリミティブ型に加えて、VARIANT は Schema Template を介して次の拡張型をサポートします。

- Number（拡張）
  - Decimal: Decimal32 / Decimal64 / Decimal128 / Decimal256
  - LargeInt
- Datetime
- Timestamptz
- Date
- IPV4 / IPV6
- Boolean
- ARRAY&lt;T&gt;（T は上記のいずれかの型。1 次元のみ）

注: 事前定義 Schema はテーブル作成時にのみ指定できます。現在 ALTER はサポートされていません（将来のバージョンで新しいサブカラム定義の追加がサポートされる可能性はありますが、既存のサブカラム型の変更はサポートされません）。

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

`{"date": 2020-01-01}` と `{"ip": 127.0.0.1}` は無効な JSON テキストです。正しい形式は `{"date": "2020-01-01"}` と `{"ip": "127.0.0.1"}` です。

Schema Template を指定した後、JSON 値が宣言された型と競合し、変換できない場合は NULL として格納されます。例:

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

Schema は永続化されるストレージ型だけを指定します。クエリ実行時の実効型は、実行時の実データによって決まります。

```sql
-- At runtime v['a'] may still be STRING
SELECT variant_type(CAST('{"a" : "12345"}' AS VARIANT<'a' : INT>)['a']);
```

ワイルドカードのマッチングと順序:

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

カラム名に `*` が含まれ、それをプレフィックスワイルドカードではなくリテラル名としてマッチさせる場合は、次を使用します。

```sql
v1 VARIANT<
    MATCH_NAME 'enumString*' : STRING
> NULL
```

マッチしたサブパスはデフォルトで Subcolumnization に参加し、カラムとして公開されます。マッチするパスが多すぎてカラム数が過剰になる場合は、`variant_enable_typed_paths_to_sparse` を有効にすることを検討してください（「設定」を参照）。

## 型の競合と昇格規則 {#type-conflicts-and-promotion-rules}

同じパスに互換性のない型が現れる場合（たとえば、同じフィールドが整数と文字列の両方として現れる場合）、情報損失を避けるため型は JSONB に昇格されます。

```sql
{"a" : 12345678}
{"a" : "HelloWorld"}
-- a will be promoted to JSONB
```

昇格規則:

| ソース型       | 現在の型      | 最終型       |
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

厳密な型（安定したインデックスとストレージ）が必要な場合は、Schema Template で宣言してください。

## VARIANT インデックス {#variant-indexes}

### インデックスの選択 {#choosing-indexes}

VARIANT はサブパスに対する BloomFilter と Inverted Index をサポートします。
- カーディナリティの高い等価/IN フィルター: BloomFilter を優先します（インデックスがよりスパースで、書き込みパフォーマンスが向上します）。
- トークン化、フレーズ、範囲検索: Inverted Index を使用し、適切な `parser`/`analyzer` プロパティを設定します。

```sql
...
PROPERTIES("replication_num" = "1", "bloom_filter_columns" = "v");

-- Use BloomFilter for equality/IN filters
SELECT * FROM tbl WHERE v['id'] = 12345678;
SELECT * FROM tbl WHERE v['id'] IN (1, 2, 3);
```

VARIANT カラムに Inverted Index を作成すると、すべてのサブパスが同じインデックスプロパティ（たとえば parser）を継承します。

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

### サブパスごとのインデックス {#index-by-subpath}

3.1.x/4.0 以降では、特定の VARIANT サブパスにインデックスプロパティを指定できます。同じパスにトークン化された Inverted Index とトークン化されていない Inverted Index の両方を設定することもできます。パス固有のインデックスには、Schema Template によるパス型の宣言が必要です。

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

ワイルドカードパスのインデックス:

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

注: 2.1.7+ は InvertedIndex V2 プロパティのみをサポートします（ファイル数が少なく、書き込み IOPS が低いため、ストレージとコンピュートの分離に適しています）。2.1.8+ ではオフラインの Build Index が削除されています。

Doris 4.1.5 以降、下記のインデックスプロパティまたは BE 設定で norms を無効にできます。

VARIANT パスのトークン化インデックスはデフォルトで BM25 norms を書き込みます。パスに値がない行も含め、パスごとに行あたり 1 バイトを消費します。フィルタリング専用のパスでは `"norms" = "false"` で norms を無効にできます。`field_pattern` がない場合、このプロパティはインデックス対象のすべてのサブパスに適用されます。

```sql
CREATE TABLE IF NOT EXISTS tbl (
    k BIGINT,
    v VARIANT<'body_*' : STRING>,
    INDEX idx_body(v) USING INVERTED PROPERTIES("parser" = "english", "field_pattern" = "body_*", "norms" = "false")
);
```

norms を無効にしても `MATCH` フィルタリングには影響しませんが、`score()` が norms のないセグメントを読み取るとエラーを返します。BE 設定 `inverted_index_skip_norms_for_variant` はすべての VARIANT パスで norms を無効にします。詳細は [Record Length and the norms Property](../../../../table-design/index/inverted-index/scoring.md#record-length-and-the-norms-property) を参照してください。

### インデックスが機能しない場合 {#when-indexes-dont-work}

1. 型の変更によるインデックスの消失: サブパスが互換性のない型に変更されると（たとえば INT → JSONB）、インデックスは失われます。Schema Template で型とインデックスを固定してください。
2. クエリ型の不一致:
   ```sql
   -- v['id'] is actually STRING; using INT equality causes index not to be used
   SELECT * FROM tbl WHERE v['id'] = 123456;
   ```
3. インデックス設定の誤り: インデックスはサブパスに適用され、VARIANT カラム全体には適用されません。
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

## INSERT とデータロード {#insert-and-load}

### INSERT INTO VALUES {#insert-into-values}

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

### データロード（Stream Load） {#load-stream-load}

```bash
# Line-delimited JSON (one JSON record per line)
curl --location-trusted -u root: -T gh_2022-11-07-3.json \
  -H "read_json_by_line:true" -H "format:json" \
  http://127.0.0.1:8030/api/test_variant/github_events/_stream_load
```

関連項目: `https://doris.apache.org/docs/dev/data-operate/import/complex-types/variant`

ロード後、`SELECT count(*)` で検証するか、`SELECT * ... LIMIT 1` でサンプルを取得します。高スループットの取り込みでは、RANDOM バケットと Group Commit の有効化を推奨します。

## 出力 {#output}

VARIANT カラムの読み取り時に返される JSON テキストは、書き込まれた JSON テキストとバイト単位で同一ではありません。JSON オブジェクト内のキーは、入力 JSON に現れた順序に関係なく、ソート（辞書順）されて出力されます。

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

ソートはすべてのレベルで適用されます。トップレベルのキーは `a`、`b`、`c` になり、ネストされたオブジェクトのキーは `x`、`y` になります。

## サポートされる操作と CAST 規則 {#supported-operations-and-cast-rules}

- VARIANT は他の型と直接比較または操作できません。2 つの VARIANT 同士の比較もサポートされません。
- 比較、フィルタリング、集計、並べ替えを行う場合は、サブパスを明示的または暗黙的に具体的な型へ CAST してください。

```sql
-- Explicit CAST
SELECT CAST(v['arr'] AS ARRAY<TEXT>) FROM tbl;
SELECT * FROM tbl WHERE CAST(v['decimal'] AS DECIMAL(27, 9)) = 1.111111111;
SELECT * FROM tbl WHERE CAST(v['date'] AS DATE) = '2021-01-02';

-- Implicit CAST
SELECT * FROM tbl WHERE v['bool'];
SELECT * FROM tbl WHERE v['str'] MATCH 'Doris';
```

- VARIANT 自体を ORDER BY、GROUP BY、JOIN KEY、または集計引数で直接使用することはできません。代わりにサブパスを CAST してください。
- 文字列は VARIANT に暗黙的に変換できます。

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

## ワイドカラム {#wide-columns}

取り込まれたデータに多数の異なる JSON キーが含まれると、Subcolumnization によって生成されるサブカラム数が急速に増加します。大規模環境では、メタデータの肥大化、書き込み・マージコストの増加、クエリの低速化につながる可能性があります。「ワイドカラム」（サブカラムが多すぎる）に対応するため、VARIANT には **スパースカラム** と **DOC エンコーディング** という 2 つの仕組みがあります。

ワークロードの選択については、[Variant Workload Guide](./variant-workload-guide) を参照してください。このセクションでは仕組みと関連プロパティだけを説明します。

注: これら 2 つの仕組みは相互排他的です。DOC エンコーディングを有効にするとスパースカラムが無効になり、その逆も同様です。

### スパースカラム {#sparse-columns}

**仕組み**

- システムは非 NULL 比率 / スパース性でパスを順位付けします。高頻度（スパース性が低い）パスは Subcolumnization を通過して独立したサブカラムとして格納され、残りの低頻度（スパース）パスは結合されてスパースカラムに格納されます。抽出されるサブカラムの最大数は `variant_max_subcolumns_count` で制御されます。
- Schema Template でパスを宣言した場合、デフォルトではスパースカラムへ移動されません。型付きパスをスパースカラムへ移動できるようにするには、`variant_enable_typed_paths_to_sparse` を設定します。
- スパースカラムはシャーディングをサポートします。スパースサブパスを複数のスパースカラムに分散し、カラムごとの読み取りオーバーヘッドを減らして読み取り効率を高めます。物理的に格納するスパースカラム数は `variant_sparse_hash_shard_count` で指定します。

**参考情報**

- ほとんどのキーの非 NULL 比率が似ている場合（スパース性の差が小さい場合）、真にスパースなパスを識別するのが難しくなり、スパースカラムの効果が低下します。
- `variant_max_subcolumns_count` のデフォルトは `2048` で、多くのワークロードには十分です。抽出されるサブカラムを事前に多く確保するためだけに、値を積極的に引き上げないでください。大規模な Subcolumnization が本当に必要な場合は、<a href="./variant-workload-guide#doc-mode-template">DOC mode</a> を優先してください。実運用上の上限は ≤ `10000` に保つことを推奨します。
- `variant_sparse_hash_shard_count` は「スパースパス数 / 128」で概算できます。例: JSON キーの総数が約 10,000、`variant_max_subcolumns_count = 2000` の場合、スパースパスは約 8000 なので、`variant_sparse_hash_shard_count` は `8000/128` 前後から始められます。

### DOC エンコーディング（DOC mode） {#doc-encoding-doc-mode}

**仕組み**

- パスはパスベースのクエリのために Subcolumnization を通過できます。同時に、完全な JSON ドキュメントを効率的に返すため、元の JSON も保存フィールドとして追加で格納されます。
- DOC エンコーディングはシャーディングをサポートします。元の JSON は複数のカラムに分割して格納され、完全な JSON をクエリするときに再構成されます。DOC シャード数は `variant_doc_hash_shard_count` で指定します。
- 小さなバッチの書き込みでは、Subcolumnization をスキップして後続のマージまで延期できます。これは `variant_doc_materialization_min_rows` で制御されます。たとえば `variant_doc_materialization_min_rows = 10000` の場合、10,000 行未満の書き込みでは元の JSON のみが格納され、そのバッチで Subcolumnization は実行されません。
- 超ワイドなワークロードでは、Subcolumnization の規模が 10,000 サブカラムに近づく場合にも DOC mode がより安定した選択肢です。デフォルトの即時 Subcolumnization と比較して、コンパクションのメモリ使用量を約 2/3 削減でき、スパースなワイドカラムの取り込みスループットを約 5-10 倍向上できます。
- `VARIANT` カラムが非常に広く、クエリでドキュメント全体を頻繁に読み取る場合、DOC mode では、多数のサブカラムからドキュメントを再構成する場合と比べて `SELECT variant_col` のパフォーマンスを桁違いに向上できます。

**参考情報**

- DOC mode には `variant_enable_doc_mode = true` が必要です。
- DOC mode では、Schema Template で宣言された型付きパスは数値型、文字列型、配列型に制限されます。
- `variant_doc_hash_shard_count` は「JSON キーの総数 / 128」で概算できます。

プロパティの全リストについては、以下の「設定」セクションを参照してください。

## 制限 {#limitations}

- **ワイドテーブルの最適化**: `VARIANT` 型によって多数の動的サブカラム（たとえば 2000 カラム超）が生成されるワイドテーブルでは、テーブルの `PROPERTIES` に `"storage_format" = "V3"` を指定して **Storage Format V3** を有効にすることを強く推奨します。これによりカラムメタデータが Segment Footer から分離され、ファイルのオープンが高速化され、メモリオーバーヘッドが削減されます。
- JSON キーの長さ ≤ 255。
- [`PARSE_TO_VARIANT`](../../../sql-functions/scalar-functions/variant-functions/parse-to-variant.md) と [`TRY_PARSE_TO_VARIANT`](../../../sql-functions/scalar-functions/variant-functions/try-parse-to-variant.md)（4.1.4 以降でサポート）を使用して、JSON 文字列を VARIANT に明示的に変換できます。前者は解析に失敗するとエラーを報告し、後者は NULL を返します。
- 主キーまたはソートキーにはできません。
- 他の型の内部にネストできません（たとえば `Array<Variant>`、`Struct<Variant>`）。
- DOC mode の外では、VARIANT カラム全体を読み取るとすべてのサブパスがスキャンされます。非常にワイドなカラムでは、DOC mode を有効にしない限り `SELECT variant_col` を直接実行することは一般に推奨されません。カラムに多数のサブパスがある場合は、`LIKE` などのオブジェクト全体の検索用に、元の JSON 文字列を追加の STRING/JSONB カラムへ格納することを検討してください。

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

## 設定 {#configuration}

3.1+ 以降、VARIANT はカラム上で型レベルのプロパティをサポートします。

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
<tr><td>`variant_max_subcolumns_count`</td><td>Subcolumnization を通過できるパスの最大数。しきい値を超えると、新しいパスは共有データ構造に格納される場合があります。デフォルト: 2048（推奨）。これは多くのワークロードに十分です。大きすぎる値は避けてください。非常に大規模な抽出サブカラムが本当に必要な場合は、<a href="./variant-workload-guide#doc-mode-template">DOC mode</a> を優先してください。0 は無制限を意味します。10000 を超えないでください。</td></tr>
<tr><td>`variant_enable_typed_paths_to_sparse`</td><td>デフォルトでは、型付きパスは常に Subcolumnization に参加し（`variant_max_subcolumns_count` には算入されません）、`true` にすると型付きパスもしきい値に算入され、共有構造へ移動される場合があります。</td></tr>
<tr><td>`variant_sparse_hash_shard_count`</td><td>スパースカラムのシャード数。スパースサブパスを複数のスパースカラムに分散して読み取りパフォーマンスを向上させます。デフォルト: 1。スパースサブパス数に基づいて調整してください。</td></tr>
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
<tr><td>`variant_enable_doc_mode`</td><td>DOC エンコーディングモードを有効にします。`true` の場合、元の JSON が保存フィールドとして格納され、JSON ドキュメント全体をすばやく返せます。DOC mode はスパースカラムと相互排他的です。デフォルト: `false`。</td></tr>
<tr><td>`variant_doc_materialization_min_rows`</td><td>DOC mode で Subcolumnization を開始する最小行数のしきい値。この値未満の行数では元の JSON のみが格納され、コンパクションによってファイルがマージされてしきい値に達した後に Subcolumnization が実行されます。小さなバッチの書き込みオーバーヘッドを削減します。</td></tr>
<tr><td>`variant_doc_hash_shard_count`</td><td>DOC エンコーディングのシャード数。元の JSON は指定された数のカラムに分割して格納され、JSON 全体をクエリするときに再構成されます。デフォルト: 64。JSON のサイズと同時実行数に基づいて調整してください。</td></tr>
</table>

上限に達した場合の動作とチューニングの提案:

1. しきい値を超えると、新しいパスは共有構造に書き込まれます。Rowset のマージによって、一部のパスが共有構造へ再配置される場合もあります。
2. システムは、非 NULL 比率とアクセス頻度が高いパスを Subcolumnization に保持することを優先します。
3. Subcolumnization のパス数が 10,000 に近づくと、強力なハードウェアが必要です（ノードあたり ≥128G RAM、≥32C を推奨）。ワークロードがすでにこの範囲に近い場合は、まず DOC mode を評価してください。
4. 取り込みのチューニング: クライアントの `batch_size` を適切に増やすか、Group Commit を使用します（必要に応じて `group_commit_interval_ms`/`group_commit_data_bytes` を増やします）。
5. パーティションプルーニングが不要な場合は、RANDOM バケットを検討し、単一タブレットロードを有効にしてコンパクションの書き込み増幅を減らします。
6. BE のチューニング項目: `max_cumu_compaction_threads`（≥8）、`vertical_compaction_num_columns_per_group=500`（垂直コンパクションを改善しますが、メモリを増加させます）、`segment_cache_memory_percentage=20`（メタデータキャッシュ効率を改善します）。
7. Compaction Score を監視します。上昇し続ける場合、コンパクションが遅れているため、取り込み負荷を下げてください。
8. VARIANT に対する大きな `SELECT *` は避け、`SELECT v['path']` のような特定の射影を優先してください。

注: Stream Load エラー `[DATA_QUALITY_ERROR]Reached max column size limit 2048` が表示された場合（2.1.x と 3.0.x のみ）、マージされたタブレットスキーマがカラム数の上限に達したことを意味します。`variant_max_merged_tablet_schema_size` を増やすことはできますが（4096 を超えることは推奨されず、強力なハードウェアが必要です）、慎重に行ってください。

## カラム数と型の確認 {#inspect-number-of-columns-and-types}

方法 1: `variant_type` を使用して行ごとのスキーマを確認します（より正確ですが、コストが高くなります）。

```sql
SELECT variant_type(v) FROM variant_tbl;
```

方法 2: 拡張 `DESC` を使用して、Subcolumnization によって抽出されたサブパスを表示します。

```sql
SET describe_extend_variant_column = true;
DESC variant_tbl;
```

``` sql
DESCRIBE ${table_name} PARTITION ($partition_name);
```

両方を使用してください。方法 1 は正確で、方法 2 は効率的です。

## JSON 型との比較 {#compared-with-json-type}

- ストレージ: JSON は JSONB（行指向）として格納されます。VARIANT は書き込み時に Subcolumnization を使用するため、圧縮率が高く、サイズが小さくなります。
- クエリ: JSON では解析が必要です。VARIANT はカラムを直接スキャンするため、通常は大幅に高速です。

ClickBench（43 クエリ）:
- ストレージ: VARIANT は JSON と比較して約 65% 節約します。
- クエリ: VARIANT は JSON より 8x 以上高速で、事前定義された静的カラムに近い性能です。

**ストレージ容量**

| 型                | サイズ       |
| ----------------- | ---------- |
| 事前定義カラム    | 12.618 GB  |
| VARIANT             | 12.718 GB  |
| JSON                | 35.711 GB  |

**約 65% の容量節約**

| 実行             | 事前定義 | VARIANT | JSON            |
| ----------------| ---------- | ------- | --------------- |
| 1 回目（cold）    | 233.79s    | 248.66s | Most timed out  |
| 2 回目（hot）    | 86.02s     | 94.82s  | 789.24s         |
| 3 回目（hot）    | 83.03s     | 92.29s   | 743.69s         |

## よくある質問 {#faq}

1. VARIANT の `null` と SQL の `NULL` は異なりますか？
   - いいえ。同等です。
2. クエリやインデックスが機能しないのはなぜですか？
   - パスを正しい型に CAST しているか、競合によって型が JSONB に昇格していないか、VARIANT 全体ではなくサブパスにインデックスが必要であることを誤解していないかを確認してください。
3. VARIANT カラムに DECIMAL を書き込むと精度が失われるのはなぜですか？
   - VARIANT カラムに書き込むとき、サブカラム型は DECIMAL として推論されません。数値は DOUBLE として格納されるため、末尾の小数が失われる可能性があります。Schema Template でサブパスを DECIMAL と宣言しても（たとえば `pm25 VARIANT<'xxx': DECIMAL(6, 2)>`）、書き込み経路では値が最初に DOUBLE として解析され、その後 DECIMAL に変換されるため、精度は完全には保証されません。JSON 値を文字列として書き込み（たとえば `'{"num": "12.345"}'`）、対応する Schema Template の DECIMAL 宣言（たとえば `DECIMAL(9, 3)`）を指定すると、書き込み時に文字列が直接 DECIMAL として解析され、精度が維持されます。
