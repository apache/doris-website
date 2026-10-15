---
{
    "title": "Doris Streamloader",
    "language": "ja",
    "description": "Doris Streamloader は Apache Doris 公式のデータ取り込み用クライアントツールです。並列処理、複数ファイルの取り込み、途中からの再開、自動リトライに対応し、大量データの一括ロードに適しています。"
}
---

[Doris Streamloader](https://github.com/apache/doris-streamloader) は、Apache Doris データベースにデータを取り込むための専用クライアントツールです。`curl` を直接使用して単一の処理で取り込む方法と比べて、複数の処理を並列に実行でき、大量データのロードにかかる時間を大幅に短縮できます。

## 主な機能

| 機能 | 説明 |
|---|---|
| 並列取り込み | 複数のワーカーで Stream Load を並列実行します。並列度は `workers` パラメータで設定します |
| 複数ファイルの取り込み | 単一のタスクで複数のファイルやディレクトリを取り込みます。ワイルドカードによる指定に対応し、ディレクトリ内のすべてのファイルを再帰的に探索します |
| 途中からの再開 | 取り込み中に一部が失敗した場合、失敗した箇所から再開できます |
| 自動リトライ | 取り込みに失敗しても手動でリトライする必要はありません。デフォルトの回数まで自動的にリトライし、それでも失敗した場合は手動リトライ用のコマンドを表示します |

## ユースケース

- 大量データ（GB～TB 規模）を Doris に一括ロードする場合
- 複数のファイルやディレクトリをまとめて取り込む場合
- 取り込みの遅延が重要で、並列処理によってスループットを高める必要がある場合
- 途中からの再開や障害からの自動復旧が必要な、安定した取り込み処理を構築する場合

---

## ダウンロードとインストール

| リソース | アドレス |
|---|---|
| ソースコード | [https://github.com/apache/doris-streamloader](https://github.com/apache/doris-streamloader) |
| バイナリのダウンロード | [https://doris.apache.org/download](https://doris.apache.org/download) |

:::note
ダウンロードするファイルは実行可能なバイナリです。追加のコンパイルやインストールは不要です。
:::

---

## 使用方法

### 基本的なコマンド形式

```shell
doris-streamloader \
    --source_file={FILE_LIST} \
    --url={FE_OR_BE_SERVER_URL}:{PORT} \
    --header={STREAMLOAD_HEADER} \
    --db={TARGET_DATABASE} \
    --table={TARGET_TABLE}
```

### 必須パラメータ

| パラメータ | 説明 |
|---|---|
| `--source_file` | 取り込むデータファイルの一覧。単一ファイル、ディレクトリ、ワイルドカード、カンマ区切りのリストに対応します |
| `--url` | Doris FE または BE のサービスアドレス。形式は `http://host:port` です |
| `--header` | Stream Load のヘッダーパラメータ。複数のパラメータは `?` で区切ります |
| `--db` | 取り込み先のデータベース名 |
| `--table` | 取り込み先のテーブル名 |

### `source_file` で指定できる形式

`--source_file` パラメータは次の五つの形式に対応しています。用途に応じて選択できます。

#### 1. 単一ファイル

たとえば、単一ファイル `file.csv` を取り込む場合：

```shell
doris-streamloader --source_file="file.csv" --url="http://localhost:8330" --header="column_separator:|?columns:col1,col2" --db="testdb" --table="testtbl"
```

#### 2. 単一ディレクトリ

たとえば、ディレクトリ `dir` を取り込む場合：

```shell
doris-streamloader --source_file="dir" --url="http://localhost:8330" --header="column_separator:|?columns:col1,col2" --db="testdb" --table="testtbl"
```

#### 3. ワイルドカードを含むファイル名（引用符で囲む必要があります）

たとえば、`file0.csv`、`file1.csv`、`file2.csv` を取り込む場合：

```shell
doris-streamloader --source_file="file*" --url="http://localhost:8330" --header="column_separator:|?columns:col1,col2" --db="testdb" --table="testtbl"
```

#### 4. カンマ区切りのファイル名リスト

たとえば、`file0.csv`、`file1.csv`、`file2.csv` を取り込む場合：

```shell
doris-streamloader --source_file="file0.csv,file1.csv,file2.csv" --url="http://localhost:8330" --header="column_separator:|?columns:col1,col2" --db="testdb" --table="testtbl"
```

#### 5. カンマ区切りのディレクトリリスト

たとえば、`dir1`、`dir2`、`dir3` を取り込む場合：

```shell
doris-streamloader --source_file="dir1,dir2,dir3" --url="http://localhost:8330" --header="column_separator:|?columns:col1,col2" --db="testdb" --table="testtbl"
```

### ヘッダーパラメータ

`--header` には Stream Load のすべてのパラメータを指定できます。複数のパラメータは `?` で区切ります。

例：

```shell
doris-streamloader --source_file="data.csv" --url="http://localhost:8330" --header="column_separator:|?columns:col1,col2" --db="testdb" --table="testtbl"
```

---

## オプションパラメータ

上記の必須パラメータに加え、取り込み動作を細かく制御するためのオプションパラメータがあります。以下の表では、機能別にまとめています。

### 認証と転送

| パラメータ | 説明 | デフォルト | 推奨設定 |
|---|---|---|---|
| `--u` | データベースのユーザー名 | `root` | —— |
| `--p` | データベースユーザーのパスワード | 空文字列 | —— |
| `--compress` | HTTP 転送時にデータを圧縮するかどうか | `false` | 通常はデフォルトのままにします。圧縮を有効にすると、圧縮と展開のためにツールと Doris BE の両方で CPU 負荷が増加します。データソース側のマシンのネットワーク帯域幅がボトルネックの場合にのみ有効にしてください |
| `--timeout` | Doris に送信する HTTP リクエストのタイムアウト（秒） | `60*60*10` | デフォルトのままにします |

### バッチ処理と並列度

| パラメータ | 説明 | デフォルト | 推奨設定 |
|---|---|---|---|
| `--batch` | ファイルをバッチ単位で読み取り、送信する際の粒度（行数） | `4096` | デフォルトのままにします |
| `--batch_byte` | ファイルをバッチ単位で読み取り、送信する際の粒度（バイト数） | `943718400` (900 MB) | デフォルトのままにします |
| `--workers` | 取り込みの並列度 | `0` | `0` に設定すると自動モードになり、取り込むデータのサイズ、ディスクのスループット、Stream Load の取り込み速度に基づいて値が計算されます。手動での設定も可能です。高性能なクラスタでは適宜増やせますが、**10 以下を推奨します**。取り込み時のメモリ使用量が多すぎる場合（Memtracker または Exceed ログで確認できます）は、適宜減らしてください |
| `--disk_throughput` | ディスクのスループット（MB/s） | `800` | 通常はデフォルトのままにします。この値は `--workers` の自動計算に使用されます。適切な `workers` 数を計算させたい場合は、実際のディスクスループットに合わせて設定できます |
| `--streamload_throughput` | Stream Load の実際の取り込みスループット（MB/s） | `100` | 通常はデフォルトのままにします。この値は `--workers` の自動計算に使用されます。デフォルト値は日次の性能テスト環境に基づいています。適切な `workers` 数を計算させたい場合は、測定したスループットを次の式で求めて設定できます：`(LoadBytes*1000) / (LoadTimeMs*1024*1024)` |
| `--max_byte_per_task` | 取り込みタスクあたりのデータ量の上限。超過分は新しいタスクに分割されます | `107374182400` (100 GB) | 取り込みで生成されるバージョン数を減らすため、大きめの値を推奨します。ただし、`body exceed max size` エラーが発生し、BE の再起動が必要な `streaming_load_max_mb` の変更を避けたい場合や、`-238 TOO MANY SEGMENT` が発生した場合は、一時的に値を下げられます |

### データ検証とログ

| パラメータ | 説明 | デフォルト | 推奨設定 |
|---|---|---|---|
| `--check_utf8` | 取り込むデータのエンコーディングをチェックするかどうか。`false` はチェックを省略して元のデータを取り込み、`true` は UTF-8 以外の文字を `�` に置き換えます | `true` | デフォルトのままにします |
| `--debug` | デバッグログを出力するかどうか | `false` | デフォルトのままにします |
| `--log_filename` | ログの保存先 | `""` | デフォルトではログがコンソールに出力されます。ファイルに出力するには、たとえば `--log_filename="/var/log"` のようにパスを指定します |

### 失敗時のリトライ

| パラメータ | 説明 | デフォルト | 推奨設定 |
|---|---|---|---|
| `--auto_retry` | 自動的にリトライするワーカー番号とタスク番号のリスト | 空文字列 | 取り込みに失敗した場合にのみ使用します。通常の取り込み時に設定する必要はありません。失敗時には具体的なパラメータ値が表示されるため、それをコピーして実行してください。たとえば、`--auto_retry="1,1,2,1"` は、最初のワーカーの最初のタスクと、二番目のワーカーの最初のタスクをリトライすることを意味します |
| `--auto_retry_times` | 自動リトライの回数 | `3` | デフォルトのままにします。リトライを無効にするには `0` に設定します |
| `--auto_retry_interval` | 自動リトライの間隔（秒） | `60` | デフォルトのままにします。Doris の停止が原因で失敗する場合は、実際の再起動時間に合わせて設定します |

---

## 結果

取り込みの成否にかかわらず、ツールは処理の終了時に最終結果を表示します。

### 結果のフィールド

| フィールド | 説明 |
|---|---|
| `Status` | 取り込みの状態。`Success` は成功、`Failed` は失敗を意味します |
| `TotalRows` | 取り込み対象ファイルの総行数 |
| `FailLoadRows` | 取り込む予定だったものの、取り込まれなかった行数 |
| `LoadedRows` | Doris に実際に取り込まれた行数 |
| `FilteredRows` | 取り込み時に Doris によってフィルタリングされた行数 |
| `UnselectedRows` | 取り込み時に Doris によって無視された行数 |
| `LoadBytes` | 実際に取り込まれたバイト数 |
| `LoadTimeMs` | 実際の取り込み時間（ミリ秒） |
| `LoadFiles` | 実際に取り込まれたファイルの一覧 |

### 成功例

取り込みに成功すると、次のように出力されます：

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

### 失敗例

一部のデータを取り込めなかった場合、ツールはまずリトライ用のコマンドを表示します：

```Go
load has some error, and auto retry failed, you can retry by :
./doris-streamloader --source_file /mnt/disk1/laihui/doris/tools/tpch-tools/bin/tpch-data/lineitem.tbl.1  --url="http://127.0.0.1:8239" --header="column_separator:|?columns: l_orderkey, l_partkey, l_suppkey, l_linenumber, l_quantity, l_extendedprice, l_discount, l_tax, l_returnflag,l_linestatus, l_shipdate,l_commitdate,l_receiptdate,l_shipinstruct,l_shipmode,l_comment,temp" --db="db" --table="lineitem1" -u root -p "" --compress=false --timeout=36000 --workers=3 --batch=4096 --batch_byte=943718400 --max_byte_per_task=1073741824 --check_utf8=true --report_duration=1 --auto_retry="2,1;1,1;0,1" --auto_retry_times=0 --auto_retry_interval=60
```

このコマンドをコピーして実行すると、手動でリトライできます。`auto_retry` の意味は上記のパラメータの項目で説明しています。その後、失敗結果が表示されます：

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

## ベストプラクティス

### 推奨パラメータ

1. **必須パラメータ**：次のパラメータを設定する必要があります：

    ```text
    --source_file=FILE_LIST
    --url=FE_OR_BE_SERVER_URL_WITH_PORT
    --header=STREAMLOAD_HEADER
    --db=TARGET_DATABASE
    --table=TARGET_TABLE
    ```

    **複数のファイルを取り込む場合は、`source_file` を使用してください。**

2. **`workers`**：デフォルト値は `0` で、自動モードになります（ツールが取り込みサイズ、`disk_throughput`、`streamload_throughput` から値を計算し、通常は 1、2、4、8 のいずれかになります）。手動で設定することもできます。高性能なクラスタでは増やせますが、**10 以下を推奨します**。**手動設定でよく使われる値は `8` です**。

3. **`max_byte_per_task`**：値を大きくすると取り込みで生成されるバージョン数が減ります。ただし、`body exceed max size` エラーが発生し、BE の再起動が必要な `streaming_load_max_mb` の変更を避けたい場合や、`-238 TOO MANY SEGMENT` エラーが発生した場合は、この値を一時的に下げられます。**通常はデフォルト値を使用できます。**

4. **バージョン数に影響する二つの主要パラメータ**：

    | パラメータ | 影響 | 推奨設定 |
    |---|---|---|
    | `workers` | ワーカー数を増やすと、バージョン数と並列度が増えます | 通常は `8` を使用します |
    | `max_byte_per_task` | 値を大きくすると各バージョンのデータ量が増えてバージョン数が減りますが、大きすぎると `-238 TOO MANY SEGMENT` が発生する可能性があります | 通常はデフォルト値を使用します |

### 推奨コマンド

ほとんどの場合、必須パラメータと `workers` を `8` に設定すれば十分です：

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

## FAQ

### 1. 取り込み中に一部のサブタスクが失敗した場合はどうすればよいですか？

ツールは自動的にリトライします。それでも失敗した場合は、手動リトライ用のコマンドが表示されます。そのコマンドをコピーして実行してください。テーブルを削除して再度取り込む必要はありません。

### 2. 単一の取り込みが BE のデフォルトの `streaming_load_max_mb` 閾値を超える場合はどうすればよいですか？

ツールの取り込みあたりのデフォルトの上限は 100 GB で、BE の `streaming_load_max_mb` 閾値を超える可能性があります。BE の再起動を避けるには、`--max_byte_per_task` パラメータを小さくしてください。

`streaming_load_max_mb` の値を確認するには：

```shell
curl "http://127.0.0.1:8040/api/show_config"
```

### 3. `-238 TOO MANY SEGMENT` エラーが発生した場合はどうすればよいですか？

`--max_byte_per_task` パラメータを小さくすると、この問題を緩和できます。
