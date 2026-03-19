---
{
  "title": "Elasticsearch カタログ",
  "language": "ja",
  "description": "Elasticsearchカタログは、ESメタデータの自動マッピングをサポートするだけでなく、"
}
---
Elasticsearch Catalogは、ESメタデータの自動マッピングをサポートするだけでなく、Dorisの分散クエリ計画機能とES (Elasticsearch)の全文検索機能を組み合わせて、より包括的なOLAP分析ソリューションを提供します：

1. ESでのマルチインデックス分散Joinクエリ。

2. DorisとESのテーブル間での結合クエリ。より複雑な全文検索フィルタリングが可能。

## 前提条件

Elasticsearch 5.x以降をサポートします。

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
| `hosts`                | はい      |         | ESアドレス、単一または複数、またはESロードバランサーアドレスが可能                               |
| `user`                 | いいえ       | 空   | ESユーザー名                                                                                    |
| `password`             | いいえ       | 空   | 対応するユーザーのパスワード                                                            |
| `doc_value_scan`       | いいえ       | true    | ES/Luceneの列指向ストレージを通じてクエリフィールド値の取得を有効にするかどうか               |
| `keyword_sniff`        | いいえ       | true    | ESの文字列トークン化タイプに対してtext.fieldsを検出し、keywordを通じてクエリするかどうか。falseに設定するとトークン化されたコンテンツに基づいてマッチングされます |
| `nodes_discovery`      | いいえ       | true    | ESノード検出を有効にするかどうか、デフォルトはtrueです。ネットワーク分離環境では、指定されたノードのみに接続するためにfalseに設定してください |
| `ssl`                  | いいえ       | false   | ESがhttpsアクセスモードを有効にするかどうか、現在fe/beでtrust allとして実装されています             |
| `mapping_es_id`        | いいえ       | false   | ESインデックスの\_idフィールドをマッピングするかどうか                                                     |
| `like_push_down`       | いいえ       | true    | likeをwildcardに変換してESにプッシュダウンするかどうか、ESのCPU消費が増加します     |
| `include_hidden_index` | いいえ       | false   | 隠しインデックスを含めるかどうか、デフォルトはfalseです                                           |

注意事項：

1. 認証は現在HTTP Basic認証のみをサポートしており、ユーザーが`/_cluster/state/`、`_nodes/http`などのパスへのアクセス権限とIndexの読み取り権限を持つことを確認する必要があります。クラスターセキュリティ認証が有効でない場合、ユーザー名とパスワードは不要です。

2. 5.xおよび6.xバージョンでは、1つのIndexに複数のタイプがある場合、デフォルトで最初のタイプが取得されます。

## 階層マッピング

ElasticsearchにはDatabaseの概念がないため、ESに接続後、一意のDatabaseが自動的に生成されます：`default_db`。

SWITCHコマンドを使用してES Catalogに切り替えた後、自動的に`default_db`に切り替わるため、`USE default_db`コマンドを実行する必要はありません。

## カラムタイプマッピング

| ESタイプ           | Dorisタイプ  | コメント                                                                                        |
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
| date              | date        | `default`/`yyyy-MM-dd HH:mm:ss`/`yyyy-MM-dd`/`epoch_millis`形式のみをサポートします           |
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

フィールドが配列タイプであることを示すには、インデックスマッピングの[\_meta](https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping-meta-field.html)セクションで特定の`doris`構造アノテーションを追加できます。

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
`array_fields`: 配列型であるフィールドを示すために使用されます。

### flattened型

`flattened`型の場合、`enable_docvalue_scan`プロパティが`false`の時、読み出されるJSONデータ形式はフラット化されます。`enable_docvalue_scan`プロパティが`true`の場合、元のJSON形式で読み出されます。以下に例を示します：

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
データ：

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

   `extra`列のクエリ結果は次のとおりです:

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

ES Catalogはfilter predicate pushdownをサポートします：フィルタ条件がESにプッシュダウンされるため、条件を真に満たすデータのみが返されます。これによりクエリパフォーマンスを大幅に向上させ、DorisとElasticsearchのCPU、Memory、IO使用量を削減できます。

以下のオペレータは対応するES Queryに最適化されます：

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

