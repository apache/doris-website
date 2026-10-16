---
{
    "title": "Elasticsearch カタログ",
    "language": "ja",
    "description": "Elasticsearch カタログは ES メタデータの自動マッピングに対応するだけでなく、"
}
---

Elasticsearch カタログは ES メタデータの自動マッピングに対応するだけでなく、Doris の分散クエリ計画機能と ES（Elasticsearch）の全文検索機能を組み合わせ、より包括的な OLAP 分析ソリューションを提供します。

1. ES 内の複数インデックスにまたがる分散 Join クエリ。

2. Doris のテーブルと ES のテーブルを組み合わせ、より複雑な全文検索フィルタリングを行うクエリ。

## 前提条件

Elasticsearch 5.x 以降に対応しています。

## Elasticsearch への接続

```sql
CREATE CATALOG es_catalog PROPERTIES (
    'type' = 'es',
    'hosts' = 'http://127.0.0.1:9200'
    {ElasticsearchProperties}
);
```

* {ElasticsearchProperties}

| パラメータ             | 必須 | デフォルト | 説明 |
| ---------------------- | ---- | ---------- | ---- |
| `hosts`                | はい |            | ES のアドレス。一つでも複数でも指定でき、ES ロードバランサーのアドレスも指定できます。 |
| `user`                 | いいえ | 空 | ES のユーザー名。 |
| `password`             | いいえ | 空 | 対応するユーザーのパスワード。 |
| `doc_value_scan`       | いいえ | true | ES/Lucene の列指向ストレージからクエリ対象フィールドの値を取得するかどうか。 |
| `keyword_sniff`        | いいえ | true | ES の文字列トークン化型について text フィールドを検出し、keyword を使ってクエリするかどうか。false に設定すると、トークン化された内容に基づいて照合します。 |
| `nodes_discovery`      | いいえ | true | ES ノードの検出を有効にするかどうか。デフォルトは true です。ネットワークが分離された環境で指定したノードにのみ接続するには false に設定します。 |
| `ssl`                  | いいえ | false | ES で HTTPS アクセスモードを有効にするかどうか。現在の FE/BE の実装ではすべての証明書を信頼します。 |
| `mapping_es_id`        | いいえ | false | ES インデックスの \_id フィールドをマッピングするかどうか。 |
| `like_push_down`       | いいえ | true | LIKE を wildcard に変換して ES にプッシュダウンするかどうか。ES の CPU 使用量が増加します。 |
| `include_hidden_index` | いいえ | false | 非表示インデックスを含めるかどうか。デフォルトは false です。 |

注:

1. 現在、認証は HTTP Basic 認証にのみ対応しています。ユーザーに `/_cluster/state/`、`_nodes/http` などのパスへのアクセス権限とインデックスの読み取り権限があることを確認してください。クラスターのセキュリティ認証が有効でない場合、ユーザー名とパスワードは不要です。

2. バージョン 5.x と 6.x では、一つのインデックスに複数の型がある場合、デフォルトで最初の型が使用されます。

## 階層のマッピング

Elasticsearch には Database の概念がないため、ES に接続すると、一意の Database `default_db` が自動生成されます。

SWITCH コマンドで ES カタログに切り替えると、`default_db` にも自動的に切り替わるため、`USE default_db` コマンドを実行する必要はありません。

## 列型のマッピング

| ES の型           | Doris の型  | 備考 |
| ----------------- | ----------- | ---- |
| null              | null        |      |
| boolean           | boolean     |      |
| byte              | tinyint     |      |
| short             | smallint    |      |
| integer           | int         |      |
| long              | bigint      |      |
| unsigned\_long    | largeint    |      |
| float             | float       |      |
| half\_float       | float       |      |
| double            | double      |      |
| scaled\_float     | double      |      |
| date              | date        | `default` / `yyyy-MM-dd HH:mm:ss` / `yyyy-MM-dd` / `epoch_millis` 形式のみ対応します。 |
| keyword           | string      |      |
| text              | string      |      |
| ip                | string      |      |
| constant\_keyword | string      |      |
| wildcard          | string      |      |
| nested            | json        |      |
| object            | json        |      |
| flattened         | json        | バージョン 3.1.4、4.0.3 以降で対応します。 |
| other             | UNSUPPORTED |      |

### 配列型

