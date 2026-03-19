---
{
  "title": "CREATE ROUTINE LOAD",
  "description": "Routine Load機能により、ユーザーは指定されたデータソースから継続的にデータを読み取り、それを",
  "language": "ja"
}
---
## 説明

Routine Load機能により、ユーザーは指定されたデータソースから継続的にデータを読み取り、Dorisにインポートする常駐インポートタスクを送信できます。

現在、認証なしまたはSSL認証方式を通じて、KafkaからCSVまたはJson形式のデータのインポートのみをサポートしています。Json形式データのインポート例

## 構文

```sql
CREATE ROUTINE LOAD [<db>.]<job_name> [ON <tbl_name>]
[<merge_type>]
[<load_properties>]
[<job_properties>]
FROM <data_source> [<data_source_properties>]
[COMMENT "<comment>"]
```
## 必須パラメータ

**1. `[<db>.]<job_name>`**

> インポートジョブの名前。同一データベース内では、同じ名前のジョブは1つのみ実行可能です。

**2. `FROM <data_source>`**

> データソースのタイプ。現在サポート：KAFKA

**3. `<data_source_properties>`**

> 1. `<kafka_broker_list>`
>
>    Kafkaブローカーの接続情報。フォーマットはip:hostです。複数のブローカーはカンマで区切ります。
>    
>    ```text
>    "kafka_broker_list" = "broker1:9092,broker2:9092"
>    ```
>
> 2. `<kafka_topic>`
>
>    購読するKafkaトピックを指定します。
>    ```text
>    "kafka_topic" = "my_topic"
>    ```

## オプションパラメータ

**1. `<tbl_name>`**

> インポート先のTable名を指定します。これはオプションパラメータです。指定しない場合は動的Table方式が使用され、Kafka内のデータにTable名情報が含まれている必要があります。
>
> 現在はKafkaのValueからTable名を取得することのみをサポートし、次の形式に従う必要があります：json例：`table_name|{"col1": "val1", "col2": "val2"}`、
> ここで`tbl_name`はTable名で、`|`がTable名とTableデータの区切り文字です。
>
> csvフォーマットデータの場合も同様です：`table_name|val1,val2,val3`。ここで`table_name`はDorisのTable名と一致する必要があり、そうでないとインポートが失敗します。
>
> ヒント：動的Tableでは`columns_mapping`パラメータはサポートされていません。Table構造がDorisのTable構造と一致し、大量のTable情報をインポートする場合、この方法が最適な選択となります。

**2. `<merge_type>`**

> データマージタイプ。デフォルトはAPPENDで、インポートされるデータは通常の追記書き込み操作を意味します。MERGEとDELETEタイプはUnique KeyモデルTableでのみ使用可能です。MERGEタイプは[DELETE ON]文と組み合わせてDelete Flagカラムをマークする必要があります。DELETEタイプは、インポートされるすべてのデータが削除データであることを意味します。
>
> ヒント：動的複数Tableを使用する場合、このパラメータは各動的Tableのタイプと一致する必要があり、そうでないとインポートが失敗します。

**3. `<load_properties>`**