有効にした後、DorisはESからデータを取得する際に以下の2つの原則に従います：

* **Best Effort**: 読み取り対象のフィールドがcolumnar storage（doc\_value: true）を有効にしているかを自動検出します。すべてのフィールドがcolumnar storageを持っている場合、Dorisはcolumnar storageからすべてのフィールド値を取得します。

* **Automatic Degradation**: 取得対象のフィールドのいずれかがcolumnar storageを持たない場合、すべてのフィールド値がrow storage `_source`から解析・取得されます。

**利点**：

デフォルトでは、Doris On ESはrow storageつまり`_source`から必要なすべての列を取得します。`_source`storageは行ベース + JSON形式を使用するため、特に少数の列のみが必要な場合、columnar storageと比較してバッチ読み込みパフォーマンスが劣ります。少数の列のみが必要な場合、docvalueのパフォーマンスは\_sourceのパフォーマンスより約10倍優秀です。

**注意事項**：

1. `text`タイプのフィールドはESでcolumnar storageを持たないため、取得対象のフィールド値のいずれかが`text`タイプの場合、自動的に`_source`からの取得に降格されます。

2. 取得するフィールド数が多すぎる場合（`>= 25`）、`docvalue`からフィールド値を取得するパフォーマンスは`_source`からフィールド値を取得するパフォーマンスと基本的に同じになります。

