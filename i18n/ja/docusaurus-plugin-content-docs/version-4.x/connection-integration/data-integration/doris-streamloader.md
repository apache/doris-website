---
{
    "title": "Doris Streamloader",
    "language": "ja",
    "description": "Doris Streamloader は、Apache Doris 公式のデータ取り込み用クライアントツールです。複数ワーカーによる並列取り込み、複数ファイルの取り込み、中断箇所からの再開、自動リトライに対応し、大量データの一括ロードに適しています。"
}
---

[Doris Streamloader](https://github.com/apache/doris-streamloader) は、Apache Doris データベースにデータを取り込むための専用クライアントツールです。`curl` を直接使用する単一ワーカーでの取り込みと比べ、複数ワーカーで並列に取り込めるため、大量データのロードにかかる時間を大幅に短縮できます。

## 主な機能 {#core-features}

| 機能 | 説明 |
|---|---|
| 並列取り込み | 複数のワーカーで Stream Load を実行します。並列数は `workers` パラメータで設定します |
| 複数ファイルの取り込み | 一つのタスクで複数のファイルやディレクトリを取り込みます。ワイルドカードによる指定に対応し、ディレクトリ内のすべてのファイルを再帰的に探索します |
| 中断箇所からの再開 | 取り込み中に一部が失敗した場合、失敗した箇所から再開できます |
| 自動リトライ | 取り込みに失敗しても手動で再試行する必要はありません。ツールがデフォルトの回数まで自動的にリトライし、それでも失敗した場合は手動リトライ用のコマンドを表示します |

## 利用シーン {#use-cases}

- 大量のデータ（GB～TB 規模）を Doris に一括ロードする場合
- 複数のファイルやディレクトリを一括で取り込む場合
- 取り込み時間が重要で、並列処理によってスループットを高めたい場合
- 中断箇所からの再開と失敗時の自動復旧が必要な取り込み処理

---

## ダウンロードとインストール {#download-and-installation}

| リソース | アドレス |
|---|---|
| ソースコード | [https://github.com/apache/doris-streamloader](https://github.com/apache/doris-streamloader) |
| バイナリのダウンロード | [https://doris.apache.org/download](https://doris.apache.org/download) |

:::note
ダウンロードしたファイルは実行可能なバイナリです。追加のコンパイルやインストールは必要ありません。
:::

---

## 使い方 {#usage}

### 基本的なコマンド形式 {#basic-command-format}

```shell
doris-streamloader \
    --source_file={FILE_LIST} \
    --url={FE_OR_BE_SERVER_URL}:{PORT} \
    --header={STREAMLOAD_HEADER} \
    --db={TARGET_DATABASE} \
    --table={TARGET_TABLE}
```

### 必須パラメータ {#required-parameters}

| パラメータ | 意味 |
|---|---|
| `--source_file` | 取り込むデータファイルの一覧。単一ファイル、ディレクトリ、ワイルドカード、カンマ区切りの一覧に対応します |
| `--url` | Doris FE または BE のサービスアドレス。形式は `http://host:port` です |
| `--header` | Stream Load のヘッダーパラメータ。複数のパラメータは `?` で区切ります |
| `--db` | 対象データベースの名前 |
| `--table` | 対象テーブルの名前 |

### `source_file` で指定できる形式 {#formats-supported-by-source_file}

`--source_file` パラメータは、以下の五つの形式に対応しています。用途に応じて選択してください。

#### 1. 単一ファイル {#1-a-single-file}

たとえば、単一のファイル `file.csv` を取り込む場合は次のように指定します。

```shell
doris-streamloader --source_file="file.csv" --url="http://localhost:8330" --header="column_separator:|?columns:col1,col2" --db="testdb" --table="testtbl"
```

#### 2. 単一ディレクトリ {#2-a-single-directory}

たとえば、ディレクトリ `dir` を取り込む場合は次のように指定します。

```shell
doris-streamloader --source_file="dir" --url="http://localhost:8330" --header="column_separator:|?columns:col1,col2" --db="testdb" --table="testtbl"
```

#### 3. ワイルドカードを含むファイル名（引用符で囲む必要があります） {#3-a-file-name-with-wildcards-must-be-quoted}

たとえば、`file0.csv`、`file1.csv`、`file2.csv` を取り込む場合は次のように指定します。

```shell
doris-streamloader --source_file="file*" --url="http://localhost:8330" --header="column_separator:|?columns:col1,col2" --db="testdb" --table="testtbl"
```

#### 4. カンマ区切りのファイル名一覧 {#4-a-comma-separated-list-of-file-names}

たとえば、`file0.csv`、`file1.csv`、`file2.csv` を取り込む場合は次のように指定します。

```shell
doris-streamloader --source_file="file0.csv,file1.csv,file2.csv" --url="http://localhost:8330" --header="column_separator:|?columns:col1,col2" --db="testdb" --table="testtbl"
```

#### 5. カンマ区切りのディレクトリ一覧 {#5-a-comma-separated-list-of-directories}

たとえば、`dir1`、`dir2`、`dir3` を取り込む場合は次のように指定します。

```shell
doris-streamloader --source_file="dir1,dir2,dir3" --url="http://localhost:8330" --header="column_separator:|?columns:col1,col2" --db="testdb" --table="testtbl"
```

### ヘッダーパラメータ {#header-parameter}

`--header` には Stream Load のすべてのパラメータを指定できます。複数のパラメータは `?` で区切ります。

例：

```shell
doris-streamloader --source_file="data.csv" --url="http://localhost:8330" --header="column_separator:|?columns:col1,col2" --db="testdb" --table="testtbl"
```

---

## オプションパラメータ {#optional-parameters}

上記の必須パラメータに加えて、取り込み動作を細かく制御するためのオプションパラメータがあります。以下の表では機能別にまとめています。

### 認証と転送 {#authentication-and-transport}

| パラメータ | 意味 | デフォルト値 | 推奨設定 |
|---|---|---|---|
| `--u` | データベースのユーザー名 | `root` | —— |
| `--p` | データベースユーザーのパスワード | 空文字列 | —— |
| `--compress` | HTTP 転送時にデータを圧縮するかどうか | `false` | 通常はデフォルト値を使用します。圧縮を有効にすると、圧縮と展開によってツールと Doris BE の両方で CPU 負荷が増えます。データソース側のマシンでネットワーク帯域幅がボトルネックになっている場合にのみ有効にしてください |
| `--timeout` | Doris に送信する HTTP リクエストのタイムアウト（秒） | `60*60*10` | デフォルト値を使用します |

### バッチ処理と並列処理 {#batch-and-concurrency}

| パラメータ | 意味 | デフォルト値 | 推奨設定 |
|---|---|---|---|
| `--batch` | ファイルをバッチ単位で読み込んで送信する際の粒度（行数） | `4096` | デフォルト値を使用します |
| `--batch_byte` | ファイルをバッチ単位で読み込んで送信する際の粒度（バイト数） | `943718400` (900 MB) | デフォルト値を使用します |
| `--workers` | 取り込み時の並列数 | `0` | `0` に設定すると自動モードになり、取り込むデータのサイズ、ディスクのスループット、Stream Load の取り込み速度に基づいて値が計算されます。手動で設定することもできます。高性能なクラスターでは適度に増やせますが、**10 を超えないことを推奨します**。Memtracker や Exceed のログで取り込み時のメモリ使用量が多すぎることが確認された場合は、適度に減らしてください |
| `--disk_throughput` | ディスクのスループット（MB/s） | `800` | 通常はデフォルト値を使用します。この値は `--workers` の自動計算に使用されます。適切な `workers` 数を計算させたい場合は、実際のディスクスループットに基づいて設定できます |
| `--streamload_throughput` | Stream Load の実際の取り込みスループット（MB/s） | `100` | 通常はデフォルト値を使用します。この値は `--workers` の自動計算に使用されます。デフォルト値は日次の性能テスト環境から得られたものです。適切な `workers` 数を計算させたい場合は、実測したスループットに基づいて設定できます。計算式は `(LoadBytes*1000) / (LoadTimeMs*1024*1024)` です |
| `--max_byte_per_task` | 一つの取り込みタスクが扱うデータ量の上限。超過分は新しいタスクに分割されます | `107374182400` (100 GB) | 取り込みバージョンの数を減らすため、大きめの値を推奨します。ただし、`body exceed max size` エラーが発生し、`streaming_load_max_mb` を調整したくない場合や、`-238 TOO MANY SEGMENT` が発生した場合は、一時的に値を小さくできます |

### データ検証とログ {#data-validation-and-logs}

| パラメータ | 意味 | デフォルト値 | 推奨設定 |
|---|---|---|---|
| `--check_utf8` | 取り込むデータのエンコーディングを確認するかどうか。`false` は確認を省略して元のデータをそのまま取り込み、`true` は UTF-8 ではない文字を `�` に置き換えます | `true` | デフォルト値を使用します |
| `--debug` | デバッグログを出力するかどうか | `false` | デフォルト値を使用します |
| `--log_filename` | ログの保存先 | `""` | デフォルトではコンソールに出力されます。ファイルに書き込む場合は、`--log_filename="/var/log"` のようにパスを指定します |

### 失敗時のリトライ {#failure-retry}

| パラメータ | 意味 | デフォルト値 | 推奨設定 |
|---|---|---|---|
| `--auto_retry` | 自動リトライするワーカー番号とタスク番号の一覧 | 空文字列 | 取り込みに失敗した場合にのみ使用します。通常の取り込み時には設定する必要はありません。失敗時に具体的なパラメータ値が表示されるので、それをコピーして実行してください。たとえば、`--auto_retry="1,1,2,1"` は、最初のワーカーの最初のタスクと、二番目のワーカーの最初のタスクを再試行することを意味します |
| `--auto_retry_times` | 自動リトライの回数 | `3` | デフォルト値を使用します。リトライを無効にするには `0` に設定します |
| `--auto_retry_interval` | 自動リトライの間隔（秒） | `60` | デフォルト値を使用します。Doris の停止が原因で失敗する場合は、実際の再起動時間に合わせて設定します |

---

## 実行結果 {#result}

取り込みの成否にかかわらず、ツールは終了時に最終結果を表示します。

### 結果のフィールド {#result-fields}

| フィールド | 説明 |
|---|---|
| `Status` | 取り込みの状態。`Success` は成功、`Failed` は失敗を意味します |
| `TotalRows` | 取り込み対象ファイルの総行数 |
| `FailLoadRows` | 取り込み対象だったものの、取り込まれなかった行数 |
| `LoadedRows` | 実際に Doris に取り込まれた行数 |
| `FilteredRows` | 取り込み中に Doris によって除外された行数 |
| `UnselectedRows` | 取り込み中に Doris によって無視された行数 |
| `LoadBytes` | 実際に取り込まれたバイト数 |
| `LoadTimeMs` | 実際の取り込み時間（ミリ秒） |
| `LoadFiles` | 実際に取り込まれたファイルの一覧 |

### 成功例 {#success-example}

取り込みが成功すると、次のように出力されます。

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

### 失敗例 {#failure-example}

一部のデータの取り込みに失敗すると、ツールはまずリトライ用のコマンドを表示します。

```Go
load has some error, and auto retry failed, you can retry by :
./doris-streamloader --source_file /mnt/disk1/laihui/doris/tools/tpch-tools/bin/tpch-data/lineitem.tbl.1  --url="http://127.0.0.1:8239" --header="column_separator:|?columns: l_orderkey, l_partkey, l_suppkey, l_linenumber, l_quantity, l_extendedprice, l_discount, l_tax, l_returnflag,l_linestatus, l_shipdate,l_commitdate,l_receiptdate,l_shipinstruct,l_shipmode,l_comment,temp" --db="db" --table="lineitem1" -u root -p "" --compress=false --timeout=36000 --workers=3 --batch=4096 --batch_byte=943718400 --max_byte_per_task=1073741824 --check_utf8=true --report_duration=1 --auto_retry="2,1;1,1;0,1" --auto_retry_times=0 --auto_retry_interval=60
```

このコマンドをコピーして実行すると、手動でリトライできます。`auto_retry` の意味は、上記のパラメータの説明を参照してください。その後、失敗結果が表示されます。

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

---

## ベストプラクティス {#best-practices}

### 推奨パラメータ {#recommended-parameters}

1. **必須パラメータ**：以下のパラメータを設定する必要があります。

    ```text
    --source_file=FILE_LIST
    --url=FE_OR_BE_SERVER_URL_WITH_PORT
    --header=STREAMLOAD_HEADER
    --db=TARGET_DATABASE
    --table=TARGET_TABLE
    ```

    **複数のファイルを取り込むには、`source_file` を使用してください。**

2. **`workers`**：デフォルト値は `0` で、自動モードが有効になります。ツールは取り込むデータのサイズ、`disk_throughput`、`streamload_throughput` から値を計算し、通常は 1、2、4、8 のいずれかになります。手動設定も可能です。高性能なクラスターでは増やせますが、**10 を超えないことを推奨します**。**手動設定でよく使われる値は `8` です**。

3. **`max_byte_per_task`**：大きな値にすると、取り込みバージョンの数が減ります。ただし、`body exceed max size` エラーが発生し、`streaming_load_max_mb` を調整したくない場合や、`-238 TOO MANY SEGMENT` エラーが発生した場合は、一時的に値を小さくできます。**通常はデフォルト値で問題ありません。**

4. **バージョン数に影響する二つの主要パラメータ**：

    | パラメータ | 影響 | 推奨設定 |
    |---|---|---|
    | `workers` | ワーカー数が多いほど、バージョン数と並列数が増えます | 通常は `8` を使用します |
    | `max_byte_per_task` | 値が大きいほど、一つのバージョンに含まれるデータが増えてバージョン数が減ります。ただし、大きすぎると `-238 TOO MANY SEGMENT` が発生する可能性があります | 通常はデフォルト値を使用します |

### 推奨コマンド {#recommended-command}

ほとんどのケースでは、必須パラメータを設定し、`workers` を `8` に設定すれば十分です。

```shell
./doris-streamloader \
    --source_file="demo.csv,demoFile*.csv,demoDir" \
    --url="http://127.0.0.1:8030" \
    --header="column_separator:," \
    --db="demo" \
    --table="test_load" \
    --u="root" \
    --workers=8
```

---

## よくある質問 {#faq}

### 1. 取り込み中に一部のサブタスクが失敗した場合はどうすればよいですか？ {#1-what-should-i-do-if-some-subtasks-fail-during-import}

ツールが自動的にリトライします。それでも失敗した場合は、手動リトライ用のコマンドが表示されます。そのコマンドをコピーして実行してください。テーブルを削除して再度取り込む必要はありません。

### 2. 一つの取り込みが BE のデフォルトの `streaming_load_max_mb` 閾値を超える場合はどうすればよいですか？ {#2-what-if-a-single-import-exceeds-the-be-default-streaming_load_max_mb-threshold}

ツールのタスクあたりのデフォルト上限は 100 GB で、Doris 3.0.2 以降（2.1 系列では 2.1.7 以降）の `streaming_load_max_mb` のソースコード上のデフォルト値である 102400 MB と一致します。Doris 3.0.0 と 3.0.1 では BE のデフォルト上限は 10 GB、4.x と dev では 100 GB です。実際に適用されている BE の設定は異なる場合があります。タスクが実際の上限を超える場合は、`--max_byte_per_task` を小さくしてバッチを分割するか、管理者に動的に変更可能な `streaming_load_max_mb` パラメータの調整を依頼してください。BE の再起動は不要です。

ADMIN_PRIV 権限を持つユーザーは、SQL を使用して各 BE に適用されている設定を確認できます。マネージドクラウドサービスでは、サービスが提供する設定方法を使用するか、管理者に問い合わせてください。BE ホストに直接アクセスする必要はありません。

```sql
SHOW BACKEND CONFIG LIKE 'streaming_load_max_mb';
```

### 3. `-238 TOO MANY SEGMENT` エラーが発生した場合はどうすればよいですか？ {#3-what-should-i-do-when-the--238-too-many-segment-error-occurs}

`--max_byte_per_task` パラメータの値を小さくすると、この問題を緩和できます。