> インポートされるデータを記述するために使用されます。構成は以下の通りです：
>
> ```SQL
> [column_separator],
> [columns_mapping],
> [preceding_filter],
> [where_predicates],
> [partitions],
> [DELETE ON],
> [ORDER BY]
> ```
>
> 1. `<column_separator>`
>
>    カラム区切り文字を指定します。デフォルトは`\t`です
>
>    `COLUMNS TERMINATED BY ","`
>
> 2. `<columns_mapping>`
>
>    ファイルのカラムとTableのカラム間のマッピング関係、および各種カラム変換を指定するために使用されます。この部分の詳細な説明については、[Column Mapping, Transformation and Filtering]ドキュメントを参照してください。
>
>    `(k1, k2, tmpk1, k3 = tmpk1 + 1)`
>
>    ヒント：動的Tableではこのパラメータはサポートされていません。
>
> 3. `<preceding_filter>`
>
>    生データをフィルタします。この部分の詳細な情報については、[Column Mapping, Transformation and Filtering]ドキュメントを参照してください。
>
>    `WHERE k1 > 100 and k2 = 1000`
>
>    ヒント：動的Tableではこのパラメータはサポートされていません。
>
> 4. `<where_predicates>`
>
>    条件に基づいてインポートデータをフィルタします。この部分の詳細な情報については、[Column Mapping, Transformation and Filtering]ドキュメントを参照してください。
>
>    `WHERE k1 > 100 and k2 = 1000`
>
>    ヒント：動的複数Tableを使用する場合、このパラメータは各動的Tableのカラムと一致する必要があり、そうでないとインポートが失敗します。動的複数Tableを使用する場合、共通の公開カラムに対してのみこのパラメータの使用を推奨します。
>
> 5. `<partitions>`
>
>    インポート先の宛先Tableのどのパーティションにインポートするかを指定します。指定しない場合、データは自動的に対応するパーティションにインポートされます。
>
>    `PARTITION(p1, p2, p3)`
>
>    ヒント：動的複数Tableを使用する場合、このパラメータは各動的Tableと一致する必要があり、そうでないとインポートが失敗します。
>
> 6. `<DELETE ON>`
>
>    MERGEインポートモードと組み合わせて使用する必要があり、Unique KeyモデルTableにのみ適用されます。インポートデータ内のDelete Flagカラムと計算関係を指定するために使用されます。
>
>    `DELETE ON v3 >100`
>
>    ヒント：動的複数Tableを使用する場合、このパラメータは各動的Tableと一致する必要があり、そうでないとインポートが失敗します。
>
> 7. `<ORDER BY>`
>
>    Unique KeyモデルTableにのみ適用されます。インポートデータ内のSequence Colカラムを指定するために使用されます。主にインポート時のデータ順序を保証するために使用されます。
>
>    ヒント：動的複数Tableを使用する場合、このパラメータは各動的Tableと一致する必要があり、そうでないとインポートが失敗します。

**4. `<job_properties>`**