3. `keyword`タイプのフィールドは、この制限を超える長いテキストフィールドに対する[`ignore_above`](https://www.elastic.co/guide/en/elasticsearch/reference/current/keyword.html#keyword-params)パラメータ制限により空に見える場合があります。この場合、`enable_docvalue_scan`を無効にして`_source`から結果を取得する必要があります。

### Keyword Type Fieldsの検出

`"enable_keyword_sniff" = "true"`を設定

ESでは、インデックスを確立せずに直接データをインポートできます。この場合、ESは自動的に新しいインデックスを作成します。文字列タイプのフィールドに対して、ESは`text`タイプと`keyword`タイプの両方を持つフィールドを作成します。これはESのmulti fields機能で、マッピングは以下のとおりです：

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
k4でフィルタリングする際、=のような場合、Doris On ESはクエリをESのTermQueryに変換します。

SQLフィルタ条件:

```sql
k4 = "Doris On ES"
```
ES query DSLに変換済み:

```json
"term" : {
    "k4": "Doris On ES"

}
```
k4の最初のフィールドタイプが`text`であるため、データインポート時にk4で設定されたtokenizer（設定されていない場合は、standard tokenizer）に従ってトークン化され、ES analyze APIで解析される通り、doris、on、esという3つのTermsが取得されます：

```json
POST /_analyze
{
  "analyzer": "standard",
  "text": "Doris On ES"
}
```
トークン化の結果は次の通りです:

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
`k4.keyword`タイプは`keyword`で、データは完全なタームとしてESに書き込まれるため、マッチが可能です。

### Node Auto Discoveryを有効にする（nodes\_discovery=true）

`"nodes_discovery" = "true"`を設定

trueに設定すると、DorisはESから利用可能なすべての関連データノード（上記で割り当てられたシャード）を見つけます。ESデータノードアドレスがDoris BEからアクセスできない場合は、falseに設定してください。ESクラスターがパブリックインターネットから分離されたイントラネットにデプロイされており、ユーザーがプロキシ経由でアクセスする場合です。

### ESクラスターでHTTPSアクセスモードが有効かどうか

`"ssl" = "true"`を設定

現在のFE/BE実装はtrust allであり、これは一時的な解決策です。後で実際のユーザー設定証明書が使用される予定です。

### 拡張esquery()関数

`esquery(field, QueryDSL)`関数を使用して、`match_phrase`、`geoshape`など、SQLで表現できない一部のクエリをESにプッシュダウンしてフィルタリングします。`esquery`の最初の列名パラメータは`index`との関連付けに使用され、2番目のパラメータはESの基本的な`Query DSL`のJSON表現で、中括弧`{}`で囲まれます。JSON`root key`は1つだけ存在する必要があり、`match_phrase`、`geo_shape`、`bool`などがあります。

`match_phrase`クエリ：

```sql
select * from es_table where esquery(k4, '{
        "match_phrase": {
           "k4": "doris on es"
        }
    }');
```
`geo`関連クエリ：

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

インデックス作成時に、最大限のフォーマット互換性のために時間型フォーマットを設定してください：

```json
 "dt": {
     "type": "date",
     "format": "yyyy-MM-dd HH:mm:ss||yyyy-MM-dd||epoch_millis"
 }
```
Dorisでこのフィールドを設定する際は、`date`または`datetime`として設定するか、`varchar`型として設定することを推奨します。以下のSQL文を使用することで、フィルタ条件を直接ESにプッシュダウンできます：

```sql
select * from doe where k2 > '2020-06-21';

select * from doe where k2 < '2020-06-21 12:00:00'; 

select * from doe where k2 < 1593497011; 

select * from doe where k2 < now();

select * from doe where k2 < date_format(now(), '%Y-%m-%d');
```
**注意**:

* ESで時刻型フィールドに`format`を設定しない場合、デフォルトの時刻型フィールドフォーマットは以下の通りです：

  ```sql
  strict_date_optional_time||epoch_millis
  ```
* 日付フィールドがタイムスタンプとしてESにインポートされる場合、`ms`に変換する必要があります。ESは内部的にタイムスタンプを`ms`で処理するため、そうでなければES外部テーブルで表示エラーが発生します。

### ESメタデータフィールドIDの取得

`_id`を指定せずにドキュメントをインポートする場合、ESは各ドキュメントにグローバルに一意な`_id`（主キー）を割り当てます。ユーザーはインポート時に特別なビジネス的意味を持つ`_id`を指定することも可能です。

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

1. `_id`フィールドのフィルタ条件は`=`と`in`のみサポートしています。

2. `_id`フィールドは`varchar`型である必要があります。

### グローバル順序付きクエリ結果の取得

関連度ランキングや重要なコンテンツの優先表示などのシナリオでは、ESクエリ結果がスコアによってソートされることが非常に有用です。DorisはESにクエリを実行し、ESインデックスのshard分散に応じてデータを取得することで、MPPアーキテクチャの利点を最大限に活用します。
グローバル順序付きソート結果を取得するには、ESを単一ポイントからクエリする必要があります。これはセッション変数`enable_es_parallel_scroll`（デフォルトはtrue）で制御できます。
`enable_es_parallel_scroll=false`が設定された場合、Dorisは`shard_preference`と`sort`情報なしで`scroll`クエリをESクラスターに送信し、グローバル順序付き結果を取得します。
注意: クエリ結果セットが大きい場合は慎重に使用してください。

### scrollリクエストのbatchサイズの変更

`scroll`リクエストのデフォルト`batch`サイズは4064です。セッション変数`batch_size`で変更できます。

## よくある質問

1. **X-Pack認証を使用するESクラスターはサポートされていますか？**

   HTTP Basic認証を使用するすべてのESクラスターをサポートしています。

2. **一部のクエリがESに直接リクエストするよりもかなり遅い**

   はい、\_count関連クエリなどです。ESは条件を満たすドキュメント数に関連するメタデータを内部で直接読み取り、実際のデータをフィルタリングしません。

3. **集計操作をプッシュダウンできますか？**

   現在Doris On ESは、sum、avg、min/maxなどの集計操作のプッシュダウンをサポートしていません。計算方法は、条件を満たすすべてのドキュメントをESからバッチストリーミングし、Dorisで計算することです。

## 付録

### DorisによるESクエリの原理

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
1. FEは、テーブル作成時に指定されたホストに対してリクエストを送信し、すべてのノードのHTTPポート情報やインデックスのシャード分散情報などを取得します。リクエストが失敗した場合、成功するか完全に失敗するまで、ホストリストを順次走査します。

2. クエリ実行時、FEが取得したいくつかのノード情報とインデックスメタデータ情報に基づいて、クエリプランが生成され、対応するBEノードに送信されます。

3. BEノードは`proximity principle`に従って、まずローカルにデプロイされたESノードにリクエストを送信します。BEは`HTTP Scroll`メソッドを使用して、`_source`または`docvalue`からストリーミング方式でESインデックスの各シャードから並行してデータを取得します。

4. Dorisが計算を完了した後、結果をユーザーに返します。
