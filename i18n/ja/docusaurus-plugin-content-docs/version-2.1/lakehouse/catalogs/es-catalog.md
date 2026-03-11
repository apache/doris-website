---
{
  "title": "Elasticsearchカタログ",
  "language": "ja",
  "description": "Elasticsearch カタログは、ESメタデータの自動マッピングをサポートするだけでなく、"
}
---
Elasticsearch カタログは、ESメタデータの自動マッピングをサポートするだけでなく、Dorisの分散クエリ計画機能とES（Elasticsearch）の全文検索機能を組み合わせて、より包括的なOLAP分析ソリューションを提供します：

1. ESにおけるマルチインデックス分散Joinクエリ

2. DorisとESのテーブル間の結合クエリ（より複雑な全文検索フィルタリング付き）

## 前提条件

Elasticsearch 5.x以上をサポートします。

## Elasticsearchへの接続

```sql
CREATE CATALOG es_catalog PROPERTIES (
    'type' = 'es',
    'hosts' = 'http://127.0.0.1:9200'
    {ElasticsearchProperties}
);
```
* {ElasticsearchProperties}

| Parameter              | Required | Default | Description                                                                                    |
| ---------------------- | -------- | ------- | ---------------------------------------------------------------------------------------------- |
| `hosts`                | Yes      |         | ESアドレス。1つまたは複数、またはESロードバランサーアドレスを指定可能                               |
| `user`                 | No       | Empty   | ESユーザー名                                                                                    |
| `password`             | No       | Empty   | 対応するユーザーのパスワード                                                            |
| `doc_value_scan`       | No       | true    | ES/Luceneのカラムナストレージを通じてクエリフィールド値を取得することを有効にするかどうか               |
| `keyword_sniff`        | No       | true    | ESでストリングトークン化タイプのtext.fieldsを検出し、keywordを通じてクエリするかどうか。falseに設定するとトークン化されたコンテンツに基づいてマッチする |
| `nodes_discovery`      | No       | true    | ESノード検出を有効にするかどうか。デフォルトはtrue。ネットワーク分離環境では指定されたノードのみに接続するためfalseに設定 |
| `ssl`                  | No       | false   | ESでhttpsアクセスモードを有効にするかどうか。現在fe/beでtrust allとして実装             |
| `mapping_es_id`        | No       | false   | ESインデックス内の\_idフィールドをマッピングするかどうか                                                     |
| `like_push_down`       | No       | true    | likeをwildcardに変換してESにプッシュダウンするかどうか。ESのCPU消費が増加する     |
| `include_hidden_index` | No       | false   | 隠しインデックスを含めるかどうか。デフォルトはfalse                                           |

注記:

1. 認証は現在HTTP Basic認証のみをサポートしており、ユーザーが`/_cluster/state/`、`_nodes/http`などのパスへのアクセス権とIndex読み取り権限を持つことを確認する必要があります。クラスターセキュリティ認証が有効でない場合、ユーザー名とパスワードは必要ありません。

2. 5.xと6.xバージョンでは、1つのIndexに複数のtypeがある場合、デフォルトで最初のtypeが取得されます。

## 階層マッピング

ElasticsearchにはDatabaseの概念がないため、ESへの接続後、一意のDatabase `default_db`が自動的に生成されます。

SWITCHコマンドを使用してES Catalogに切り替えると、自動的に`default_db`に切り替わり、`USE default_db`コマンドを実行する必要はありません。

## カラムタイプマッピング

| ES Type           | Doris Type  | Comment                                                                                        |
| ----------------- | ----------- | ---------------------------------------------------------------------------------------------- |
| null              | null        |                                                                                                |
| boolean           | boolean     |                                                                                                |
| byte              | tinyint     |                                                                                                |
| short             | smallint    |                                                                                                |
| integer           | int         |                                                                                                |
| long              | bigint      |                                                                                                |
| unsigned\_long    | largeint    |                                                                                                |
| float             | float       |                                                                                                |
| half\_float       | float       |                                                                                                |
| double            | double      |                                                                                                |
| scaled\_float     | double      |                                                                                                |
| date              | date        | `default`/`yyyy-MM-dd HH:mm:ss`/`yyyy-MM-dd`/`epoch_millis`フォーマットのみサポート           |
| keyword           | string      |                                                                                                |
| text              | string      |                                                                                                |
| ip                | string      |                                                                                                |
| constant\_keyword | string      |                                                                                                |
| wildcard          | string      |                                                                                                |
| nested            | json        |                                                                                                |
| object            | json        |                                                                                                |
| flattened         | json        | バージョン3.1.4、4.0.3以降でサポート                                                         |
| other             | UNSUPPORTED |                                                                                                |

