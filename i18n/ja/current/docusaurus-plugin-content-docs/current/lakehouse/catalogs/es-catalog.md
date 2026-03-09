---
{
  "title": "Elasticsearchカタログ",
  "language": "ja",
  "description": "ElasticsearchカタログはESメタデータの自動マッピングをサポートするだけでなく、"
}
---
Elasticsearch Catalogは、ESメタデータの自動マッピングをサポートするだけでなく、Dorisの分散クエリ計画機能とES (Elasticsearch)の全文検索機能を組み合わせて、より包括的なOLAP分析ソリューションを提供します：

1. ESにおけるマルチインデックス分散Joinクエリ。

2. DorisとESのテーブル間の結合クエリ（より複雑な全文検索フィルタリング付き）。

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

| パラメータ              | 必須 | デフォルト | 説明                                                                                    |
| ---------------------- | -------- | ------- | ---------------------------------------------------------------------------------------------- |
| `hosts`                | Yes      |         | ESアドレス、単一または複数、もしくはESロードバランサーアドレス                               |
| `user`                 | No       | Empty   | ESユーザー名                                                                                    |
| `password`             | No       | Empty   | 対応するユーザーのパスワード                                                            |
| `doc_value_scan`       | No       | true    | ES/Luceneカラム型ストレージを通じてクエリフィールド値の取得を有効にするかどうか               |
| `keyword_sniff`        | No       | true    | ESで文字列のトークン化タイプのtext.fieldsを検出し、keywordを通じてクエリするかどうか。falseに設定するとトークン化されたコンテンツに基づいてマッチングされます |
| `nodes_discovery`      | No       | true    | ESノード検出を有効にするかどうか、デフォルトはtrue。ネットワーク分離環境では指定されたノードのみに接続するためfalseに設定 |
| `ssl`                  | No       | false   | ESがhttpsアクセスモードを有効にするかどうか、現在fe/beでtrust allとして実装             |
| `mapping_es_id`        | No       | false   | ESインデックスの\_idフィールドをマッピングするかどうか                                                     |
| `like_push_down`       | No       | true    | likeをwildcardに変換してESにプッシュダウンするかどうか、ESのCPU消費を増加させます     |
| `include_hidden_index` | No       | false   | 隠しインデックスを含めるかどうか、デフォルトはfalse                                           |

注意:

1. 認証は現在HTTP Basic認証のみをサポートしており、ユーザーが`/_cluster/state/`、`_nodes/http`などのパスとインデックス読み取り権限へのアクセス権を持っていることを確認する必要があります。クラスターセキュリティ認証が有効でない場合、ユーザー名とパスワードは不要です。

2. 5.xおよび6.xバージョンでは、1つのIndexに複数のタイプがある場合、デフォルトで最初のタイプが取得されます。

## 階層マッピング

ElasticsearchにはDatabaseの概念がないため、ESに接続後、自動的に一意のDatabaseが生成されます: `default_db`。

SWITCHコマンドを使用してES Catalogに切り替えた後、自動的に`default_db`に切り替わります。`USE default_db`コマンドを実行する必要はありません。

## カラム型マッピング

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
| date              | date        | `default`/`yyyy-MM-dd HH:mm:ss`/`yyyy-MM-dd`/`epoch_millis`形式のみサポート           |
| keyword           | string      |                                                                                                |
| text              | string      |                                                                                                |
| ip                | string      |                                                                                                |
| constant\_keyword | string      |                                                                                                |
| wildcard          | string      |                                                                                                |
| nested            | json        |                                                                                                |
| object            | json        |                                                                                                |
| flattened         | json        | バージョン3.1.4、4.0.3以降でサポート                                                         |
| other             | UNSUPPORTED |                                                                                                |

### 配列型

