---
{
  "title": "Elasticsearchカタログ",
  "description": "Elasticsearch カタログは、ESメタデータの自動マッピングをサポートするだけでなく、",
  "language": "ja"
}
---
Elasticsearch カタログは、ESメタデータの自動マッピングをサポートするだけでなく、Dorisの分散クエリ計画機能とES（Elasticsearch）の全文検索機能を組み合わせて、より包括的なOLAP分析ソリューションを提供します：

1. ESにおけるマルチインデックス分散Joinクエリ。

2. DorisとESのtable間でのジョイントクエリと、より複雑な全文検索フィルタリング。

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

| Parameter              | Required | Default | デスクリプション                                                                                    |
| ---------------------- | -------- | ------- | ---------------------------------------------------------------------------------------------- |
| `hosts`                | Yes      |         | ESアドレス、単一または複数、またはESロードバランサーアドレスを指定可能                               |
| `user`                 | No       | Empty   | ESユーザー名                                                                                    |
| `password`             | No       | Empty   | 対応するユーザーのパスワード                                                                    |
| `doc_value_scan`       | No       | true    | ES/Lucene列指向ストレージを通じてクエリフィールド値を取得することを有効にするかどうか               |
| `keyword_sniff`        | No       | true    | ESの文字列トークン化タイプに対してtext.fieldsを検出し、keywordを通じてクエリするかどうか。falseに設定するとトークン化されたコンテンツに基づいてマッチングされる |
| `nodes_discovery`      | No       | true    | ESノード検出を有効にするかどうか、デフォルトはtrue。ネットワーク分離環境では指定されたノードのみに接続するためfalseに設定 |
| `ssl`                  | No       | false   | ESがhttpsアクセスモードを有効にするかどうか、現在fe/beではtrust allとして実装                     |
| `mapping_es_id`        | No       | false   | ESインデックスの\_idフィールドをマップするかどうか                                               |
| `like_push_down`       | No       | true    | likeをwildcardに変換してESにプッシュダウンするかどうか、ESのCPU消費が増加する                    |
| `include_hidden_index` | No       | false   | 隠しインデックスを含めるかどうか、デフォルトはfalse                                             |

注意事項：

1. 認証は現在HTTP Basic認証のみサポートしており、ユーザーが`/_cluster/state/`、`_nodes/http`などのパスへのアクセス権限とIndexの読み取り権限を持つことを確認する必要があります。クラスターセキュリティ認証が有効でない場合、ユーザー名とパスワードは不要です。

2. 5.xおよび6.xバージョンでは、1つのIndexに複数のtypeがある場合、デフォルトで最初のtypeが取得されます。

## 階層マッピング

ElasticsearchにはDatabaseの概念がないため、ESに接続すると一意のDatabaseが自動的に生成されます：`default_db`。

SWITCHコマンドを使用してES Catalogに切り替えると、自動的に`default_db`に切り替わるため、`USE default_db`コマンドを実行する必要はありません。

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
| date              | date        | `default`/`yyyy-MM-dd HH:mm:ss`/`yyyy-MM-dd`/`epoch_millis`フォーマットのみサポート            |
| keyword           | string      |                                                                                                |
| text              | string      |                                                                                                |
| ip                | string      |                                                                                                |
| constant\_keyword | string      |                                                                                                |
| wildcard          | string      |                                                                                                |
| nested            | json        |                                                                                                |
| object            | json        |                                                                                                |
| flattened         | json        | バージョン3.1.4、4.0.3からサポート                                                            |
| other             | UNSUPPORTED |                                                                                                |

### 配列タイプ

