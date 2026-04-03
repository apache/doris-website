---
{
  "title": "Doris Streamloader",
  "language": "ja",
  "description": "Doris Streamloaderは、Apache Dorisにデータをロードするために設計されたクライアントツールです。curlを使用したシングルスレッドロードと比較して、"
}
---
## 概要
Doris Streamloaderは、Apache Dorisにデータをロードするために設計されたクライアントツールです。`curl`を使用したシングルスレッドロードと比較して、同時ロード機能により大規模データセットのロード遅延を削減します。以下の機能を備えています：

- **並列ロード**: Stream Loadメソッドのマルチスレッドロード。`workers`パラメータを使用して並列度を設定できます。
- **マルチファイルロード:** 複数のファイルとディレクトリを一度に同時にロードします。再帰的なファイル取得をサポートし、ワイルドカード文字でファイル名を指定できます。
- **パストラバーサルサポート:** ソースファイルがディレクトリにある場合のパストラバーサルをサポート
- **回復力と継続性:** 部分的なロード失敗の場合、失敗した地点からデータロードを再開できます。
- **自動リトライメカニズム:** ロード失敗の場合、デフォルト回数の自動リトライを実行できます。ロードが失敗し続ける場合、手動リトライのためのコマンドを出力します。


## インストール

Source Code: https://github.com/apache/doris-streamloader/
Binary File: https://doris.apache.org/download

:::note
取得される結果は実行可能バイナリです。
:::

## 使用方法

```shell

doris-streamloader --source_file={FILE_LIST} --url={FE_OR_BE_SERVER_URL}:{PORT} --header={STREAMLOAD_HEADER} --db={TARGET_DATABASE} --table={TARGET_TABLE}


```
**1. `FILE_LIST` サポート:**

- 単一ファイル

    例：単一ファイルを読み込む

    ```json
    
    doris-streamloader --source_file="dir" --url="http://localhost:8330" --header="column_separator:|?columns:col1,col2" --db="testdb" --table="testtbl"
    
    ```
- 単一ディレクトリ

    例：単一ディレクトリをロードする

    ```json
    doris-streamloader --source_file="dir" --url="http://localhost:8330" --header="column_separator:|?columns:col1,col2" --db="testdb" --table="testtbl"        
    ```
- ワイルドカード文字を含むファイル名（引用符で囲まれた）

    例：file0.csv、file1.csv、file2.csvを読み込む

    ```json
    doris-streamloader --source_file="file*" --url="http://localhost:8330" --header="column_separator:|?columns:col1,col2" --db="testdb" --table="testtbl"
    ```
- カンマで区切られたファイルのリスト

    例：file0.csv、file1.csv、file2.csv を読み込む

  ```json
   doris-streamloader --source_file="file0.csv,file1.csv,file2.csv" --url="http://localhost:8330" --header="column_separator:|?columns:col1,col2" --db="testdb" --table="testtbl"
  ```
- カンマで区切られたディレクトリのリスト

  例：dir1、dir2、dir3を読み込む

   ```json
    doris-streamloader --source_file="dir1,dir2,dir3" --url="http://localhost:8330" --header="column_separator:|?columns:col1,col2" --db="testdb" --table="testtbl" 
   ```
**2. `STREAMLOAD_HEADER`は、複数ある場合に'?'で区切られたすべてのstreamloadヘッダーをサポートします**

例:

```shell
doris-streamloader --source_file="data.csv" --url="http://localhost:8330" --header="column_separator:|?columns:col1,col2" --db="testdb" --table="testtbl"
```
上記のパラメータは必須であり、以下のパラメータはオプションです：