Elasticsearch には明示的な配列型はありませんが、フィールドには[0 個以上の値](https://www.elastic.co/guide/en/elasticsearch/reference/current/array.html)を含めることができます。

フィールドが配列型であることを示すには、所定の `doris` 構造の注釈をインデックスマッピングの [\_meta](https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping-meta-field.html) セクションに追加します。

Elasticsearch 6.x 以前のバージョンについては、[\_meta](https://www.elastic.co/guide/en/elasticsearch/reference/6.8/mapping-meta-field.html) を参照してください。

たとえば、次のデータ構造を含むインデックス `doc` があるとします。

```json
{
  "array_int_field": [1, 2, 3, 4],
  "array_string_field": ["doris", "is", "the", "best"],
  "id_field": "id-xxx-xxx",
  "timestamp_field": "2022-11-12T12:08:56Z",
  "array_object_field": [
    {
      "name": "xxx",
      "age": 18
    }
  ]
}
```

次のコマンドで対象インデックスのマッピングにある `_meta.doris` プロパティへフィールド属性の定義を追加すると、この構造の配列フィールドを定義できます。

```shell
# ES 7.x and above
curl -X PUT "localhost:9200/doc/_mapping?pretty" -H 'Content-Type:application/json' -d '
{
    "_meta": {
        "doris":{
            "array_fields":[
                "array_int_field",
                "array_string_field",
                "array_object_field"
            ]
        }
    }
}'

# ES 6.x and before
curl -X PUT "localhost:9200/doc/_mapping/_doc?pretty" -H 'Content-Type: application/json' -d '
{
    "_meta": {
        "doris":{
            "array_fields":[
                "array_int_field",
                "array_string_field",
                "array_object_field"
            ]
        }
    }
}
```

`array_fields`: 配列型のフィールドを示すために使用します。

### flattened 型

`flattened` 型では、`enable_docvalue_scan` プロパティが `false` の場合、読み取られる JSON データ形式はフラット化されます。`enable_docvalue_scan` プロパティが `true` の場合、元の JSON 形式が読み取られます。例を次に示します。

インデックスの定義:

```json
"mappings": {
   "properties": {
      "column1": {
      "type": "keyword"
      },
      "extra": {
      "type": "flattened"
      }
   }
}
```

データ:

```json
{
  "column1": 1,
  "extra": {
    "subcol1": "abc",
    "sub_array": [
      {"k1": "element1"},
      {"k2": "element2"},
      {"k3": "element3"}
    ]
  }
}
```

- `enable_docvalue_scan` プロパティが `false` の場合

   `extra` 列のクエリ結果は次のとおりです。

   ```json
   {
      "subcol1": "abc",
      "sub_array": [
         {"k1": "element1"},
         {"k2": "element2"},
         {"k3": "element3"}
      ]
   }
   ```

- `enable_docvalue_scan` プロパティが `true` の場合

   `extra` 列のクエリ結果は次のとおりです。

   ```json
   ["abc","element1","element2","element3"]
   ```

## クエリ操作

カタログを設定した後、次の方法でカタログ内のテーブルデータをクエリできます。

```sql
-- 1. switch to catalog, use database and query
SWITCH es_ctl;
SELECT * FROM es_tbl LIMIT 10;

-- 2. use default_db directly
USE es_ctl.default_db;
SELECT * FROM es_tbl LIMIT 10;

-- 3. use full qualified name to query
SELECT * FROM es_ctl.default_db.es_tbl LIMIT 10;
```

より高度なクエリ機能については、[ベストプラクティス] セクションを参照してください。

## ベストプラクティス

### フィルター述語のプッシュダウン

ES カタログはフィルター述語のプッシュダウンに対応しています。フィルター条件を ES にプッシュダウンするため、実際に条件を満たすデータだけが返されます。これにより、クエリ性能を大幅に向上させ、Doris と Elasticsearch の CPU、メモリ、IO の使用量を削減できます。

次の演算子は、対応する ES クエリに最適化されます。

| SQL 構文                | ES 5.x 以降の構文              |
| ----------------------- | ----------------------------- |
| `=`                     | term クエリ                   |
| `in`                    | terms クエリ                  |
| `>` , `<` , `>=` , `<=` | range クエリ                  |
| `and`                   | bool.filter                   |
| `or`                    | bool.should                   |
| `not`                   | bool.must\_not                |
| `not in`                | bool.must\_not + terms クエリ |
| `is_not_null`           | exists クエリ                 |
| `is_null`               | bool.must\_not + exists クエリ |
| `esquery`               | ES ネイティブの JSON 形式の QueryDSL |

### 列指向スキャンを有効にしてクエリ速度を最適化する（enable\_docvalue\_scan=true）

`"enable_docvalue_scan" = "true"` に設定します。

有効にすると、Doris は ES からデータを取得する際に、次の二つの原則に従います。

* **ベストエフォート**: 読み取るフィールドで列指向ストレージが有効か（doc\_value: true）を自動検出します。すべてのフィールドに列指向ストレージがある場合、Doris はすべてのフィールド値をそこから取得します。

* **自動フォールバック**: 取得するフィールドのいずれかに列指向ストレージがない場合、すべてのフィールド値を行指向ストレージ `_source` から解析して取得します。

**利点**:

デフォルトでは、Doris On ES は必要な列をすべて行指向ストレージの `_source` から取得します。`_source` は行指向の JSON 形式で格納されるため、特に必要な列が少ない場合、バッチ読み取り性能が列指向ストレージより低くなります。必要な列が少ない場合、docvalue の性能は \_source の約十倍です。

**注**:

1. ES の `text` 型フィールドには列指向ストレージがありません。そのため、取得するフィールド値のいずれかが `text` 型であれば、`_source` からの取得に自動的に切り替わります。

2. 取得するフィールド数が多すぎる場合（`>= 25`）、`docvalue` からフィールド値を取得する性能は `_source` から取得する場合とほぼ同じになります。

3. `keyword` 型のフィールドでは、長いテキストが [`ignore_above`](https://www.elastic.co/guide/en/elasticsearch/reference/current/keyword.html#keyword-params) パラメータの上限を超えると、値が空になることがあります。この場合は `enable_docvalue_scan` を無効にして、`_source` から結果を取得する必要があります。

### keyword 型フィールドの検出

`"enable_keyword_sniff" = "true"` に設定します。

ES では、インデックスを作成せずにデータを直接インポートできます。この場合、ES は新しいインデックスを自動作成します。文字列型フィールドに対して、ES は `text` 型と `keyword` 型の両方を持つフィールドを作成します。これは ES のマルチフィールド機能で、マッピングは次のようになります。

```json
"k4": {
   "type": "text",
   "fields": {
      "keyword": {   
         "type": "keyword",
         "ignore_above": 256
      }
   }
}
```

= などを使って k4 をフィルタリングすると、Doris On ES はクエリを ES の TermQuery に変換します。

SQL のフィルター条件:

```sql
k4 = "Doris On ES"
```

変換後の ES クエリ DSL:

```json
"term" : {
    "k4": "Doris On ES"

}
```

k4 の最初のフィールド型は `text` なので、データのインポート時には k4 に設定されたトークナイザー（設定されていない場合は標準トークナイザー）に従ってトークン化され、doris、on、es という三つの Term が生成されます。ES の analyze API では次のように分析できます。

```json
POST /_analyze
{
  "analyzer": "standard",
  "text": "Doris On ES"
}
```

トークン化の結果は次のとおりです。

```json
{
   "tokens": [
      {
         "token": "doris",
         "start_offset": 0,
         "end_offset": 5,
         "type": "<ALPHANUM>",
         "position": 0
      },
      {
         "token": "on",
         "start_offset": 6,
         "end_offset": 8,
         "type": "<ALPHANUM>",
         "position": 1
      },
      {
         "token": "es",
         "start_offset": 9,
         "end_offset": 11,
         "type": "<ALPHANUM>",
         "position": 2
      }
   ]
}
```

クエリでは次のように使用します。

```json
"term" : {
    "k4": "Doris On ES"
}
```

`Doris On ES` という Term は辞書内のどの Term とも一致しないため、結果は返されません。`enable_keyword_sniff: true` を有効にすると、`k4 = "Doris On ES"` は自動的に `k4.keyword = "Doris On ES"` に変換され、SQL のセマンティクスと完全に一致します。変換後の ES クエリ DSL は次のとおりです。

```json
"term" : {
    "k4.keyword": "Doris On ES"
}
```

`k4.keyword` の型は `keyword` で、データは完全な一つの Term として ES に書き込まれるため、一致させることができます。

### ノードの自動検出を有効にする（nodes\_discovery=true）

`"nodes_discovery" = "true"` に設定します。

true に設定すると、Doris は ES から関連する利用可能なすべてのデータノード（シャードが割り当てられたノード）を検出します。Doris BE から ES データノードのアドレスにアクセスできない場合は、false に設定します。たとえば、ES クラスターがパブリックインターネットから分離されたイントラネットにデプロイされ、ユーザーがプロキシ経由でアクセスする場合です。

### ES クラスターで HTTPS アクセスモードを有効にするかどうか

`"ssl" = "true"` に設定します。

現在の FE/BE の実装ではすべての証明書を信頼します。これは暫定的な方法であり、今後はユーザーが設定した証明書を使用する予定です。

### 拡張 esquery() 関数

`esquery(field, QueryDSL)` 関数を使用すると、`match_phrase` や `geoshape` など、SQL では表現できないクエリを ES にプッシュダウンしてフィルタリングできます。`esquery` の第一引数である列名は `index` との関連付けに使用され、第二引数には ES の基本的な `Query DSL` を中括弧 `{}` で囲んだ JSON 表現を指定します。JSON の `root key` は `match_phrase`、`geo_shape`、`bool` など、必ず一つだけにする必要があります。

`match_phrase` クエリ:

```sql
select * from es_table where esquery(k4, '{
        "match_phrase": {
           "k4": "doris on es"
        }
    }');
```

`geo` 関連のクエリ:

```sql
select * from es_table where esquery(k4, '{
      "geo_shape": {
         "location": {
            "shape": {
               "type": "envelope",
               "coordinates": [
                  [
                     13,
                     53
                  ],
                  [
                     14,
                     52
                  ]
               ]
            },
            "relation": "within"
         }
      }
   }');
```

`bool` クエリ:

```sql
select * from es_table where esquery(k4, ' {
         "bool": {
            "must": [
               {
                  "terms": {
                     "k1": [
                        11,
                        12
                     ]
                  }
               },
               {
                  "terms": {
                     "k2": [
                        100
                     ]
                  }
               }
            ]
         }
      }');
```

### 時刻型フィールドの使用に関する推奨事項

ES 外部テーブルにのみ適用されます。ES カタログでは、日付型は Date または Datetime に自動的にマッピングされます。

ES では時刻型フィールドを柔軟に使用できますが、ES 外部テーブルでは時刻型フィールドを適切に設定しないと、フィルター条件をプッシュダウンできません。

インデックスを作成する際は、形式の互換性を最大限に確保するため、時刻型のフォーマットを次のように設定します。

```json
 "dt": {
     "type": "date",
     "format": "yyyy-MM-dd HH:mm:ss||yyyy-MM-dd||epoch_millis"
 }
```

Doris でこのフィールドを定義する際は、`date` または `datetime` に設定することを推奨します。`varchar` 型に設定することもできます。次の SQL 文を使用すると、フィルター条件を ES に直接プッシュダウンできます。

```sql
select * from doe where k2 > '2020-06-21';

select * from doe where k2 < '2020-06-21 12:00:00'; 

select * from doe where k2 < 1593497011; 

select * from doe where k2 < now();

select * from doe where k2 < date_format(now(), '%Y-%m-%d');
```

**注**:

* ES で時刻型フィールドの `format` を設定しない場合、デフォルトの形式は次のとおりです。

  ```sql
  strict_date_optional_time||epoch_millis
  ```

* ES にインポートする日付フィールドがタイムスタンプの場合、`ms` に変換する必要があります。ES は内部でタイムスタンプを `ms` 単位で処理するため、変換しないと ES 外部テーブルで表示エラーが発生します。

### ES メタデータフィールド ID の取得

ドキュメントのインポート時に `_id` を指定しない場合、ES は各ドキュメントにグローバルに一意な `_id`（主キー）を割り当てます。ユーザーはインポート時に、業務上の特別な意味を持つ `_id` を指定することもできます。

ES 外部テーブルでこのフィールドの値を取得するには、テーブル作成時に `_id` フィールドを `varchar` 型で追加します。

```sql
CREATE EXTERNAL TABLE `doe` (
  `_id` varchar COMMENT "",
  `city`  varchar COMMENT ""
) ENGINE=ELASTICSEARCH
PROPERTIES (
"hosts" = "http://127.0.0.1:8200",
"user" = "root",
"password" = "root",
"index" = "doe"
}
```

ES カタログでこのフィールドの値を取得するには、`"mapping_es_id" = "true"` に設定してください。

**注**:

1. `_id` フィールドのフィルター条件では、`=` と `in` のみがサポートされます。

2. `_id` フィールドは `varchar` 型である必要があります。

### グローバルに順序付けされたクエリ結果の取得

関連度によるランキングや重要なコンテンツの優先表示などでは、ES のクエリ結果をスコア順に並べ替えると便利です。Doris は ES のインデックスのシャード分布に従ってデータを取得し、MPP アーキテクチャの利点を最大限に活用します。
グローバルに順序付けされた結果を得るには、単一の地点から ES にクエリする必要があります。これはセッション変数 `enable_es_parallel_scroll`（デフォルトは true）で制御できます。
`enable_es_parallel_scroll=false` に設定すると、Doris は `scroll` クエリを `shard_preference` と `sort` の情報を指定せずに ES クラスターへ送信し、グローバルに順序付けされた結果を取得します。
注: クエリの結果セットが大きい場合は慎重に使用してください。

### scroll リクエストのバッチサイズの変更

デフォルトの `batch` サイズは、`scroll` リクエストでは 4064 です。セッション変数 `batch_size` で変更できます。

## よくある質問

1. **X-Pack 認証を使用する ES クラスターに対応していますか？**

   HTTP Basic 認証を使用するすべての ES クラスターに対応しています。

2. **一部のクエリが ES に直接リクエストする場合よりも大幅に遅いのはなぜですか？**

   \_count 関連のクエリなどでは、そのような場合があります。ES は、実際のデータをフィルタリングせずに、条件を満たすドキュメント数に関するメタデータを内部で直接読み取ります。

3. **集約処理をプッシュダウンできますか？**

   現在、Doris On ES は sum、avg、min/max などの集約処理のプッシュダウンに対応していません。条件を満たすすべてのドキュメントを ES からバッチでストリーミングし、Doris で計算します。

## 付録

### Doris による ES クエリの仕組み

```plain text
+----------------------------------------------+
|                                              |
| Doris      +------------------+              |
|            |       FE         +--------------+-------+
|            |                  |  Request Shard Location
|            +--+-------------+-+              |       |
|               ^             ^                |       |
|               |             |                |       |
|  +-------------------+ +------------------+  |       |
|  |            |      | |    |             |  |       |
|  | +----------+----+ | | +--+-----------+ |  |       |
|  | |      BE       | | | |      BE      | |  |       |
|  | +---------------+ | | +--------------+ |  |       |
+----------------------------------------------+       |
   |        |          | |        |         |          |
   |        |          | |        |         |          |
   |    HTTP SCROLL    | |    HTTP SCROLL   |          |
+-----------+---------------------+------------+       |
|  |        v          | |        v         |  |       |
|  | +------+--------+ | | +------+-------+ |  |       |
|  | |               | | | |              | |  |       |
|  | |   DataNode    | | | |   DataNode   +<-----------+
|  | |               | | | |              | |  |       |
|  | |               +<--------------------------------+
|  | +---------------+ | | |--------------| |  |       |
|  +-------------------+ +------------------+  |       |
|   Same Physical Node                         |       |
|                                              |       |
|           +-----------------------+          |       |
|           |                       |          |       |
|           |      MasterNode       +<-----------------+
| ES        |                       |          |
|           +-----------------------+          |
+----------------------------------------------+
```

1. FE はテーブル作成時に指定された hosts にリクエストを送信し、全ノードの HTTP ポート情報やインデックスのシャード分布情報などを取得します。リクエストに失敗した場合、成功するか、すべて失敗するまで、ホストのリストを順番に試します。

2. クエリ時には、FE が取得したノード情報とインデックスのメタデータ情報に基づいてクエリ計画が生成され、対応する BE ノードに送信されます。

3. BE ノードは `proximity principle` に従い、まずローカルにデプロイされた ES ノードにリクエストします。BE は ES インデックスの各シャードから `HTTP Scroll` 方式で、`_source` または `docvalue` を使ってデータを並列にストリーミング取得します。

4. Doris は計算が完了すると、結果をユーザーに返します。