> 定期インポートジョブの一般的なパラメータを指定するために使用されます。
>
>    ```text
>    PROPERTIES (
>        "key1" = "val1",
>        "key2" = "val2"
>    )
>    ```
>
> 現在、以下のパラメータをサポートしています：
>
> 1. `<desired_concurrent_number>`
>
>     希望同時実行数。定期インポートジョブは複数のサブタスクに分割されて実行されます。このパラメータは、1つのジョブで同時に実行できるタスクの数を指定します。0より大きい値である必要があります。デフォルトは5です。
>
>    この同時実行数は実際の同時実行数ではありません。実際の同時実行数は、クラスタノード数、負荷状況、およびデータソース条件を考慮して決定されます。
>
>    `"desired_concurrent_number" = "3"`
>
> 2. `<max_batch_interval>/<max_batch_rows>/<max_batch_size>`
>
>    これらの3つのパラメータは以下を表します：
>
>     1. 各サブタスクの最大実行時間（秒単位）。1以上である必要があります。デフォルトは10です。
>     2. 各サブタスクで読み取る最大行数。200000以上である必要があります。デフォルトは20000000です。
>     3. 各サブタスクで読み取る最大バイト数。単位はバイトで、範囲は100MBから10GBです。デフォルトは1Gです。
>
>     これらの3つのパラメータは、サブタスクの実行時間と処理量を制御するために使用されます。いずれかが閾値に達すると、タスクが終了します。
>
>     ```text
>     "max_batch_interval" = "20",
>     "max_batch_rows" = "300000",
>     "max_batch_size" = "209715200"
>     ```
>
> 3. `<max_error_number>`
>
>     サンプリングウィンドウ内で許可される最大エラー行数。0以上である必要があります。デフォルトは0で、エラー行が許可されないことを意味します。
>
>     サンプリングウィンドウは`max_batch_rows * 10`です。サンプリングウィンドウ内のエラー行数が`max_error_number`を超える場合、定期ジョブは一時停止され、データ品質問題をチェックするための手動介入が必要になります。
>
>     where条件でフィルタされた行はエラー行としてカウントされません。
>
> 4. `<strict_mode>`
>
>     厳密モードを有効にするかどうか。デフォルトはオフです。有効にした場合、非null元データのカラムタイプ変換でNULLになった場合、フィルタされます。指定方法：
>
>     `"strict_mode" = "true"`
>
>     厳密モードとは：インポートプロセス中のカラムタイプ変換を厳密にフィルタすることです。厳密フィルタ戦略は以下の通りです：
>
>     1. カラムタイプ変換について、厳密モードがtrueの場合、エラーのあるデータがフィルタされます。ここでのエラーデータとは：nullでない元データがカラムタイプ変換後にnull値になるデータを指します。
>     2. インポート時の関数変換で生成されるカラムについては、厳密モードは効果がありません。
>     3. 範囲制限があるカラムについて、元データがタイプ変換を通過できるが範囲制限を通過できない場合、厳密モードは効果がありません。例：タイプがdecimal(1,0)で元データが10の場合、タイプ変換は通過できますがカラムの宣言範囲を超えています。厳密モードはそのようなデータに対して効果がありません。
>
>     **厳密モードとソースデータインポートの関係**
>
>     TinyIntカラムタイプを使用した例
>
>     注：Table内のカラムがnull値を許可する場合
>
>     | source data | source data example | string to int | strict_mode   | result                 |
>     | ----------- | ------------------- | ------------- | ------------- | ---------------------- |
>     | null        | `\N`               | N/A           | true or false | NULL                   |
>     | not null    | aaa or 2000        | NULL          | true          | invalid data(filtered) |
>     | not null    | aaa                | NULL          | false         | NULL                   |
>     | not null    | 1                  | 1             | true or false | correct data           |
>
>     Decimal(1,0)カラムタイプを使用した例
>
>     注：Table内のカラムがnull値を許可する場合
>
>     | source data | source data example | string to int | strict_mode   | result                 |
>     | ----------- | ------------------- | ------------- | ------------- | ---------------------- |
>     | null        | `\N`               | N/A           | true or false | NULL                   |
>     | not null    | aaa                | NULL          | true          | invalid data(filtered) |
>     | not null    | aaa                | NULL          | false         | NULL                   |
>     | not null    | 1 or 10            | 1             | true or false | correct data           |
>
>     注：10は範囲を超える値ですが、そのタイプがdecimalの要件を満たしているため、厳密モードは効果がありません。10は最終的に他のETL処理フローでフィルタされますが、厳密モードではフィルタされません。
>
> 5. `<timezone>`
>
>     インポートジョブで使用するタイムゾーンを指定します。デフォルトはSessionのtimezoneパラメータです。このパラメータはインポートに関わるすべてのタイムゾーン関連関数の結果に影響します。
>
>     `"timezone" = "Asia/Shanghai"`
>
> 6. `<format>`
>
>     インポートデータフォーマットを指定します。デフォルトはcsvで、jsonフォーマットがサポートされています。
>
>     `"format" = "json"`
>
> 7. `<jsonpaths>`
>
>     jsonフォーマットデータをインポートする際、jsonpathsを使用してJsonデータから抽出するフィールドを指定できます。
>
>     `-H "jsonpaths: [\"$.k2\", \"$.k1\"]"`
>
> 8. `<strip_outer_array>`
>
>     jsonフォーマットデータをインポートする際、strip_outer_arrayをtrueに設定すると、Jsonデータが配列として表現され、データ内の各要素が1行として扱われることを示します。デフォルト値はfalseです。
>
>     `-H "strip_outer_array: true"`
>
> 9. `<json_root>`
>
>     jsonフォーマットデータをインポートする際、json_rootを使用してJsonデータのルートノードを指定できます。Dorisはjson_rootを通じてルートノードから抽出された要素を解析します。デフォルトは空です。
>
>     `-H "json_root: $.RECORDS"`
>  
> 10. `<send_batch_parallelism>`
>
>     整数型。バッチデータの送信並列度を設定するために使用されます。並列度の値がBE設定の`max_send_batch_parallelism_per_job`を超える場合、調整ポイントとして機能するBEは`max_send_batch_parallelism_per_job`の値を使用します。
>
>     `"send_batch_parallelism" = "10"`
>
> 11. `<load_to_single_tablet>`
>
>     ブール型。trueは1つのタスクが対応するパーティションの1つのtabletにのみデータをインポートすることをサポートすることを示します。デフォルト値はfalseです。このパラメータはrandom bucketingを持つolapTableにデータをインポートする場合にのみ設定が許可されます。
>
>     `"load_to_single_tablet" = "true"`
>
> 12. `<partial_columns>`
>
>     ブール型。trueは部分カラム更新の使用を示します。デフォルト値はfalseです。このパラメータは、TableモデルがUniqueでMerge on Writeを使用する場合にのみ設定が許可されます。動的複数Tableではこのパラメータはサポートされません。
>
>     `"partial_columns" = "true"`
>
> 13. `<max_filter_ratio>`
>
>     サンプリングウィンドウ内で許可される最大フィルタ比率。0以上1以下である必要があります。デフォルト値は0です。
>
>     サンプリングウィンドウは`max_batch_rows * 10`です。サンプリングウィンドウ内で、エラー行/総行数が`max_filter_ratio`を超える場合、定期ジョブは一時停止され、データ品質問題をチェックするための手動介入が必要になります。
>
>     where条件でフィルタされた行はエラー行としてカウントされません。
>
> 14. `<enclose>`
>
>     囲み文字。csvデータフィールドに行または列区切り文字が含まれる場合、偶発的な切り捨てを防ぐため、単一バイト文字を囲み文字として保護用に指定できます。例えば、列区切り文字が","で囲み文字が"'"の場合、データ"a,'b,c'"に対して"b,c"が1つのフィールドとして解析されます。
>
>     注：encloseが`"`に設定された場合、trim_double_quotesをtrueに設定する必要があります。
>
> 15. `<escape>`
>
>     エスケープ文字。csvフィールド内で囲み文字と同じ文字をエスケープするために使用されます。例えば、データが"a,'b,'c'"、囲み文字が"'"で、"b,'c"を1つのフィールドとして解析したい場合、`\`などの単一バイトエスケープ文字を指定し、データを`a,'b,\'c'`に変更する必要があります。

**5. `data_source_properties`のオプションプロパティ**

> 1. `<kafka_partitions>/<kafka_offsets>`
>
>     購読するkafkaパーティションと各パーティションの開始オフセットを指定します。時間が指定された場合、その時間以上の最も近いオフセットから消費が開始されます。
>
>     offsetは0以上の特定のオフセットまたは以下のように指定できます：
>
>     - `OFFSET_BEGINNING`：データが存在する場所から購読を開始
>     - `OFFSET_END`：終端から購読を開始
>     - 時間フォーマット、例："2021-05-22 11:00:00"
>
>     指定しない場合、デフォルトで`OFFSET_END`からトピック下のすべてのパーティションを購読します。
>
>     ```text
>     "kafka_partitions" = "0,1,2,3",
>     "kafka_offsets" = "101,0,OFFSET_BEGINNING,OFFSET_END"
>     ```
>
>     ```text
>     "kafka_partitions" = "0,1,2,3",
>     "kafka_offsets" = "2021-05-22 11:00:00,2021-05-22 11:00:00,2021-05-22 11:00:00"
>     ```
>
>    注：時間フォーマットとOFFSETフォーマットを混在させることはできません。
>
> 2. `<property>`
>
>     カスタムkafkaパラメータを指定します。kafka shellの"--property"パラメータと同じ機能です。
>
>     パラメータの値がファイルの場合、値の前にキーワード"FILE:"を追加する必要があります。
>
>     ファイルの作成方法については、[CREATE FILE](../../security/CREATE-FILE)コマンドドキュメントを参照してください。
>
>     サポートされるその他のカスタムパラメータについては、librdkafkaの公式CONFIGURATIONドキュメントのクライアント設定項目を参照してください。例：
>
>     ```text
>     "property.client.id" = "12345",
>     "property.ssl.ca.location" = "FILE:ca.pem"
>     ```
>
>     2.1 SSLを使用してKafkaに接続する場合、以下のパラメータを指定する必要があります：
>
>        ```text
>        "property.security.protocol" = "ssl",
>        "property.ssl.ca.location" = "FILE:ca.pem",
>        "property.ssl.certificate.location" = "FILE:client.pem",
>        "property.ssl.key.location" = "FILE:client.key",
>        "property.ssl.key.password" = "abcdefg"
>        ```
>
>        このうち：
>
>        `property.security.protocol`と`property.ssl.ca.location`は必須で、接続方法をSSLとして指定し、CA証明書の場所を指定するために使用されます。
>
>        Kafkaサーバー側でクライアント認証が有効になっている場合、以下も設定する必要があります：
>
>        ```text
>        "property.ssl.certificate.location"
>        "property.ssl.key.location"
>        "property.ssl.key.password"
>        ```
>
>        それぞれクライアントの公開鍵、秘密鍵、秘密鍵パスワードを指定するために使用されます。
>
>     2.2 kafkaパーティションのデフォルト開始オフセットを指定
>
>     `<kafka_partitions>/<kafka_offsets>`が指定されていない場合、デフォルトですべてのパーティションが消費されます。
>
>     この場合、`<kafka_default_offsets>`を指定して開始オフセットを設定できます。デフォルトは`OFFSET_END`で、終端から購読を開始することを意味します。
>
>     例：
>
>     ```text
>     "property.kafka_default_offsets" = "OFFSET_BEGINNING"
>     ```

**6. `COMMENT`**

>     定期ロードタスクのコメント情報。

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限が必要です：

| Privilege | Object | 注釈 |
| :-------- | :----- | :---- |
| LOAD_PRIV | Table | CREATE ROUTINE LOADはTableのLOAD操作に属します |

## 使用上の注意事項

- 動的Tableでは`columns_mapping`パラメータはサポートされません
- 動的複数Tableを使用する場合、merge_type、where_predicatesなどのパラメータは各動的Tableの要件に準拠する必要があります
- 時間フォーマットとOFFSETフォーマットを混在させることはできません
- `kafka_partitions`と`kafka_offsets`は1対1で対応している必要があります
- `enclose`が`"`に設定された場合、`trim_double_quotes`をtrueに設定する必要があります