| Parameter | Description  |  Default Value  |  Suggestions  |
|---|---|---|---|
| --u      | データベースのユーザー名 |  root    |      |
| --p      | パスワード |  empty string  |      |
| --compress      | HTTP通信時にデータを圧縮するかどうか |  false    |   デフォルトのままにしてください。圧縮と展開は Doris Streamloader 側と Doris BE 側の CPU リソースに負荷をかける可能性があるため、ネットワーク帯域幅が制約されている場合のみ有効にすることをお勧めします。   |
|--timeout    | Doris に送信される HTTP リクエストのタイムアウト（秒） |  60\*60\*10    | デフォルトのままにしてください |
| --batch      | ファイルのバッチ読み取りおよび送信の粒度（行数） |  4096    | デフォルトのままにしてください |
| --batch_byte      | ファイルのバッチ読み取りおよび送信の粒度（バイト） |  943718400 (900MB)    | デフォルトのままにしてください |
| --workers   | データ読み込みの並行処理レベル |  0    |   「0」は自動モードを意味し、streamload の速度はデータサイズとディスクスループットに基づきます。高性能クラスターでは値を上げることもできますが、10未満に保つことをお勧めします。過度なメモリ使用量が観察される場合（ログの memtracker 経由）、この値を下げることができます。   |
| --disk_throughput      | ディスクスループット（MB/s） |  800    |  通常はデフォルトのままにしてください。このパラメータは workers の自動推論の基準となります。より適切な workers の値を得るために、ニーズに基づいてこれを調整できます。  |
|--streamload_throughput | Streamload スループット（MB/s） | 100 | 通常はデフォルトのままにしてください。デフォルト値は、日次パフォーマンステスト環境で提供される streamload スループットと予測パフォーマンスから導出されます。より適切な workers の値を得るために、測定した streamload スループットに基づいてこれを設定できます：(LoadBytes*1000)/(LoadTimeMs*1024*1024) |
| --max_byte_per_task      | 各読み込みタスクの最大データサイズ。データセットがこのサイズを超える場合、残りの部分は新しい読み込みタスクに分割されます。 |  107374182400 (100G)    | 読み込みバージョンの数を減らすために、これは大きく設定することを推奨します。ただし、「body exceed max size」エラーが発生し、streaming_load_max_mb パラメータの調整（バックエンドの再起動が必要）を避けたい場合、または「-238 TOO MANY SEGMENT」エラーが発生した場合は、一時的にこの値を下げることができます。 |
| --check_utf8 | <p>読み込まれたデータのエンコーディングをチェックするかどうか： </p>   <p> 1) false、チェックせずに生データを直接読み込み；  2)  true、UTF-8 以外の文字を � に置き換え </p> | true |デフォルトのままにしてください|
|--debug |デバッグログを出力 | false | デフォルトのままにしてください |
|--auto_retry| 自動再試行用の失敗した workers とタスクのリスト | empty string | これは読み込み失敗がある場合のみ使用されます。失敗した workers とタスクの通し番号が表示され、コマンド全体をコピーして実行するだけです。例えば、--auto_retry="1,1;2,1" の場合、失敗したタスクは最初の worker の最初のタスクと、2番目の worker の最初のタスクを含むことを意味します。 |
|--auto_retry_times | 自動再試行回数 | 3 | デフォルトのままにしてください。再試行が不要な場合は、これを 0 に設定できます。 |
|--auto_retry_interval | 自動再試行間隔 | 60 | デフォルトのままにしてください。読み込み失敗が Doris のダウンタイムによって引き起こされる場合、Doris の再起動間隔に基づいてこのパラメータを設定することをお勧めします。 |
|--log_filename | ログ保存のパス | "" | ログはデフォルトでコンソールに出力されます。ログファイルに出力するには、--log_filename="/var/log" などのようにパスを設定できます。 |



## 結果の説明

データ読み込みが成功または失敗に関係なく、結果が返されます。


|Parameter | Description |
|---|---|
| Status | 読み込み成功または失敗 |
| TotalRows | 総行数 |
| FailLoadRows | 読み込みに失敗した行数 |
| LoadedRows | 読み込まれた行数 |
| FilteredRows | フィルタされた行数 |
| UnselectedRows | 選択されなかった行数 |
| LoadBytes | 読み込まれたバイト数 |
| LoadTimeMs | 実際の読み込み時間 |
| LoadFiles | 読み込まれたファイルのリスト |



例：

