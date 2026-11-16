---
{
    "title": "Doris Streamloader",
    "language": "ja",
    "description": "Doris Streamloader は、Apache Doris 公式のデータ取り込み用クライアントツールです。複数ワーカーによる並列インポート、複数ファイルのインポート、中断箇所からの再開、自動再試行に対応し、大量データの一括データロードに適しています。"
}
---

[Doris Streamloader](https://github.com/apache/doris-streamloader) は、Apache Doris データベースにデータを取り込むための専用クライアントツールです。`curl` を直接使う単一ワーカーでのインポートと比べ、複数ワーカーによる並列インポートが可能で、大量データのデータロードにかかる時間を大幅に短縮できます。

## 主な機能 {#core-features}

| 機能 | 説明 |
|---|---|
| 並列インポート | 複数のワーカーで Stream Load を実行します。並列度は `workers` パラメータで設定します |
| 複数ファイルのインポート | 一度のタスクで複数のファイルやディレクトリをインポートします。ワイルドカードによる指定に対応し、ディレクトリ内のすべてのファイルを再帰的に取得します |
| 中断箇所からの再開 | インポート中に一部が失敗した場合、失敗した箇所から再開できます |
| 自動再試行 | インポートが失敗しても、手動で再試行する必要はありません。ツールが既定の回数まで自動的に再試行します。それでも失敗した場合は、手動で再試行するためのコマンドを表示します |

## 利用シーン {#use-cases}

- 大量のデータ（GB～TB 規模）を Doris に一括でデータロードする場合
- 複数のファイルやディレクトリをまとめてインポートする場合
- インポート時間を短縮するために、並列処理でスループットを高めたい場合
- 中断箇所からの再開と失敗時の自動復旧が必要な、安定したインポート処理を構築する場合

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
| `--source_file` | インポートするデータファイルのリスト。単一ファイル、ディレクトリ、ワイルドカード、カンマ区切りのリストを指定できます |
| `--url` | Doris FE または BE のサービスアドレス。形式は `http://host:port` です |
| `--header` | Stream Load のヘッダーパラメータ。複数のパラメータは `?` で区切ります |
| `--db` | インポート先のデータベース名 |
| `--table` | インポート先のテーブル名 |

### `source_file` で指定できる形式 {#formats-supported-by-source_file}

`--source_file` パラメータには、次の五つの形式を指定できます。用途に合わせて選択してください。

#### 1. 単一ファイル {#1-a-single-file}

たとえば、単一ファイル `file.csv` をインポートする場合：

```shell
doris-streamloader --source_file="file.csv" --url="http://localhost:8330" --header="column_separator:|?columns:col1,col2" --db="testdb" --table="testtbl"
```

#### 2. 単一ディレクトリ {#2-a-single-directory}

たとえば、ディレクトリ `dir` をインポートする場合：

```shell
doris-streamloader --source_file="dir" --url="http://localhost:8330" --header="column_separator:|?columns:col1,col2" --db="testdb" --table="testtbl"
```

#### 3. ワイルドカードを含むファイル名（引用符で囲む必要があります） {#3-a-file-name-with-wildcards-must-be-quoted}

たとえば、`file0.csv`、`file1.csv`、`file2.csv` をインポートする場合：

```shell
doris-streamloader --source_file="file*" --url="http://localhost:8330" --header="column_separator:|?columns:col1,col2" --db="testdb" --table="testtbl"
```

#### 4. カンマ区切りのファイル名リスト {#4-a-comma-separated-list-of-file-names}

たとえば、`file0.csv`、`file1.csv`、`file2.csv` をインポートする場合：

```shell
doris-streamloader --source_file="file0.csv,file1.csv,file2.csv" --url="http://localhost:8330" --header="column_separator:|?columns:col1,col2" --db="testdb" --table="testtbl"
```

#### 5. カンマ区切りのディレクトリリスト {#5-a-comma-separated-list-of-directories}

たとえば、`dir1`、`dir2`、`dir3` をインポートする場合：

```shell
doris-streamloader --source_file="dir1,dir2,dir3" --url="http://localhost:8330" --header="column_separator:|?columns:col1,col2" --db="testdb" --table="testtbl"
```

### Header パラメータ {#header-parameter}

`--header` には Stream Load のすべてのパラメータを指定できます。複数のパラメータは `?` で区切ります。

例：

```shell
doris-streamloader --source_file="data.csv" --url="http://localhost:8330" --header="column_separator:|?columns:col1,col2" --db="testdb" --table="testtbl"
```

---

## オプションパラメータ {#optional-parameters}

上記の必須パラメータに加え、インポートの動作を細かく制御するためのオプションパラメータがあります。以下では機能別に示します。

### 認証と転送 {#authentication-and-transport}

| パラメータ | 意味 | デフォルト値 | 推奨設定 |
|---|---|---|---|
| `--u` | データベースのユーザー名 | `root` | —— |
| `--p` | データベースユーザーのパスワード | 空文字列 | —— |
| `--compress` | HTTP 転送中にデータを圧縮するかどうか | `false` | 通常はデフォルト値を使用します。圧縮を有効にすると、圧縮と展開のためにツールと Doris BE の両方で CPU 負荷が増えます。データソースのマシンのネットワーク帯域幅がボトルネックになっている場合にのみ有効にしてください |
| `--timeout` | Doris に送信する HTTP リクエストのタイムアウト（秒） | `60*60*10` | デフォルト値を使用します |

### バッチ処理と並列処理 {#batch-and-concurrency}

| パラメータ | 意味 | デフォルト値 | 推奨設定 |
|---|---|---|---|
| `--batch` | ファイルをバッチ単位で読み取り、送信するときの粒度（行数） | `4096` | デフォルト値を使用します |
| `--batch_byte` | ファイルをバッチ単位で読み取り、送信するときの粒度（バイト数） | `943718400` (900 MB) | デフォルト値を使用します |
| `--workers` | インポートの並列度 | `0` | `0` に設定すると自動モードになり、インポートするデータのサイズ、ディスクのスループット、Stream Load のインポート速度に基づいて値が計算されます。手動でも設定できます。高性能なクラスタでは適宜増やせますが、**10 を超えない設定を推奨します**。Memtracker や Exceed のログでインポート時のメモリ使用量が高すぎると分かった場合は、適宜減らしてください |
| `--disk_throughput` | ディスクのスループット（MB/s） | `800` | 通常はデフォルト値を使用します。この値は `--workers` の自動計算に使われます。適切な `workers` 数を計算させたい場合は、実際のディスクスループットに合わせて設定できます |
| `--streamload_throughput` | 実際の Stream Load インポートスループット（MB/s） | `100` | 通常はデフォルト値を使用します。この値は `--workers` の自動計算に使われます。デフォルト値は日次の性能テスト環境から得られたものです。適切な `workers` 数を計算させたい場合は、実測したスループットに合わせて設定できます。計算式は `(LoadBytes*1000) / (LoadTimeMs*1024*1024)` です |
| `--max_byte_per_task` | インポートタスクごとのデータ量の上限。上限を超えるデータは新しいタスクに分割されます | `107374182400` (100 GB) | インポートのバージョン数を減らすため、大きめの値を推奨します。ただし、`body exceed max size` エラーが発生し、`streaming_load_max_mb` を調整したくない場合や、`-238 TOO MANY SEGMENT` が発生した場合は、一時的に値を下げられます |

### データ検証とログ {#data-validation-and-logs}

| パラメータ | 意味 | デフォルト値 | 推奨設定 |
|---|---|---|---|
| `--check_utf8` | インポートするデータのエンコーディングを確認するかどうか。`false` は確認を省略して元のデータをそのままインポートし、`true` は UTF-8 以外の文字を `�` に置き換えます | `true` | デフォルト値を使用します |
| `--debug` | デバッグログを出力するかどうか | `false` | デフォルト値を使用します |
| `--log_filename` | ログの保存先 | `""` | デフォルトではコンソールに出力されます。ファイルに書き込む場合は、`--log_filename="/var/log"` のようにパスを指定します |

### 失敗時の再試行 {#failure-retry}

| パラメータ | 意味 | デフォルト値 | 推奨設定 |
|---|---|---|---|
| `--auto_retry` | 自動で再試行するワーカー番号とタスク番号のリスト | 空文字列 | インポートが失敗した場合にのみ使用します。通常のインポートでは設定不要です。失敗時に具体的なパラメータ値が表示されるので、そのままコピーして実行してください。たとえば、`--auto_retry="1,1,2,1"` は、最初のワーカーの最初のタスクと、次のワーカーの最初のタスクを再試行することを意味します |
| `--auto_retry_times` | 自動再試行の回数 | `3` | デフォルト値を使用します。再試行を無効にする場合は `0` に設定します |
| `--auto_retry_interval` | 自動再試行の間隔（秒） | `60` | デフォルト値を使用します。Doris の停止が原因で失敗する場合は、実際の再起動所要時間に合わせて設定してください |

---

## 結果 {#result}

インポートの成否にかかわらず、ツールは処理の終了時に最終結果を出力します。

### 結果のフィールド {#result-fields}

| フィールド | 説明 |
|---|---|
| `Status` | インポートの状態。`Success` は成功、`Failed` は失敗を意味します |
| `TotalRows` | インポート対象ファイル内の総行数 |
| `FailLoadRows` | インポート対象だったものの、インポートされなかった行数 |
| `LoadedRows` | 実際に Doris にインポートされた行数 |
| `FilteredRows` | インポート中に Doris によって除外された行数 |
| `UnselectedRows` | インポート中に Doris によって無視された行数 |
| `LoadBytes` | 実際にインポートされたバイト数 |
| `LoadTimeMs` | 実際のインポート所要時間（ミリ秒） |
| `LoadFiles` | 実際にインポートされたファイルのリスト |

### 成功例 {#success-example}

インポートに成功した場合の出力は次のとおりです。

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

一部のデータのインポートに失敗した場合、ツールはまず再試行用のコマンドを出力します。

```Go
load has some error, and auto retry failed, you can retry by :
./doris-streamloader --source_file /mnt/disk1/laihui/doris/tools/tpch-tools/bin/tpch-data/lineitem.tbl.1  --url="http://127.0.0.1:8239" --header="column_separator:|?columns: l_orderkey, l_partkey, l_suppkey, l_linenumber, l_quantity, l_extendedprice, l_discount, l_tax, l_returnflag,l_linestatus, l_shipdate,l_commitdate,l_receiptdate,l_shipinstruct,l_shipmode,l_comment,temp" --db="db" --table="lineitem1" -u root -p "" --compress=false --timeout=36000 --workers=3 --batch=4096 --batch_byte=943718400 --max_byte_per_task=1073741824 --check_utf8=true --report_duration=1 --auto_retry="2,1;1,1;0,1" --auto_retry_times=0 --auto_retry_interval=60
```

このコマンドをコピーして実行すると、手動で再試行できます。`auto_retry` の意味は、前述のパラメータの説明を参照してください。続いて、失敗結果が出力されます。

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

    **複数のファイルをインポートする場合は、`source_file` を使用してください。**

2. **`workers`**：デフォルト値は `0` です。自動モードでは、インポートするデータのサイズ、`disk_throughput`、`streamload_throughput` から値が計算され、通常は 1、2、4、8 のいずれかになります。手動での設定も可能です。高性能なクラスタでは値を増やせますが、**10 を超えない設定を推奨します**。**手動設定では `8` がよく使われます**。

3. **`max_byte_per_task`**：値を大きくすると、インポートのバージョン数を減らせます。ただし、`body exceed max size` エラーが発生し、`streaming_load_max_mb` を調整したくない場合や、`-238 TOO MANY SEGMENT` エラーが発生した場合は、一時的に値を下げられます。**通常はデフォルト値で十分です。**

4. **バージョン数に影響する二つの主要なパラメータ**：

    | パラメータ | 影響 | 推奨設定 |
    |---|---|---|
    | `workers` | ワーカー数を増やすと、バージョン数と並列度が増えます | 通常は `8` を使用します |
    | `max_byte_per_task` | 値を大きくすると、バージョンごとのデータ量が増え、バージョン数は減ります。ただし、大きすぎると `-238 TOO MANY SEGMENT` が発生する可能性があります | 通常はデフォルト値を使用します |

### 推奨コマンド {#recommended-command}

ほとんどの場合、必須パラメータを設定し、`workers` を `8` に設定すれば十分です。

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

### 1. インポート中に一部のサブタスクが失敗した場合はどうすればよいですか？ {#1-what-should-i-do-if-some-subtasks-fail-during-import}

ツールが自動的に再試行します。それでも失敗した場合は、手動で再試行するためのコマンドが表示されます。そのコマンドをコピーして実行してください。テーブルを削除して再インポートする必要はありません。

### 2. 単一のインポートが BE のデフォルトの `streaming_load_max_mb` しきい値を超える場合はどうすればよいですか？ {#2-what-if-a-single-import-exceeds-the-be-default-streaming_load_max_mb-threshold}

ツールのタスクごとのデフォルト上限は 100 GB です。これは Doris 3.0.2 以降（2.1 系では 2.1.7 以降）の `streaming_load_max_mb` のソースコード上のデフォルト値である 102400 MB と一致します。Doris 3.0.0 と 3.0.1 では BE のデフォルト上限は 10 GB、4.x と dev では 100 GB です。実際の BE 設定は異なる場合があります。タスクが実際の上限を超える場合は、`--max_byte_per_task` を小さくしてバッチを分割するか、管理者に動的変更が可能な `streaming_load_max_mb` パラメータの調整を依頼してください。BE の再起動は不要です。

ADMIN_PRIV 権限を持つユーザーは、SQL を使って各 BE の実際の設定を確認できます。マネージドクラウドサービスでは、サービスが提供する設定方法を利用するか、管理者に問い合わせてください。BE ホストに直接アクセスする必要はありません。

```sql
SHOW BACKEND CONFIG LIKE 'streaming_load_max_mb';
```

### 3. `-238 TOO MANY SEGMENT` エラーが発生した場合はどうすればよいですか？ {#3-what-should-i-do-when-the--238-too-many-segment-error-occurs}

`--max_byte_per_task` パラメータを小さくすると、この問題を緩和できます。