## 例

- example_db内のexample_tblに対してtest1という名前のKafka定期ロードタスクを作成します。列区切り文字、group.idとclient.idを指定し、デフォルトで全パーティションを自動消費し、データが存在する場所（OFFSET_BEGINNING）から購読を開始します

   ```sql
   CREATE ROUTINE LOAD example_db.test1 ON example_tbl
   COLUMNS TERMINATED BY ",",
   COLUMNS(k1, k2, k3, v1, v2, v3 = k1 * 100)
   PROPERTIES
   (
       "desired_concurrent_number"="3",
       "max_batch_interval" = "20",
       "max_batch_rows" = "300000",
       "max_batch_size" = "209715200",
       "strict_mode" = "false"
   )
   FROM KAFKA
   (
       "kafka_broker_list" = "broker1:9092,broker2:9092,broker3:9092",
       "kafka_topic" = "my_topic",
       "property.group.id" = "xxx",
       "property.client.id" = "xxx",
       "property.kafka_default_offsets" = "OFFSET_BEGINNING"
   );
   ```
- 例えば、example_dbに対してtest1という名前のKafkaルーティン動的マルチTableロードタスクを作成します。列区切り文字、group.idとclient.idを指定し、デフォルトで全パーティションを自動的に消費し、データが存在する場所からサブスクリプションを開始します（OFFSET_BEGINNING）

  example_dbのtest1とtest2TableにKafkaからデータをインポートする必要があると仮定して、test1という名前のroutine loadタスクを作成し、test1とtest2からのデータを`my_topic`という名前のKafkaトピックに書き込みます。これにより、1つのroutine loadタスクを通じてKafkaから2つのTableにデータをインポートできます。

   ```sql
   CREATE ROUTINE LOAD example_db.test1
   PROPERTIES
   (
       "desired_concurrent_number"="3",
       "max_batch_interval" = "20",
       "max_batch_rows" = "300000",
       "max_batch_size" = "209715200",
       "strict_mode" = "false"
   )
   FROM KAFKA
   (
       "kafka_broker_list" = "broker1:9092,broker2:9092,broker3:9092",
       "kafka_topic" = "my_topic",
       "property.group.id" = "xxx",
       "property.client.id" = "xxx",
       "property.kafka_default_offsets" = "OFFSET_BEGINNING"
   );
   ```