- 読み込みが成功した場合、次のような結果が表示されます：

  ```Go
  Load Result: {
          "Status": "Success",
          "TotalRows": 120,
          "FailLoadRows": 0,
          "LoadedRows": 120,
          "FilteredRows": 0,
          "UnselectedRows": 0,
          "LoadBytes": 40632,
          "LoadTimeMs": 971,
          "LoadFiles": [
                  "basic.csv",
                  "basic_data1.csv",
                  "basic_data2.csv",
                  "dir1/basic_data.csv",
                  "dir1/basic_data.csv.1",
                  "dir1/basic_data1.csv"
          ]
  }
  ```
- 読み込みが失敗した場合（または部分的に失敗した場合）、再試行メッセージが表示されます：

  ```Go
  load has some error and auto retry failed, you can retry by : 
  ./doris-streamloader --source_file /mnt/disk1/laihui/doris/tools/tpch-tools/bin/tpch-data/lineitem.tbl.1  --url="http://127.0.0.1:8239" --header="column_separator:|?columns: l_orderkey, l_partkey, l_suppkey, l_linenumber, l_quantity, l_extendedprice, l_discount, l_tax, l_returnflag,l_linestatus, l_shipdate,l_commitdate,l_receiptdate,l_shipinstruct,l_shipmode,l_comment,temp" --db="db" --table="lineitem1" -u root -p "" --compress=false --timeout=36000 --workers=3 --batch=4096 --batch_byte=943718400 --max_byte_per_task=1073741824 --check_utf8=true --report_duration=1 --auto_retry="2,1;1,1;0,1" --auto_retry_times=0 --auto_retry_interval=60
  ```
コマンドをコピーして実行できます。失敗メッセージも提供されます：

```Go
Load Result: {
      "Status": "Failed",
      "TotalRows": 1,
      "FailLoadRows": 1,
      "LoadedRows": 0,
      "FilteredRows": 0,
      "UnselectedRows": 0,
      "LoadBytes": 0,
      "LoadTimeMs": 104,
      "LoadFiles": [
              "/mnt/disk1/laihui/doris/tools/tpch-tools/bin/tpch-data/lineitem.tbl.1"
      ]
}

```
## ベストプラクティス

### パラメータの推奨事項

1. 必須パラメータ:

```--source_file=FILE_LIST --url=FE_OR_BE_SERVER_URL_WITH_PORT --header=STREAMLOAD_HEADER --db=TARGET_DATABASE --table=TARGET_TABLE``` 
   If you need to load multiple files, you should configure all of them at a time in `source_file`.

2. The default value of `workers` is the number of CPU cores. When that is large, for example, 96 cores, the value of `workers` should be dialed down. **The recommended value for most cases is 8.**

3. `max_byte_per_task` is recommended to be large in order to reduce the number of load versions. However, if you encounter a "body exceed max size" and try to avoid adjusting the streaming_load_max_mb parameter (which requires restarting the backend), or if you encounter a `-238 TOO MANY SEGMENT` error, you can temporarily dial this down. **For most cases, this can remain as default.**

**Two parameters that impacts the number of versions:**

- `workers`: The more `workers`, the higher concurrency level, and thus the more versions. The recommended value for most cases is 8.
- `max_byte_per_task`:  The larger `max_byte_per_task` , the larger data size in one single version, and thus the less versions. However, if this is excessively high, it could easily cause an `-238 TOO MANY SEGMENT ` error. For most cases, this can remain as default. 



### Recommended commands

In most cases, you only need to set the required parameters and `workers`. 

```text
./doris-streamloader --source_file="demo.csv,demoFile*.csv,demoDir" --url="http://127.0.0.1:8030" --header="column_separator:," --db="demo" --table="test_load" --u="root" --workers=8

```


### FAQ

- Before resumable loading was available, to fix any partial failures in loading would require deleting the current table and starting over. In this case, Doris Streamloader would retry automatically. If the retry fails, a retry command will be printed so you can copy and execute it.
- The default maximum data loading size for Doris Streamloader is limited by BE config `streaming_load_max_mb` (default: 100GB). If you don't want to restart BE, you can also dial down `max_byte_per_task`.

  To show current `streaming_load_max_mb`: 

  ```Go
curl "http://127.0.0.1:8040/api/show_config"

  ```
  
- If you encounter an `-238 TOO MANY SEGMENT ` error, you can dial down `max_byte_per_task`.
