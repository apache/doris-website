---
{
    "title": "CREATE ROUTINE LOAD",
    "language": "ja",
    "description": "Routine Load 機能では、指定したデータソースからデータを継続的に読み取り、Doris に取り込む常駐型のインポートジョブを登録できます。"
}
---

## 説明

Routine Load 機能では、指定したデータソースからデータを継続的に読み取り、Doris に取り込む常駐型のインポートジョブを登録できます。

現在は、認証なし、または SSL 認証を使用した Kafka からの CSV 形式および JSON 形式のデータ取り込みのみをサポートしています。[JSON 形式のデータ取り込み例](../../../../data-operate/import/import-way/routine-load-manual.md#import-examples)

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

> インポートジョブの名前。同じデータベース内では、同じ名前のジョブを同時に複数実行できません。

**2. `FROM <data_source>`**

> データソースの種類。現在サポートされているのは KAFKA です。

**3. `<data_source_properties>`**

> 1. `<kafka_broker_list>`
>
>    Kafka ブローカーの接続情報。形式は ip:host です。複数のブローカーはカンマで区切ります。
>    
>    ```text
>    "kafka_broker_list" = "broker1:9092,broker2:9092"
>    ```
>
> 2. `<kafka_topic>`
>
>    購読する Kafka トピックを指定します。
>    ```text
>    "kafka_topic" = "my_topic"
>    ```

## オプションパラメータ

**1. `<tbl_name>`**

> 取り込み先テーブルの名前を指定します。省略可能です。指定しない場合は動的テーブル方式が使用され、Kafka のデータにテーブル名の情報が含まれている必要があります。
>
> 現在、テーブル名は Kafka の Value からのみ取得できます。データは次の形式に従う必要があります。JSON の例: `table_name|{"col1": "val1", "col2": "val2"}`。
> `tbl_name` はテーブル名を表し、テーブル名とテーブルデータは `|` で区切ります。
>
> CSV 形式のデータも同様で、`table_name|val1,val2,val3` の形式です。ここでの `table_name` は Doris 内のテーブル名と一致する必要があります。一致しない場合、取り込みは失敗します。
>
> ヒント: 動的テーブルでは `columns_mapping` パラメータはサポートされません。テーブル構造が Doris 側のテーブル構造と一致し、取り込むテーブルの情報が大量にある場合は、この方式が最適です。

**2. `<merge_type>`**

> データのマージ種別です。デフォルトは APPEND で、取り込んだデータを通常の追加書き込みとして扱います。MERGE と DELETE は Unique Key モデルのテーブルでのみ使用できます。MERGE を使用する場合は、[DELETE ON] 句と組み合わせて削除フラグ列を指定する必要があります。DELETE は、取り込んだデータをすべて削除データとして扱います。
>
> ヒント: 複数の動的テーブルを使用する場合は、このパラメータが各動的テーブルの種類と整合している必要があります。整合していない場合、取り込みは失敗します。

**3. `<load_properties>`**

> 取り込むデータを記述するために使用します。構成は次のとおりです。
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
>    列の区切り文字を指定します。デフォルトは `\t` です。
>
>    `COLUMNS TERMINATED BY ","`
>
> 2. `<columns_mapping>`
>
>    ファイルの列とテーブルの列の対応関係、および各種の列変換を指定します。詳しくは、[列のマッピング、変換、フィルタリング]のドキュメントを参照してください。
>
>    `(k1, k2, tmpk1, k3 = tmpk1 + 1)`
>
>    ヒント: 動的テーブルではこのパラメータはサポートされません。
>
> 3. `<preceding_filter>`
>
>    元データをフィルタリングします。詳しくは、[列のマッピング、変換、フィルタリング]のドキュメントを参照してください。
>
>    `WHERE k1 > 100 and k2 = 1000`
>
>    ヒント: 動的テーブルではこのパラメータはサポートされません。
>
> 4. `<where_predicates>`
>
>    条件に基づいて取り込みデータをフィルタリングします。詳しくは、[列のマッピング、変換、フィルタリング]のドキュメントを参照してください。
>
>    `WHERE k1 > 100 and k2 = 1000`
>
>    ヒント: 複数の動的テーブルを使用する場合、このパラメータは各動的テーブルの列に適合している必要があります。適合しない場合、取り込みは失敗します。複数の動的テーブルでこのパラメータを使用する場合は、共通の列に限ることを推奨します。
>
> 5. `<partitions>`
>
>    取り込み先テーブルのパーティションを指定します。指定しない場合、データは対応するパーティションに自動的に取り込まれます。
>
>    `PARTITION(p1, p2, p3)`
>
>    ヒント: 複数の動的テーブルを使用する場合、このパラメータは各動的テーブルに適合している必要があります。適合しない場合、取り込みは失敗します。
>
> 6. `<DELETE ON>`
>
>    MERGE 取り込みモードと組み合わせて使用する必要があり、Unique Key モデルのテーブルにのみ適用されます。取り込みデータ内の削除フラグ列と、その計算式を指定します。
>
>    `DELETE ON v3 >100`
>
>    ヒント: 複数の動的テーブルを使用する場合、このパラメータは各動的テーブルに適合している必要があります。適合しない場合、取り込みは失敗します。
>
> 7. `<ORDER BY>`
>
>    Unique Key モデルのテーブルにのみ適用されます。取り込みデータ内のシーケンス列を指定します。主に取り込み時のデータの順序を保証するために使用します。
>
>    ヒント: 複数の動的テーブルを使用する場合、このパラメータは各動的テーブルに適合している必要があります。適合しない場合、取り込みは失敗します。

**4. `<job_properties>`**

> Routine Load ジョブの一般的なパラメータを指定します。
>
>    ```text
>    PROPERTIES (
>        "key1" = "val1",
>        "key2" = "val2"
>    )
>    ```
>
> 現在、次のパラメータをサポートしています。
>
> 1. `<desired_concurrent_number>`
>
>     希望する同時実行数です。Routine Load ジョブは実行時に複数のサブタスクに分割されます。このパラメータは、ジョブごとに同時実行できるタスク数を指定します。0 より大きい値にする必要があります。デフォルトは 5 です。
>
>    この値は実際の同時実行数ではありません。実際の同時実行数は、クラスターノード数、負荷状態、データソースの状態を考慮して決まります。
>
>    `"desired_concurrent_number" = "3"`
>
> 2. `<max_batch_interval>/<max_batch_rows>/<max_batch_size>`
>
>    これら三つのパラメータは、それぞれ次を表します。
>
>     1. 各サブタスクの最大実行時間。単位は秒です。1 以上である必要があります。デフォルトは 10 です。
>     2. 各サブタスクが読み取る最大行数。200000 以上である必要があります。デフォルトは 20000000 です。
>     3. 各サブタスクが読み取る最大バイト数。単位はバイトで、範囲は 100MB から 10GB です。デフォルトは 1G です。
>
>     これら三つのパラメータは、サブタスクの実行時間と処理量を制御します。いずれかがしきい値に達すると、タスクは終了します。
>
>     ```text
>     "max_batch_interval" = "20",
>     "max_batch_rows" = "300000",
>     "max_batch_size" = "209715200"
>     ```
>
> 3. `<max_error_number>`
>
>     サンプリングウィンドウ内で許容するエラー行の最大数です。0 以上である必要があります。デフォルトは 0 で、エラー行を許容しません。
>
>     サンプリングウィンドウは `max_batch_rows * 10` です。ウィンドウ内のエラー行数が `max_error_number` を超えると、Routine Load ジョブは一時停止し、データ品質の問題を手動で確認する必要があります。
>
>     WHERE 条件によってフィルタリングされた行は、エラー行に含まれません。
>
> 4. `<strict_mode>`
>
>     厳密モードを有効にするかどうかを指定します。デフォルトは無効です。有効にすると、元データが NULL ではないのに列の型変換後に NULL となるデータは除外されます。指定例:
>
>     `"strict_mode" = "true"`
>
>     厳密モードでは、取り込み時の列の型変換を厳密にフィルタリングします。フィルタリングの規則は次のとおりです。
>
>     1. 列の型変換では、厳密モードが true の場合、エラーデータが除外されます。ここでいうエラーデータとは、元データは NULL ではないものの、列の型変換後に NULL となるデータです。
>     2. 取り込み時に関数変換によって生成される列には、厳密モードは影響しません。
>     3. 値の範囲に制限がある列について、元データが型変換には成功しても範囲制限を満たさない場合、厳密モードは影響しません。たとえば、型が decimal(1,0) で元データが 10 の場合、型変換には成功しますが、列の定義範囲を超えています。このようなデータには厳密モードは影響しません。
>
>     **厳密モードと元データの取り込みの関係**
>
>     以下は TinyInt 型の列を使った例です。
>
>     注: テーブルの列が NULL 値を許可する場合
>
>     | 元データ | 元データの例 | 文字列から整数への変換 | strict_mode | 結果 |
>     | ----------- | ------------------- | ------------- | ------------- | ---------------------- |
>     | NULL        | `\N`               | N/A           | true または false | NULL                   |
>     | 非 NULL    | aaa または 2000        | NULL          | true          | 無効なデータ（除外） |
>     | 非 NULL    | aaa                | NULL          | false         | NULL                   |
>     | 非 NULL    | 1                  | 1             | true または false | 正しいデータ           |
>
>     以下は Decimal(1,0) 型の列を使った例です。
>
>     注: テーブルの列が NULL 値を許可する場合
>
>     | 元データ | 元データの例 | 文字列から整数への変換 | strict_mode | 結果 |
>     | ----------- | ------------------- | ------------- | ------------- | ---------------------- |
>     | NULL        | `\N`               | N/A           | true または false | NULL                   |
>     | 非 NULL    | aaa                | NULL          | true          | 無効なデータ（除外） |
>     | 非 NULL    | aaa                | NULL          | false         | NULL                   |
>     | 非 NULL    | 1 または 10            | 1             | true または false | 正しいデータ           |
>
>     注: 10 は範囲を超える値ですが、型は decimal の要件を満たすため、厳密モードは影響しません。10 は最終的にほかの ETL 処理で除外されますが、厳密モードによって除外されるわけではありません。
>
> 5. `<timezone>`
>
>     インポートジョブで使用するタイムゾーンを指定します。デフォルトはセッションのタイムゾーンパラメータです。このパラメータは、取り込みに関係するタイムゾーン関連関数の結果すべてに影響します。
>
>     `"timezone" = "Asia/Shanghai"`
>
> 6. `<format>`
>
>     取り込むデータの形式を指定します。デフォルトは csv で、json 形式もサポートされます。
>
>     `"format" = "json"`
>
> 7. `<jsonpaths>`
>
>     json 形式のデータを取り込むとき、jsonpaths を使用して Json データから抽出するフィールドを指定できます。
>
>     `-H "jsonpaths: [\"$.k2\", \"$.k1\"]"`
>
> 8. `<strip_outer_array>`
>
>     json 形式のデータを取り込むとき、strip_outer_array を true に設定すると、Json データを配列として扱い、配列の各要素を一行として処理します。デフォルトは false です。
>
>     `-H "strip_outer_array: true"`
>
> 9. `<json_root>`
>
>     json 形式のデータを取り込むとき、json_root を使用して Json データのルートノードを指定できます。Doris は json_root で指定したルートノードから抽出された要素を解析します。デフォルトは空です。
>
>     `-H "json_root: $.RECORDS"`
>  
> 10. `<send_batch_parallelism>`
>
>     整数型。バッチデータの送信並列度を設定します。指定した並列度が BE の設定値 `max_send_batch_parallelism_per_job` を超える場合、調整役の BE は `max_send_batch_parallelism_per_job` の値を使用します。
>
>     `"send_batch_parallelism" = "10"`
>
> 11. `<load_to_single_tablet>`
>
>     真偽値型。true の場合、タスクが対応するパーティション内の単一のタブレットだけにデータを取り込めるようにします。デフォルトは false です。このパラメータは、ランダム分散を使用する OLAP テーブルへの取り込みでのみ設定できます。
>
>     `"load_to_single_tablet" = "true"`
>
> 12. `<partial_columns>`
>
>     真偽値型。true の場合、部分列更新を使用します。デフォルトは false です。このパラメータは、テーブルモデルが Unique で Merge on Write を使用している場合にのみ設定できます。複数の動的テーブルではサポートされません。
>
>     `"partial_columns" = "true"`
>
> 13. `<max_filter_ratio>`
>
>     サンプリングウィンドウ内で許容する最大フィルタリング比率です。0 以上 1 以下である必要があります。デフォルトは 0 です。
>
>     サンプリングウィンドウは `max_batch_rows * 10` です。ウィンドウ内でエラー行数と総行数の比が `max_filter_ratio` を超えると、Routine Load ジョブは一時停止し、データ品質の問題を手動で確認する必要があります。
>
>     WHERE 条件によってフィルタリングされた行は、エラー行に含まれません。
>
> 14. `<enclose>`
>
>     囲み文字です。CSV データのフィールドに行区切り文字や列区切り文字が含まれる場合、意図しない分割を防ぐため、単一バイトの囲み文字を指定できます。たとえば、列区切り文字が ","、囲み文字が "'" の場合、データ "a,'b,c'" の "b,c" は一つのフィールドとして解析されます。
>
>     注: enclose を `"` に設定する場合、trim_double_quotes を true に設定する必要があります。
>
> 15. `<escape>`
>
>     エスケープ文字です。CSV フィールド内に囲み文字と同じ文字がある場合に、その文字をエスケープするために使用します。たとえば、データが "a,'b,'c'"、囲み文字が "'" で、"b,'c" を一つのフィールドとして解析したい場合は、`\` などの単一バイトのエスケープ文字を指定し、データを `a,'b,\'c'` に変更する必要があります。
>
**5. `data_source_properties` のオプションプロパティ**

> 1. `<kafka_partitions>/<kafka_offsets>`
>
>     購読する Kafka パーティションと、各パーティションの開始オフセットを指定します。時刻を指定した場合は、その時刻以降で最も近いオフセットから消費を開始します。
>
>     オフセットには、0 以上の具体的なオフセット、または次の値を指定できます。
>
>     - `OFFSET_BEGINNING`: データが存在する位置から購読を開始します。
>     - `OFFSET_END`: 末尾から購読を開始します。
>     - 時刻形式。例: "2021-05-22 11:00:00"
>
>     指定しない場合は、デフォルトでトピック内のすべてのパーティションを `OFFSET_END` から購読します。
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
>    注: 時刻形式と OFFSET 形式を混在させることはできません。
>
> 2. `<property>`
>
>     Kafka のカスタムパラメータを指定します。Kafka シェルの "--property" パラメータと同じ働きをします。
>
>     パラメータの値がファイルの場合は、値の前に "FILE:" を付ける必要があります。
>
>     ファイルの作成方法については、[CREATE FILE](../../security/CREATE-FILE) コマンドのドキュメントを参照してください。
>
>     サポートされるその他のカスタムパラメータについては、librdkafka の公式 CONFIGURATION ドキュメントにあるクライアント設定項目を参照してください。例:
>
>     ```text
>     "property.client.id" = "12345",
>     "property.ssl.ca.location" = "FILE:ca.pem"
>     ```
>
>     2.1 SSL を使用して Kafka に接続する場合は、次のパラメータを指定する必要があります。
>
>        ```text
>        "property.security.protocol" = "ssl",
>        "property.ssl.ca.location" = "FILE:ca.pem",
>        "property.ssl.certificate.location" = "FILE:client.pem",
>        "property.ssl.key.location" = "FILE:client.key",
>        "property.ssl.key.password" = "abcdefg"
>        ```
>
>        Among them:
>
>        `property.security.protocol` and `property.ssl.ca.location` are required, used to specify the connection method as SSL and the location of the CA certificate.
>
>        If client authentication is enabled on the Kafka server side, the following also need to be set:
>
>        ```text
>        "property.ssl.certificate.location"
>        "property.ssl.key.location"
>        "property.ssl.key.password"
>        ```
>
>        Used to specify the client's public key, private key, and private key password respectively.
>
>     2.2 Kafka パーティションのデフォルト開始オフセットを指定する
>
>     `<kafka_partitions>/<kafka_offsets>` を指定しない場合、デフォルトではすべてのパーティションが消費されます。
>
>     この場合、`<kafka_default_offsets>` を指定して開始オフセットを設定できます。デフォルトは `OFFSET_END` で、末尾から購読を開始します。
>
>     例:
>
>     ```text
>     "property.kafka_default_offsets" = "OFFSET_BEGINNING"
>     ```

**6. `COMMENT`**

>     Comment information for the routine load task.

## 必要な権限

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限 | オブジェクト | 備考 |
| :-------- | :----- | :---- |
| LOAD_PRIV | テーブル | CREATE ROUTINE LOAD はテーブルの LOAD 操作に該当します |

## 使用上の注意

- 動的テーブルでは `columns_mapping` パラメータはサポートされません。
- 複数の動的テーブルを使用する場合、merge_type や where_predicates などのパラメータは、各動的テーブルの要件を満たす必要があります。
- 時刻形式と OFFSET 形式を混在させることはできません。
- `kafka_partitions` と `kafka_offsets` は一対一で対応している必要があります。
- `enclose` を `"` に設定する場合、`trim_double_quotes` を true に設定する必要があります。

## 例

Kafka からの CSV/JSON の取り込み、SSL 認証、MERGE モード、シーケンス列などを扱う詳細な例については、データ取り込みガイドの [Routine Load](../../../../data-operate/import/import-way/routine-load-manual.md) を参照してください。