- example_db の example_tbl に対して test1 という名前の Kafka routine load タスクを作成します。インポートタスクは strict モードです。

   ```sql
   CREATE ROUTINE LOAD example_db.test1 ON example_tbl
   COLUMNS(k1, k2, k3, v1, v2, v3 = k1 * 100),
   PRECEDING FILTER k1 = 1,
   WHERE k1 > 100 and k2 like "%doris%"
   PROPERTIES
   (
       "desired_concurrent_number"="3",
       "max_batch_interval" = "20",
       "max_batch_rows" = "300000",
       "max_batch_size" = "209715200",
       "strict_mode" = "true"
   )
   FROM KAFKA
   (
       "kafka_broker_list" = "broker1:9092,broker2:9092,broker3:9092",
       "kafka_topic" = "my_topic",
       "kafka_partitions" = "0,1,2,3",
       "kafka_offsets" = "101,0,0,200"
   );
   ```
- SSL認証を使用してKafkaクラスターからデータをインポートします。また、client.idパラメータを設定します。インポートタスクは非厳密モードで、タイムゾーンはAfrica/Abidjanです。

   ```sql
   CREATE ROUTINE LOAD example_db.test1 ON example_tbl
   COLUMNS(k1, k2, k3, v1, v2, v3 = k1 * 100),
   WHERE k1 > 100 and k2 like "%doris%"
   PROPERTIES
   (
       "desired_concurrent_number"="3",
       "max_batch_interval" = "20",
       "max_batch_rows" = "300000",
       "max_batch_size" = "209715200",
       "strict_mode" = "false",
       "timezone" = "Africa/Abidjan"
   )
   FROM KAFKA
   (
       "kafka_broker_list" = "broker1:9092,broker2:9092,broker3:9092",
       "kafka_topic" = "my_topic",
       "property.security.protocol" = "ssl",
       "property.ssl.ca.location" = "FILE:ca.pem",
       "property.ssl.certificate.location" = "FILE:client.pem",
       "property.ssl.key.location" = "FILE:client.key",
       "property.ssl.key.password" = "abcdefg",
       "property.client.id" = "my_client_id"
   );
   ```