Elasticsearchには明示的な配列型はありませんが、そのフィールドは[0個以上の値](https://www.elastic.co/guide/en/elasticsearch/reference/current/array.html)を含むことができます。

フィールドが配列型であることを示すには、インデックスマッピングの[\_meta](https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping-meta-field.html)セクションに特定の`doris`構造アノテーションを追加できます。

Elasticsearch 6.x以前のバージョンについては、[\_meta](https://www.elastic.co/guide/en/elasticsearch/reference/6.8/mapping-meta-field.html)を参照してください。

例えば、以下のデータ構造を含む`doc`というインデックスがあるとします:

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
この構造体の配列フィールドは、以下のコマンドを使用して、対象インデックスマッピングの`_meta.doris`プロパティにフィールドプロパティ定義を追加することで定義できます。

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

`flattened`型の場合、`enable_docvalue_scan`プロパティが`false`のとき、読み出されるJSONデータ形式は平坦化されます。`enable_docvalue_scan`プロパティが`true`の場合、元のJSON形式が読み出されます。以下に例を示します：

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
より高度なクエリ機能については、[Best Practices]セクションを参照してください。

## Best Practices

### Filter Predicate Pushdown

ES Catalogはfilter predicate pushdownをサポートしています：フィルター条件がESにプッシュダウンされるため、条件を真に満たすデータのみが返され、クエリパフォーマンスを大幅に向上させ、DorisとElasticsearchのCPU、Memory、IO使用量を削減できます。

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

### Columnar Scanを有効にしてクエリ速度を最適化（enable\_docvalue\_scan=true）

`"enable_docvalue_scan" = "true"`を設定

有効にした後、DorisはESからデータを取得する際に以下の2つの原則に従います：

* **Best Effort**：読み取り対象のフィールドがcolumnar storageを有効にしているか（doc\_value: true）を自動検出します。すべてのフィールドがcolumnar storageを持っている場合、Dorisはcolumnar storageからすべてのフィールド値を取得します。

* **Automatic Degradation**：取得対象のフィールドのいずれかがcolumnar storageを持たない場合、すべてのフィールド値はrow storage `_source`から解析・取得されます。

**利点**：

デフォルトでは、Doris On ESは必要なすべての列をrow storage、即ち`_source`から取得します。`_source`ストレージは行ベース + JSON形式を使用しており、特に少数の列のみが必要な場合において、columnar storageと比較してバッチ読み取りパフォーマンスが劣ります。少数の列のみが必要な場合、docvalueのパフォーマンスは\_sourceのパフォーマンスの約10倍優れています。

**注意点**：

1. `text`タイプのフィールドはESにcolumnar storageを持たないため、取得対象のフィールド値のいずれかが`text`タイプの場合、自動的に`_source`からの取得に劣化します。

2. 取得するフィールド数が多すぎる場合（`>= 25`）、`docvalue`からフィールド値を取得するパフォーマンスは`_source`からフィールド値を取得するパフォーマンスと基本的に同等になります。

3. `keyword`タイプのフィールドは、この制限を超える長いテキストフィールドに対する[`ignore_above`](https://www.elastic.co/guide/en/elasticsearch/reference/current/keyword.html#keyword-params)パラメータの制限により空に表示される場合があります。この場合、`enable_docvalue_scan`を無効にし、`_source`から結果を取得する必要があります。

### Keyword Typeフィールドの検出

`"enable_keyword_sniff" = "true"`を設定

ESでは、インデックスを確立せずに直接データをインポートできます。この場合、ESは自動的に新しいインデックスを作成します。文字列タイプのフィールドについて、ESは`text`タイプと`keyword`タイプの両方を持つフィールドを作成し、これがESのmulti fields機能で、mappingは以下のようになります：

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
ES query DSLに変換されました:

```json
"term" : {
    "k4": "Doris On ES"

}
```
k4の最初のフィールド型が`text`であるため、データインポート時にk4で設定されたtokenizer（設定されていない場合はstandard tokenizer）に従ってトークン化され、ES analyze APIで解析されたとおり、3つのTerms（doris、on、es）が得られます：

```json
POST /_analyze
{
  "analyzer": "standard",
  "text": "Doris On ES"
}
```
トークン化の結果は次のとおりです：

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
`Doris On ES`という用語は辞書内のどの用語とも一致せず、結果を返しません。`enable_keyword_sniff: true`を有効にすると、`k4 = "Doris On ES"`が自動的に`k4.keyword = "Doris On ES"`に変換され、SQLセマンティクスと完全に一致します。変換されたESクエリDSLは以下の通りです：

```json
"term" : {
    "k4.keyword": "Doris On ES"
}
```
`k4.keyword`の型は`keyword`で、データは完全な項目としてESに書き込まれるため、マッチさせることができます。

### Node Auto Discovery の有効化 (nodes\_discovery=true)

`"nodes_discovery" = "true"`を設定

trueに設定すると、DorisはESから利用可能な関連するデータノード（上記で割り当てられたシャード）をすべて検索します。ESデータノードアドレスがDoris BEからアクセスできない場合は、falseに設定してください。ESクラスターは、パブリックインターネットから分離されたイントラネット内にデプロイされ、ユーザーはプロキシ経由でアクセスします。

### ESクラスターでHTTPSアクセスモードが有効かどうか

`"ssl" = "true"`を設定

現在のFE/BE実装はtrust allで、これは一時的な解決策です。実際のユーザー設定証明書が後で使用される予定です。

### 拡張された esquery() 関数

`esquery(field, QueryDSL)`関数を使用して、`match_phrase`、`geoshape`など、SQLで表現できない一部のクエリをESにプッシュダウンしてフィルタリングします。`esquery`の最初の列名パラメータは`index`を関連付けるために使用され、2番目のパラメータはESの基本的な`Query DSL`のJSON表現で、中括弧`{}`で囲みます。JSON`root key`は`match_phrase`、`geo_shape`、`bool`などのように、必ず1つだけ持つ必要があります。

`match_phrase`クエリ:

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
### Time Type Field使用推奨事項

ES外部テーブルにのみ適用されます。ES Catalogでは、日付型は自動的にDateまたはDatetimeにマッピングされます。

ESでは、時間型フィールドは非常に柔軟に使用できますが、ES外部テーブルでは、時間型フィールドが適切に設定されていない場合、フィルタ条件をプッシュダウンできません。

インデックス作成時は、最大限のフォーマット互換性のために時間型フォーマットを設定してください：

```json
 "dt": {
     "type": "date",
     "format": "yyyy-MM-dd HH:mm:ss||yyyy-MM-dd||epoch_millis"
 }
```
Dorisでこのフィールドを設定する際は、`date`または`datetime`として設定するか、`varchar`タイプとして設定することが推奨されます。以下のSQL文を使用することで、フィルター条件を直接ESにプッシュダウンできます：

```sql
select * from doe where k2 > '2020-06-21';

select * from doe where k2 < '2020-06-21 12:00:00'; 

select * from doe where k2 < 1593497011; 

select * from doe where k2 < now();

select * from doe where k2 < date_format(now(), '%Y-%m-%d');
```
**注意**:

* ESで時間型フィールドに`format`を設定しない場合、デフォルトの時間型フィールドフォーマットは以下のとおりです：

  ```sql
  strict_date_optional_time||epoch_millis
  ```
* 日付フィールドがタイムスタンプとしてESにインポートされる場合、`ms`に変換する必要があります。ESは内部的にタイムスタンプを`ms`で処理するため、そうでなければES外部テーブルで表示エラーが発生します。

### ESメタデータフィールドIDの取得

`_id`を指定せずにドキュメントをインポートする場合、ESは各ドキュメントにグローバルにユニークな`_id`（主キー）を割り当てます。ユーザーは、インポート時に特別なビジネス上の意味を持つ`_id`を指定することもできます。

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

1. `_id`フィールドのフィルター条件は`=`と`in`のみサポートしています。

2. `_id`フィールドは`varchar`型である必要があります。

### グローバル順序付きクエリ結果の取得

関連度ランキングや重要コンテンツの優先表示などのシナリオでは、ESクエリ結果をスコアでソートすることが非常に有用です。DorisはESにクエリを実行し、ESインデックスのshard分散に従ってデータをプルすることで、MPPアーキテクチャの利点を最大限に活用します。
グローバル順序付きソート結果を取得するには、ESを単一ポイントからクエリする必要があります。これはセッション変数`enable_es_parallel_scroll`（デフォルトはtrue）で制御できます。
`enable_es_parallel_scroll=false`を設定すると、Dorisは`shard_preference`と`sort`情報なしで`scroll`クエリをESクラスターに送信し、グローバル順序付き結果を取得します。
注意：クエリ結果セットが大きい場合は慎重に使用してください。

### scrollリクエストバッチサイズの変更

`scroll`リクエストのデフォルト`batch`サイズは4064です。セッション変数`batch_size`を通じて変更できます。

## よくある質問

1. **X-Pack認証を使用するESクラスターをサポートしていますか？**

   HTTP Basic認証を使用するすべてのESクラスターをサポートしています。

2. **一部のクエリがESに直接リクエストするよりもはるかに遅い**

   はい、\_count関連クエリなどです。ESは内部的に条件を満たすドキュメント数に関連するメタデータを直接読み取り、実際のデータをフィルタリングしません。

3. **集約操作をプッシュダウンできますか？**

   現在、Doris On ESはsum、avg、min/maxなどの集約操作のプッシュダウンをサポートしていません。計算方法は、条件を満たすすべてのドキュメントをESからバッチストリーミングし、Dorisで計算することです。

## 付録

### DorisがESにクエリする原理

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
1. FEはテーブル作成時に指定されたホストに対してリクエストを送信し、全ノードのHTTPポート情報やインデックスのシャード分散情報などを取得します。リクエストが失敗した場合、成功するか完全に失敗するまでホストリストを順次走査します。

2. クエリ実行時、FEが取得したノード情報とインデックスメタデータ情報に基づいてクエリプランが生成され、対応するBEノードに送信されます。

3. BEノードは`proximity principle`に従って、まずローカルにデプロイされたESノードにリクエストを送信します。BEは`HTTP Scroll`メソッドストリーミングを通じて`_source`または`docvalue`からESインデックスの各シャードから並行してデータを取得します。

4. Dorisが計算を完了すると、結果をユーザーに返します。