### 配列タイプ

Elasticsearchには明示的な配列タイプはありませんが、そのフィールドは[0個以上の値](https://www.elastic.co/guide/en/elasticsearch/reference/current/array.html)を含むことができます。

フィールドが配列タイプであることを示すには、インデックスマッピングの[\_meta](https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping-meta-field.html)セクションに特定の`doris`構造アノテーションを追加できます。

Elasticsearch 6.x以前のバージョンについては、[\_meta](https://www.elastic.co/guide/en/elasticsearch/reference/6.8/mapping-meta-field.html)を参照してください。

例えば、以下のデータ構造を含むインデックス`doc`があるとします：

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
この構造体の配列フィールドは、以下のコマンドを使用してターゲットインデックスマッピングの`_meta.doris`プロパティにフィールドプロパティ定義を追加することで定義できます。

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
`array_fields`: 配列型のフィールドを示すために使用されます。

### flattened Type

`flattened`型の場合、`enable_docvalue_scan`プロパティが`false`の時、読み出されるJSONデータ形式は平坦化されます。`enable_docvalue_scan`プロパティが`true`の場合、元のJSON形式で読み出されます。以下に例を示します：

インデックス定義：

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
- `enable_docvalue_scan`プロパティが`false`の場合

   `extra`列のクエリ結果は以下の通りです：

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
- `enable_docvalue_scan`プロパティが`true`の場合

   `extra`列のクエリ結果は以下の通りです：

   ```json
   ["abc","element1","element2","element3"]
   ```
## Query Operations

Catalogを設定した後、以下の方法でCatalog内のテーブルデータをクエリできます：

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
より高度なクエリ機能については、[Best Practices] セクションを参照してください。

## Best Practices

### Filter Predicate Pushdown

ES Catalog は filter predicate pushdown をサポートします：フィルタ条件が ES にプッシュダウンされるため、条件を真に満たすデータのみが返され、クエリパフォーマンスを大幅に向上させ、Doris と Elasticsearch の CPU、Memory、IO 使用量を削減できます。

以下の演算子は対応する ES Query に最適化されます：

| SQL syntax              | ES 5.x+ syntax                |
| ----------------------- | ----------------------------- |
| `=`                     | term query                    |
| `in`                    | terms query                   |
| `>` , `<` , `>=` , `<=` | range query                   |
| `and`                   | bool.filter                   |
| `or`                    | bool.should                   |
| `not`                   | bool.must\_not                |
| `not in`                | bool.must\_not + terms query  |
| `is_not_null`           | exists query                  |
| `is_null`               | bool.must\_not + exists query |
| `esquery`               | ES native json form QueryDSL  |

### Columnar Scan を有効にしてクエリ速度を最適化する（enable\_docvalue\_scan=true）

`"enable_docvalue_scan" = "true"` を設定

有効にすると、Doris は ES からデータを取得する際に以下の2つの原則に従います：

* **Best Effort**：読み取り対象のフィールドが columnar storage を有効にしているかどうか（doc\_value: true）を自動検出します。すべてのフィールドが columnar storage を持つ場合、Doris は columnar storage からすべてのフィールド値を取得します。

* **Automatic Degradation**：取得対象のフィールドのいずれかが columnar storage を持たない場合、すべてのフィールド値が row storage `_source` から解析および取得されます。

**利点**：

デフォルトでは、Doris On ES はすべての必要な列を row storage、すなわち `_source` から取得します。`_source` storage は行ベース + JSON 形式を使用し、特に少数の列のみが必要な場合、columnar storage と比較してバッチ読み取りパフォーマンスが劣ります。少数の列のみが必要な場合、docvalue のパフォーマンスは \_source のパフォーマンスより約10倍優れています。

**注意事項**：

1. `text` タイプのフィールドは ES で columnar storage を持たないため、取得対象のフィールド値のいずれかが `text` タイプの場合、`_source` からの取得に自動的に劣化します。

2. 取得するフィールド数が多すぎる場合（`>= 25`）、`docvalue` からのフィールド値取得のパフォーマンスは `_source` からのフィールド値取得と基本的に同じになります。

3. `keyword` タイプのフィールドは、この制限を超える長いテキストフィールドの [`ignore_above`](https://www.elastic.co/guide/en/elasticsearch/reference/current/keyword.html#keyword-params) パラメータ制限により空で表示される場合があります。この場合、`enable_docvalue_scan` を無効にして `_source` から結果を取得する必要があります。

### Keyword Type Fields を検出する

`"enable_keyword_sniff" = "true"` を設定

ES では、index を確立せずに直接データをインポートできます。この場合、ES は自動的に新しい index を作成します。string タイプのフィールドについて、ES は `text` タイプと `keyword` タイプの両方を持つフィールドを作成します。これは ES の multi fields 機能で、mapping は以下の通りです：

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
k4でのフィルタリング（=など）を行う場合、Doris On ESはクエリをESのTermQueryに変換します。

SQLフィルタ条件：

```sql
k4 = "Doris On ES"
```
ES query DSLに変換されました：

```json
"term" : {
    "k4": "Doris On ES"

}
```
k4の最初のフィールドタイプが`text`であるため、データインポート時にk4で設定されたtokenizer（設定されていない場合はstandard tokenizer）に従ってトークン化され、ES analyze APIで解析されるように、doris、on、esという3つのTermsが得られます：

```json
POST /_analyze
{
  "analyzer": "standard",
  "text": "Doris On ES"
}
```
トークン化の結果は次の通りです：

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
クエリで使用するもの:

```json
"term" : {
    "k4": "Doris On ES"
}
```
`Doris On ES`という用語は辞書内のどの用語とも一致せず、結果を返しません。`enable_keyword_sniff: true`を有効にすると、`k4 = "Doris On ES"`が自動的に`k4.keyword = "Doris On ES"`に変換され、SQLセマンティクスと完全に一致します。変換されたESクエリDSLは以下の通りです：

```json
"term" : {
    "k4.keyword": "Doris On ES"
}
```
`k4.keyword`の型は`keyword`で、データはES内に完全な用語として書き込まれるため、マッチが可能です。

### ノード自動検出の有効化（nodes\_discovery=true）

`"nodes_discovery" = "true"`を設定します

trueとして設定された場合、Dorisは利用可能な関連データノード（上記で割り当てられたシャード）をESから全て検索します。ESデータノードのアドレスがDoris BEからアクセスできない場合は、falseに設定してください。ESクラスターがパブリックインターネットから分離されたイントラネットにデプロイされており、ユーザーがプロキシ経由でアクセスする場合です。

### ESクラスターがHTTPSアクセスモードを有効にしているかどうか

`"ssl" = "true"`を設定します

現在のFE/BEの実装は trust all であり、これは一時的なソリューションです。後に実際のユーザー設定証明書が使用される予定です。

### 拡張esquery()関数

`esquery(field, QueryDSL)`関数を使用して、`match_phrase`、`geoshape`などのSQLでは表現できない一部のクエリをESにプッシュダウンしてフィルタリングを行います。`esquery`の最初の列名パラメータは`index`の関連付けに使用され、2番目のパラメータはESの基本的な`Query DSL`のJSON表現で、中括弧`{}`で囲まれます。JSONの`root key`は1つだけ存在する必要があり、例えば`match_phrase`、`geo_shape`、`bool`などです。

`match_phrase`クエリ：

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
`bool`クエリ:

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
### Time Type Field使用に関する推奨事項

ESエクスターナルテーブルにのみ適用されます。ES Catalogでは、日付タイプは自動的にDateまたはDatetimeにマッピングされます。

ESでは、time typeフィールドは非常に柔軟に使用できますが、ESエクスターナルテーブルでは、time typeフィールドが適切に設定されていない場合、フィルタ条件をプッシュダウンできません。

インデックスを作成する際は、最大限のフォーマット互換性のためにtime typeフォーマットを設定してください：

```json
 "dt": {
     "type": "date",
     "format": "yyyy-MM-dd HH:mm:ss||yyyy-MM-dd||epoch_millis"
 }
```
Dorisでこのフィールドを設定する際は、`date`または`datetime`として設定するか、`varchar`タイプとして設定することを推奨します。以下のSQLステートメントを使用することで、フィルタ条件を直接ESにプッシュダウンできます：

```sql
select * from doe where k2 > '2020-06-21';

select * from doe where k2 < '2020-06-21 12:00:00'; 

select * from doe where k2 < 1593497011; 

select * from doe where k2 < now();

select * from doe where k2 < date_format(now(), '%Y-%m-%d');
```
**注意**:

* ESで時間型フィールドに`format`を設定しない場合、デフォルトの時間型フィールドフォーマットは以下のとおりです:

  ```sql
  strict_date_optional_time||epoch_millis
  ```
* ESにインポートされる日付フィールドがタイムスタンプの場合、`ms`に変換する必要があります。ESは内部的にタイムスタンプを`ms`で処理するため、そうしないとES外部テーブルで表示エラーが発生します。

### ESメタデータフィールドIDの取得

`_id`を指定せずにドキュメントをインポートする場合、ESは各ドキュメントにグローバルに一意な`_id`（主キー）を割り当てます。ユーザーはインポート時に特別な業務上の意味を持つ`_id`を指定することもできます。

ES外部テーブルでこのフィールド値を取得する必要がある場合、テーブル作成時に`varchar`型の`_id`フィールドを追加できます：

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
ES Catalogでこのフィールド値を取得する必要がある場合は、`"mapping_es_id" = "true"`を設定してください。

**注意**:

1. `_id`フィールドのフィルタ条件は`=`と`in`のみをサポートします。

2. `_id`フィールドは`varchar`型である必要があります。

### グローバル順序クエリ結果の取得

関連度ランキングや重要なコンテンツの優先表示などのシナリオでは、ESクエリ結果をスコア順にソートすることが非常に有用です。DorisはESをクエリする際、ESインデックスのshard分散に従ってデータを取得することで、MPPアーキテクチャの利点を最大限に活用します。
グローバル順序のソート結果を取得するには、ESを単一ポイントからクエリする必要があります。これはセッション変数`enable_es_parallel_scroll`（デフォルトはtrue）で制御できます。
`enable_es_parallel_scroll=false`を設定すると、Dorisは`shard_preference`と`sort`情報を含まない`scroll`クエリをESクラスタに送信し、グローバル順序の結果を取得します。
注意: クエリ結果セットが大きい場合は注意して使用してください。

### scrollリクエストバッチサイズの変更

`scroll`リクエストのデフォルト`batch`サイズは4064です。セッション変数`batch_size`を通じて変更できます。

## よくある質問

1. **X-Pack認証を使用するESクラスタをサポートしていますか？**

   HTTP Basic認証を使用するすべてのESクラスタをサポートします。

2. **一部のクエリがESに直接リクエストするよりもはるかに遅い**

   はい、\_count関連クエリなどです。ESは内部的に条件を満たすドキュメント数に関するメタデータを直接読み取り、実際のデータをフィルタリングしません。

3. **集約操作をプッシュダウンできますか？**

   現在、Doris On ESはsum、avg、min/maxなどの集約操作のプッシュダウンをサポートしていません。計算方法は、条件を満たすすべてのドキュメントをESからバッチストリームで取得し、その後Dorisで計算することです。

## 付録

### DorisがESをクエリする原理

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
1. FEは、テーブル作成時に指定されたホストに対して、全ノードのHTTPポート情報やインデックスのシャード分散情報などを取得するリクエストを行います。リクエストが失敗した場合、成功するか完全に失敗するまで、ホストリストを順次トラバースします。

2. クエリ実行時、FEが取得したノード情報とインデックスメタデータ情報に基づいて、クエリプランが生成され、対応するBEノードに送信されます。

3. BEノードは、`proximity principle`に従って、まずローカルにデプロイされたESノードにリクエストを行います。BEは`HTTP Scroll`メソッドを使用して、`_source`または`docvalue`からストリーミング形式でESインデックスの各シャードから並行してデータを取得します。

4. Dorisが計算を完了した後、結果をユーザーに返します。
