---
{
  "title": "CREATE ROUTINE LOAD",
  "language": "ja",
  "description": "Routine Load機能により、ユーザーは指定されたデータソースから継続的にデータを読み取り、それをインポートする常駐インポートタスクを送信できます。"
}
---
## 説明

Routine Load機能を使用すると、ユーザーは指定されたデータソースから継続的にデータを読み取り、Dorisにインポートする常駐インポートタスクを送信できます。

現在、認証なしまたはSSL認証方式を通じて、KafkaからCSVまたはJson形式のデータをインポートすることのみをサポートしています。[Json形式データのインポート例](../../../../data-operate/import/import-way/routine-load-manual.md#Example-of-importing-Json-format-data)

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

> インポートジョブの名前。同一データベース内では、同じ名前のジョブは1つしか実行できません。

**2. `FROM <data_source>`**

> データソースの種類。現在サポート: KAFKA

**3. `<data_source_properties>`**

> 1. `<kafka_broker_list>`
>
>    Kafkaブローカー接続情報。形式はip:hostです。複数のブローカーはカンマで区切ります。
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

> インポート先のテーブル名を指定します。これはオプションパラメータです。指定しない場合、動的テーブル方式が使用され、Kafka内のデータにテーブル名情報が含まれている必要があります。
>
> 現在、KafkaのValueからテーブル名を取得することのみサポートしており、次の形式に従う必要があります：json例: `table_name|{"col1": "val1", "col2": "val2"}`、
> ここで`tbl_name`がテーブル名で、`|`がテーブル名とテーブルデータの区切り文字です。
>
> csv形式データの場合も同様です：`table_name|val1,val2,val3`。ここで`table_name`はDorisのテーブル名と一致する必要があり、そうでないとインポートが失敗します。
>
> ヒント：動的テーブルは`columns_mapping`パラメータをサポートしません。テーブル構造がDorisのテーブル構造と一致し、インポートするテーブル情報が大量にある場合、この方法が最適な選択になります。

**2. `<merge_type>`**

> データマージタイプ。デフォルトはAPPENDで、インポートされたデータが通常の追記書き込み操作であることを意味します。MERGEおよびDELETEタイプはUnique Keyモデルテーブルでのみ使用可能です。MERGEタイプは[DELETE ON]ステートメントと併用してDelete Flagカラムをマークする必要があります。DELETEタイプは、すべてのインポートデータが削除データであることを意味します。
>
> ヒント：動的複数テーブルを使用する場合、このパラメータは各動的テーブルのタイプと一致している必要があり、そうでないとインポート失敗につながります。

**3. `<load_properties>`**

> インポートデータの記述に使用されます。構成は以下の通りです：
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
>    カラム区切り文字を指定します。デフォルトは`\t`
>
>    `COLUMNS TERMINATED BY ","`
>
> 2. `<columns_mapping>`
>
>    ファイルカラムとテーブルカラムの間のマッピング関係、および各種カラム変換を指定するために使用されます。この部分の詳細な紹介については、[Column Mapping, Transformation and Filtering]ドキュメントを参照してください。
>
>    `(k1, k2, tmpk1, k3 = tmpk1 + 1)`
>
>    ヒント：動的テーブルはこのパラメータをサポートしません。
>
> 3. `<preceding_filter>`
>
>    生データをフィルタします。この部分の詳細情報については、[Column Mapping, Transformation and Filtering]ドキュメントを参照してください。
>
>    `WHERE k1 > 100 and k2 = 1000`
>
>    ヒント：動的テーブルはこのパラメータをサポートしません。
>
> 4. `<where_predicates>`
>
>    条件に基づいてインポートデータをフィルタします。この部分の詳細情報については、[Column Mapping, Transformation and Filtering]ドキュメントを参照してください。
>
>    `WHERE k1 > 100 and k2 = 1000`
>
>    ヒント：動的複数テーブルを使用する場合、このパラメータは各動的テーブルのカラムと一致する必要があり、そうでないとインポートが失敗します。動的複数テーブルを使用する場合、共通の公開カラムに対してのみこのパラメータの使用を推奨します。
>
> 5. `<partitions>`
>
>    インポート先テーブルのどのパーティションにインポートするかを指定します。指定しない場合、データは自動的に対応するパーティションにインポートされます。
>
>    `PARTITION(p1, p2, p3)`
>
>    ヒント：動的複数テーブルを使用する場合、このパラメータは各動的テーブルと一致する必要があり、そうでないとインポートが失敗します。
>
> 6. `<DELETE ON>`
>
>    MERGEインポートモードと併用する必要があり、Unique Keyモデルテーブルにのみ適用されます。インポートデータ内のDelete Flagカラムと計算関係を指定するために使用されます。
>
>    `DELETE ON v3 >100`
>
>    ヒント：動的複数テーブルを使用する場合、このパラメータは各動的テーブルと一致する必要があり、そうでないとインポートが失敗します。
>
> 7. `<ORDER BY>`
>
>    Unique Keyモデルテーブルにのみ適用されます。インポートデータ内のSequence Colカラムを指定するために使用されます。主にインポート時のデータ順序を保証するために使用されます。
>
>    ヒント：動的複数テーブルを使用する場合、このパラメータは各動的テーブルと一致する必要があり、そうでないとインポートが失敗します。

**4. `<job_properties>`**

> ルーチンインポートジョブの一般パラメータを指定するために使用されます。
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
>     希望する並行数。ルーチンインポートジョブは複数のサブタスクに分割されて実行されます。このパラメータは、1つのジョブで同時に実行可能なタスク数を指定します。0より大きい値である必要があります。デフォルトは5です。
>
>    この並行数は実際の並行数ではありません。実際の並行数は、クラスターノード数、負荷状況、データソース状況を考慮して決定されます。
>
>    `"desired_concurrent_number" = "3"`
>
> 2. `<max_batch_interval>/<max_batch_rows>/<max_batch_size>`
>
>    これら3つのパラメータは以下を表します：
>
>     1. 各サブタスクの最大実行時間（秒）。1以上である必要があります。デフォルトは10です。
>     2. 各サブタスクの最大読み取り行数。200000以上である必要があります。デフォルトは20000000です。
>     3. 各サブタスクの最大読み取りバイト数。単位はバイト、範囲は100MBから10GBです。デフォルトは1Gです。
>
>     これら3つのパラメータは、サブタスクの実行時間と処理量を制御するために使用されます。いずれかが閾値に達すると、タスクは終了します。
>
>     ```text
>     "max_batch_interval" = "20",
>     "max_batch_rows" = "300000",
>     "max_batch_size" = "209715200"
>     ```
>
> 3. `<max_error_number>`
>
>     サンプリングウィンドウ内で許可される最大エラー行数。0以上である必要があります。デフォルトは0で、エラー行を許可しないことを意味します。
>
>     サンプリングウィンドウは`max_batch_rows * 10`です。サンプリングウィンドウ内のエラー行数が`max_error_number`を超える場合、ルーチンジョブは一時停止され、データ品質問題を確認するための手動介入が必要になります。
>
>     where条件でフィルタされた行はエラー行としてカウントされません。
>
> 4. `<strict_mode>`
>
>     厳密モードを有効にするかどうか。デフォルトはオフです。有効にすると、非null元データのカラム型変換結果がNULLになった場合、フィルタされます。指定方法：
>
>     `"strict_mode" = "true"`
>
>     厳密モードとは：インポートプロセス中のカラム型変換を厳密にフィルタします。厳密なフィルタ戦略は以下の通りです：
>
>     1. カラム型変換について、厳密モードがtrueの場合、エラーデータはフィルタされます。ここで、エラーデータとは：元データがnullでないが、カラム型変換後にnull値になるデータを指します。
>     2. インポート時の関数変換によって生成されるカラムについては、厳密モードは効果がありません。
>     3. 範囲制限があるカラムについて、元データが型変換を通過できるが範囲制限を通過できない場合、厳密モードは効果がありません。例：型がdecimal(1,0)で元データが10の場合、型変換は通過できますがカラムの宣言範囲外です。厳密モードはこのようなデータに効果がありません。
>
>     **厳密モードとソースデータインポートの関係**
>
>     TinyIntカラム型を使用した例
>
>     注意：テーブル内のカラムがnull値を許可する場合
>
>     | source data | source data example | string to int | strict_mode   | result                 |
>     | ----------- | ------------------- | ------------- | ------------- | ---------------------- |
>     | null        | `\N`               | N/A           | true or false | NULL                   |
>     | not null    | aaa or 2000        | NULL          | true          | invalid data(filtered) |
>     | not null    | aaa                | NULL          | false         | NULL                   |
>     | not null    | 1                  | 1             | true or false | correct data           |
>
>     Decimal(1,0)カラム型を使用した例
>
>     注意：テーブル内のカラムがnull値を許可する場合
>
>     | source data | source data example | string to int | strict_mode   | result                 |
>     | ----------- | ------------------- | ------------- | ------------- | ---------------------- |
>     | null        | `\N`               | N/A           | true or false | NULL                   |
>     | not null    | aaa                | NULL          | true          | invalid data(filtered) |
>     | not null    | aaa                | NULL          | false         | NULL                   |
>     | not null    | 1 or 10            | 1             | true or false | correct data           |
>
>     注意：10は範囲を超える値ですが、その型がdecimal要件を満たすため、厳密モードは影響しません。10は最終的に他のETL処理フローでフィルタされますが、厳密モードではフィルタされません。
>
> 5. `<timezone>`
>
>     インポートジョブで使用するタイムゾーンを指定します。デフォルトはSessionのtimezoneパラメータです。このパラメータは、インポートに関連するすべてのタイムゾーン関連関数の結果に影響します。
>
>     `"timezone" = "Asia/Shanghai"`
>
> 6. `<format>`
>
>     インポートデータ形式を指定します。デフォルトはcsv、json形式がサポートされています。
>
>     `"format" = "json"`
>
> 7. `<jsonpaths>`
>
>     json形式データをインポートする際、jsonpathsを使用してJsonデータから抽出するフィールドを指定できます。
>
>     `-H "jsonpaths: [\"$.k2\", \"$.k1\"]"`
>
> 8. `<strip_outer_array>`
>
>     json形式データをインポートする際、strip_outer_arrayをtrueに設定すると、Jsonデータが配列として表示され、データ内の各要素が1行として扱われることを示します。デフォルト値はfalseです。
>
>     `-H "strip_outer_array: true"`
>
> 9. `<json_root>`
>
>     json形式データをインポートする際、json_rootを使用してJsonデータのルートノードを指定できます。Dorisはjson_rootを通じてルートノードから抽出された要素を解析します。デフォルトは空です。
>
>     `-H "json_root: $.RECORDS"`
>  
> 10. `<send_batch_parallelism>`
>
>     Integer型、バッチデータ送信の並列度を設定するために使用されます。並列度の値がBE設定の`max_send_batch_parallelism_per_job`を超える場合、調整ポイントとして機能するBEは`max_send_batch_parallelism_per_job`の値を使用します。
>
>     `"send_batch_parallelism" = "10"`
>
> 11. `<load_to_single_tablet>`
>
>     Boolean型、trueは1つのタスクが対応するパーティションの1つのタブレットのみにデータをインポートすることをサポートすることを示します。デフォルト値はfalseです。このパラメータは、random bucketingを使用するolapテーブルにデータをインポートする場合にのみ設定が許可されます。
>
>     `"load_to_single_tablet" = "true"`
>
> 12. `<partial_columns>`
>
>     Boolean型、trueは部分カラム更新を使用することを示します。デフォルト値はfalseです。このパラメータは、テーブルモデルがUniqueでMerge on Writeを使用する場合にのみ設定が許可されます。動的複数テーブルはこのパラメータをサポートしません。
>
>     `"partial_columns" = "true"`
>
> 13. `<max_filter_ratio>`
>
>     サンプリングウィンドウ内で許可される最大フィルタ率。0以上1以下である必要があります。デフォルト値は0です。
>
>     サンプリングウィンドウは`max_batch_rows * 10`です。サンプリングウィンドウ内で、エラー行/総行数が`max_filter_ratio`を超える場合、ルーチンジョブは一時停止され、データ品質問題を確認するための手動介入が必要になります。
>
>     where条件でフィルタされた行はエラー行としてカウントされません。
>
> 14. `<enclose>`
>
>     囲み文字。csvデータフィールドに行またはカラム区切り文字が含まれている場合、偶然の切り捨てを防ぐため、単一バイト文字を囲み文字として保護に指定できます。例えば、カラム区切り文字が","で囲み文字が"'"の場合、データ"a,'b,c'"に対して、"b,c"は1つのフィールドとして解析されます。
>
>     注意：encloseが`"`に設定されている場合、trim_double_quotesをtrueに設定する必要があります。
>
> 15. `<escape>`
>
>     エスケープ文字。csvフィールド内の囲み文字と同じ文字をエスケープするために使用されます。例えば、データが"a,'b,'c'"で、囲み文字が"'"、"b,'c"を1つのフィールドとして解析したい場合、`\`などの単一バイトエスケープ文字を指定し、データを`a,'b,\'c'`に変更する必要があります。

**5. `data_source_properties`のオプションプロパティ**

> 1. `<kafka_partitions>/<kafka_offsets>`
>
>     購読するkafkaパーティションと各パーティションの開始オフセットを指定します。時刻が指定された場合、その時刻以上に最も近いオフセットから消費を開始します。
>
>     offsetは0以上の具体的なオフセット、または以下を指定できます：
>
>     - `OFFSET_BEGINNING`: データが存在する場所から購読を開始。
>     - `OFFSET_END`: 末尾から購読を開始。
>     - 時刻形式、例："2021-05-22 11:00:00"
>
>     指定しない場合、デフォルトでトピック下のすべてのパーティションを`OFFSET_END`から購読します。
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
>    注意：時刻形式とOFFSET形式は混在できません。
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
>        その中で：
>
>        `property.security.protocol`と`property.ssl.ca.location`は必須で、接続方式をSSLとして指定し、CA証明書の場所を指定するために使用されます。
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
>     この場合、`<kafka_default_offsets>`を指定して開始オフセットを設定できます。デフォルトは`OFFSET_END`で、末尾から購読を開始することを意味します。
>
>     例：
>
>     ```text
>     "property.kafka_default_offsets" = "OFFSET_BEGINNING"
>     ```

**6. `COMMENT`**

>     ルーチンロードタスクのコメント情報。

## アクセス制御要件

このSQLコマンドを実行するユーザーは、最低限以下の権限を持つ必要があります：

| Privilege | Object | Notes |
| :-------- | :----- | :---- |
| LOAD_PRIV | Table | CREATE ROUTINE LOADはテーブルのLOAD操作に属します |

## 使用上の注意事項

- 動的テーブルは`columns_mapping`パラメータをサポートしません
- 動的複数テーブルを使用する場合、merge_type、where_predicatesなどのパラメータは各動的テーブルの要件に適合する必要があります
- 時刻形式とOFFSET形式は混在できません
- `kafka_partitions`と`kafka_offsets`は一対一で対応する必要があります
- `enclose`が`"`に設定されている場合、`trim_double_quotes`をtrueに設定する必要があります

## 例

- example_db内のexample_tblに対してtest1という名前のKafkaルーチンロードタスクを作成します。カラム区切り文字、group.idとclient.idを指定し、デフォルトですべてのパーティションを自動消費し、データが存在する場所（OFFSET_BEGINNING）から購読を開始します

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
- example_dbに対してtest1という名前のKafkaルーチン動的マルチテーブルロードタスクを作成します。列区切り文字、group.idおよびclient.idを指定し、デフォルトですべてのパーティションを自動的に消費し、データが存在する場所からサブスクリプションを開始します（OFFSET_BEGINNING）

  Kafkaからexample_db内のtest1およびtest2テーブルにデータをインポートする必要があると仮定して、test1という名前のルーチンロードタスクを作成し、test1およびtest2からのデータを`my_topic`という名前のKafkaトピックに書き込みます。これにより、1つのルーチンロードタスクを通じてKafkaから2つのテーブルにデータをインポートできます。

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
- SSL認証を使用してKafkaクラスターからデータをインポートします。また、client.idパラメータを設定します。インポートタスクは非厳密モードで、タイムゾーンはAfrica/Abidjanです

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
- Json形式のデータをインポートします。デフォルトでJsonのフィールド名をカラム名マッピングとして使用します。インポートするパーティション0,1,2を指定し、すべての開始オフセットは0です

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
- Jsonデータをインポートし、Jsonpathを通じてフィールドを抽出し、Jsonドキュメントのルートノードを指定する

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
- 条件フィルタリングを使用して、example_db内のexample_tblに対してtest1という名前のKafkaルーチンロードタスクを作成します。

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
- Unique Keyモデルテーブルのシーケンスカラムを含むテーブルにデータをインポートする

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
- 指定した時点から消費を開始する

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