- Json形式のデータをインポートします。デフォルトでJsonのフィールド名をカラム名マッピングとして使用します。インポートするパーティション0、1、2を指定し、すべての開始オフセットは0です。

   ```sql
   CREATE ROUTINE LOAD example_db.test_json_label_1 ON table1
   COLUMNS(category,price,author)
   PROPERTIES
   (
       "desired_concurrent_number"="3",
       "max_batch_interval" = "20",
       "max_batch_rows" = "300000",
       "max_batch_size" = "209715200",
       "strict_mode" = "false",
       "format" = "json"
   )
   FROM KAFKA
   (
       "kafka_broker_list" = "broker1:9092,broker2:9092,broker3:9092",
       "kafka_topic" = "my_topic",
       "kafka_partitions" = "0,1,2",
       "kafka_offsets" = "0,0,0"
   );
   ```
- Jsonデータをインポートし、Jsonpathsを通じてフィールドを抽出し、Json文書のルートノードを指定する

   ```sql
   CREATE ROUTINE LOAD example_db.test1 ON example_tbl
   COLUMNS(category, author, price, timestamp, dt=from_unixtime(timestamp, '%Y%m%d'))
   PROPERTIES
   (
       "desired_concurrent_number"="3",
       "max_batch_interval" = "20",
       "max_batch_rows" = "300000",
       "max_batch_size" = "209715200",
       "strict_mode" = "false",
       "format" = "json",
       "jsonpaths" = "[\"$.category\",\"$.author\",\"$.price\",\"$.timestamp\"]",
       "json_root" = "$.RECORDS"
       "strip_outer_array" = "true"
   )
   FROM KAFKA
   (
       "kafka_broker_list" = "broker1:9092,broker2:9092,broker3:9092",
       "kafka_topic" = "my_topic",
       "kafka_partitions" = "0,1,2",
       "kafka_offsets" = "0,0,0"
   );
   ```