Elasticsearchには明示的な配列タイプはありませんが、そのフィールドは[0個以上の値](https://www.elastic.co/guide/en/elasticsearch/reference/current/array.html)を含むことができます。

フィールドが配列タイプであることを示すために、インデックスマッピングの[\_meta](https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping-meta-field.html)セクションに特定の`doris`構造注釈を追加できます。

Elasticsearch 6.x以前のバージョンについては、[\_meta](https://www.elastic.co/guide/en/elasticsearch/reference/6.8/mapping-meta-field.html)を参照してください。

例えば、次のデータ構造を含む`doc`インデックスがあるとします：

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

`flattened` typeの場合、`enable_docvalue_scan` プロパティが `false` のとき、読み出されるJSONデータ形式はフラット化されます。`enable_docvalue_scan` プロパティが `true` の場合は、元のJSON形式で読み出されます。以下に例を示します：

Index definition:

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

   `extra`カラムのクエリ結果は以下の通りです：

   ```json
   ["abc","element1","element2","element3"]
   ```
## Query 運用

Catalogを設定した後、以下の方法でCatalog内のTableデータをクエリできます：

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
より高度なクエリ機能については、[Best Practices]セクションを参照してください。

## Best Practices

### フィルタ述語プッシュダウン

ES CatalogはFilter Predicate Pushdownをサポートしています：フィルタ条件はESにプッシュダウンされるため、条件を満たすデータのみが返され、クエリパフォーマンスが大幅に向上し、DorisとElasticsearchのCPU、Memory、IO使用量を削減できます。

以下の演算子は対応するES Queryに最適化されます：

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

### Columnar Scanを有効にしてクエリ速度を最適化 (enable\_docvalue\_scan=true)

`"enable_docvalue_scan" = "true"`を設定

有効にすると、DorisはESからデータを取得する際に以下の2つの原則に従います：

* **Best Effort**：読み取り対象フィールドがカラムナーストレージを有効にしているか（doc\_value: true）を自動検出します。すべてのフィールドがカラムナーストレージを持つ場合、Dorisはカラムナーストレージからすべてのフィールド値を取得します。

* **Automatic Degradation**：取得対象フィールドのいずれかがカラムナーストレージを持たない場合、すべてのフィールド値は行ストレージ`_source`から解析・取得されます。

**利点**：

デフォルトでは、Doris On ESは行ストレージ、つまり`_source`から必要なすべての列を取得します。`_source`ストレージは行ベース + JSON形式を使用しており、特に少数の列のみが必要な場合、カラムナーストレージと比較してバッチ読み取りパフォーマンスが劣ります。少数の列のみが必要な場合、docvalueのパフォーマンスは\_sourceのパフォーマンスの約10倍優れています。

**注意事項**：

1. `text`タイプのフィールドはESにカラムナーストレージを持たないため、取得対象フィールド値のいずれかが`text`タイプの場合、自動的に`_source`からの取得に降格します。

2. 取得するフィールド数が多すぎる場合（`>= 25`）、`docvalue`からフィールド値を取得するパフォーマンスは基本的に`_source`からフィールド値を取得するパフォーマンスと同じになります。

3. `keyword`タイプのフィールドは、この制限を超える長いテキストフィールドに対する[`ignore_above`](https://www.elastic.co/guide/en/elasticsearch/reference/current/keyword.html#keyword-params)パラメータの制限により空になることがあります。この場合、`enable_docvalue_scan`を無効にして`_source`から結果を取得する必要があります。

### Keyword Typeフィールドの検出

`"enable_keyword_sniff" = "true"`を設定

ESでは、インデックスを作成せずに直接データをインポートできます。この場合、ESは自動的に新しいインデックスを作成します。文字列タイプのフィールドについて、ESは`text`タイプと`keyword`タイプの両方を持つフィールドを作成します。これはESのmulti fields機能で、マッピングは以下のようになります：

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
ES query DSLに変換:

```json
"term" : {
    "k4": "Doris On ES"

}
```
k4の最初のフィールドタイプが`text`であるため、データインポート時にk4の設定されたtokenizer（設定されていない場合は標準tokenizer）に従ってトークン化され、ES analyze APIで解析されるように3つのTerms（doris、on、es）が取得されます：

```json
POST /_analyze
{
  "analyzer": "standard",
  "text": "Doris On ES"
}
```
トークン化の結果は以下の通りです：

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
クエリは以下を使用します：

```json
"term" : {
    "k4": "Doris On ES"
}
```
`Doris On ES`という用語は辞書内のどの用語とも一致せず、結果を返しません。`enable_keyword_sniff: true`を有効にすると、SQLセマンティクスに完全に一致するよう`k4 = "Doris On ES"`を`k4.keyword = "Doris On ES"`に自動的に変換します。変換されたESクエリDSLは以下の通りです：

```json
"term" : {
    "k4.keyword": "Doris On ES"
}
```
`k4.keyword`タイプは`keyword`であり、データは完全な項として ES に書き込まれるため、一致させることができます。

### ノード自動検出の有効化 (nodes\_discovery=true)

`"nodes_discovery" = "true"`を設定

trueに設定すると、DorisはESから利用可能なすべての関連データノード（上記で割り当てられたシャード）を検出します。ESデータノードアドレスがDoris BEからアクセス可能でない場合は、falseに設定してください。ESクラスターはパブリックインターネットから隔離されたイントラネット内にデプロイされ、ユーザーはプロキシ経由でアクセスします。

### ESクラスターがHTTPSアクセスモードを有効にしているかどうか

`"ssl" = "true"`を設定

現在のFE/BE実装はtrust allであり、これは一時的な解決策で、後で実際のユーザー設定証明書が使用されます。

### 拡張esquery()関数

`esquery(field, QueryDSL)`関数を使用して、SQLで表現できない一部のクエリ（`match_phrase`、`geoshape`など）をESにプッシュダウンしてフィルタリングを行います。`esquery`の最初の列名パラメータは`index`を関連付けるために使用され、2番目のパラメータは波括弧`{}`で囲まれたESの基本的な`Query DSL`のJSON表現です。JSON`root key`は`match_phrase`、`geo_shape`、`bool`などのように、1つだけ存在する必要があります。

`match_phrase`クエリ:

```sql
select * from es_table where esquery(k4, '{
        "match_phrase": {
           "k4": "doris on es"
        }
    }');
```
`geo`関連のクエリ：

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
`bool`クエリ：

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
### Time Type Field使用推奨事項

ES外部Tableにのみ適用されます。ES Catalogでは、date型は自動的にDateまたはDatetimeにマッピングされます。

ESでは、time型フィールドは非常に柔軟に使用できますが、ES外部Tableにおいて、time型フィールドが適切に設定されていない場合、フィルター条件をプッシュダウンできません。

インデックスを作成する際は、最大限のフォーマット互換性のためにtime型フォーマットを設定してください：

```json
 "dt": {
     "type": "date",
     "format": "yyyy-MM-dd HH:mm:ss||yyyy-MM-dd||epoch_millis"
 }
```
Dorisでこのフィールドを設定する際は、`date`または`datetime`に設定することを推奨します。または`varchar`型として設定することも可能です。以下のSQL文を使用することで、フィルタ条件を直接ESにプッシュダウンできます：

```sql
select * from doe where k2 > '2020-06-21';

select * from doe where k2 < '2020-06-21 12:00:00'; 

select * from doe where k2 < 1593497011; 

select * from doe where k2 < now();

select * from doe where k2 < date_format(now(), '%Y-%m-%d');
```
**Note**:

* ESで時間型フィールドに`format`を設定しない場合、デフォルトの時間型フィールドフォーマットは以下のとおりです：

  ```sql
  strict_date_optional_time||epoch_millis
  ```
* ESにインポートされる日付フィールドがタイムスタンプの場合、`ms`に変換する必要があります。ESは内部的にタイムスタンプを`ms`で処理するため、そうしないとES外部Tableで表示エラーが発生します。

### ESメタデータフィールドIDの取得

`_id`を指定せずにドキュメントをインポートする場合、ESは各ドキュメントにグローバルに一意な`_id`（主キー）を割り当てます。ユーザーは、インポート時に特別なビジネス意味を持つ`_id`を指定することもできます。

ES外部Tableでこのフィールド値を取得する必要がある場合、Table作成時に`varchar`型の`_id`フィールドを追加できます：

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

1. `_id`フィールドのフィルタ条件は`=`と`in`のみサポートします。

2. `_id`フィールドは`varchar`型である必要があります。

### グローバルに順序付けられたクエリ結果の取得

関連性ランキングや重要なコンテンツの優先表示などのシナリオでは、ESクエリ結果がスコアによってソートされることは非常に有用です。DorisはESにクエリを実行する際、ESインデックスのshard分散に従ってデータを取得することでMPPアーキテクチャの利点を最大限に活用します。
グローバルに順序付けられたソート結果を取得するには、ESを単一ポイントからクエリする必要があります。これはセッション変数`enable_es_parallel_scroll`（デフォルトはtrue）で制御できます。
`enable_es_parallel_scroll=false`が設定された場合、Dorisは`shard_preference`と`sort`情報なしで`scroll`クエリをESクラスタに送信し、グローバルに順序付けられた結果を取得します。
注意：クエリ結果セットが大きい場合は注意して使用してください。

### scrollリクエストのバッチサイズの変更

`scroll`リクエストのデフォルトの`batch`サイズは4064です。セッション変数`batch_size`を通じて変更できます。

## よくある質問

1. **X-Pack認証を使用するESクラスタをサポートしますか？**

   HTTP Basic認証を使用するすべてのESクラスタをサポートします。

2. **一部のクエリがESに直接リクエストするよりもかなり遅い**

   はい、\_count関連クエリなどです。ESは条件を満たすドキュメント数に関するメタデータを内部で直接読み取り、実際のデータをフィルタリングしません。

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
1. FEはTable作成時に指定されたホストにリクエストを送信し、すべてのノードのHTTPポート情報やインデックスのシャード分散情報などを取得します。リクエストが失敗した場合、成功するか完全に失敗するまでホストリストを順次たどります。

2. クエリ実行時、FEが取得したノード情報とインデックスメタデータ情報に基づいてクエリプランが生成され、対応するBEノードに送信されます。

3. BEノードは`proximity principle`に従って、まずローカルにデプロイされたESノードにリクエストを送信します。BEは`HTTP Scroll`メソッドを使用して`_source`または`docvalue`からストリーミングで、ESインデックスの各シャードから並行してデータを取得します。

4. Dorisが計算を完了すると、結果をユーザーに返します。