- example_db内のexample_tblに対して条件フィルタリングを使用したtest1という名前のKafkaルーチンロードタスクを作成します。

   ```sql
   CREATE ROUTINE LOAD example_db.test1 ON example_tbl
   WITH MERGE
   COLUMNS(k1, k2, k3, v1, v2, v3),
   WHERE k1 > 100 and k2 like "%doris%",
   DELETE ON v3 >100
   PROPERTIES
   (
       "desired_concurrent_number"="3",
       "max_batch_interval" = "20",
       "max_batch_rows" = "300000",
       "max_batch_size" = "209715200",
       "strict_mode" = "false"
   )
   FROM KAFKA
   (
       "kafka_broker_list" = "broker1:9092,broker2:9092,broker3:9092",
       "kafka_topic" = "my_topic",
       "kafka_partitions" = "0,1,2,3",
       "kafka_offsets" = "101,0,0,200"
   );
   ```
- sequence列を含むUnique KeyモデルTableにデータをインポートする

   ```sql
   CREATE ROUTINE LOAD example_db.test_job ON example_tbl
   COLUMNS TERMINATED BY ",",
   COLUMNS(k1,k2,source_sequence,v1,v2),
   ORDER BY source_sequence
   PROPERTIES
   (
       "desired_concurrent_number"="3",
       "max_batch_interval" = "30",
       "max_batch_rows" = "300000",
       "max_batch_size" = "209715200"
   ) FROM KAFKA
   (
       "kafka_broker_list" = "broker1:9092,broker2:9092,broker3:9092",
       "kafka_topic" = "my_topic",
       "kafka_partitions" = "0,1,2,3",
       "kafka_offsets" = "101,0,0,200"
   );
   ```
- 指定された時点から消費を開始する

   ```sql
   CREATE ROUTINE LOAD example_db.test_job ON example_tbl
   PROPERTIES
   (
       "desired_concurrent_number"="3",
       "max_batch_interval" = "30",
       "max_batch_rows" = "300000",
       "max_batch_size" = "209715200"
   ) FROM KAFKA
   (
       "kafka_broker_list" = "broker1:9092,broker2:9092",
       "kafka_topic" = "my_topic",
       "property.kafka_default_offsets" = "2021-05-21 10:00:00"
   );
   ```
