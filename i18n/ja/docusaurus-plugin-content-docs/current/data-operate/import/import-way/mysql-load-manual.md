---
{
    "title": "MySQL Load",
    "language": "ja",
    "description": "MySQL 標準の LOAD DATA 構文を使用して、ローカルの CSV ファイルを Doris に同期的にインポートします。10 GB 未満のファイルに適しており、バッチ単位の原子性が保証されます。",
    "keywords": [
        "MySQL Load",
        "LOAD DATA",
        "ローカルファイルのインポート",
        "CSV インポート",
        "Doris の同期インポート",
        "local-infile",
        "allowLoadLocalInfile",
        "Stream Load"
    ]
}
---

<!-- Knowledge type: Operational steps + Configuration parameters -->
<!-- Applicable scenarios: Client-side local CSV file import / Program data stream import -->

Doris は MySQL プロトコルと互換性があるため、MySQL 標準の [LOAD DATA](https://dev.mysql.com/doc/refman/8.0/en/load-data.html) 構文を使用してローカルファイルをインポートできます。MySQL Load は**同期インポート方式**です。インポートが完了するとすぐに結果が返され、LOAD DATA ステートメントの戻り値から成功したかどうかを判断できます。

一般に、MySQL Load は 10 GB 未満のファイルのインポートに使用できます。ファイルが大きすぎる場合は、先に分割してから各部分を MySQL Load でインポートしてください。MySQL Load はバッチインポートタスクの**原子性**を保証します。すべての行が正常にインポートされるか、どの行もインポートされないかのいずれかです。

## ユースケース

### 適用シナリオ

MySQL Load は主に次のシナリオに適しています。

- クライアントから Doris への**ローカル CSV ファイル**のインポート。
- プログラムを介した**データストリーム**からのインポート。

### 制限事項

CSV ファイルをインポートする際は、**NULL 値（null）**と**空文字列（`''`）**を明確に区別する必要があります。

| データの種類 | 表記方法 | データ例 | 説明 |
| ------------ | ------------------ | ------------ | ------------------------------------------ |
| NULL 値（null） | `\N` | `a,\N,b` | 中央の列は NULL 値です。 |
| 空文字列 | 空のままにする | `a, ,b` | 中央の列は空文字列です。 |

## 基本原理

MySQL Load と Stream Load は機能が似ており、どちらもローカルファイルを Doris クラスターにインポートします。そのため、MySQL Load の実装では Stream Load の基本的なインポート機能を再利用しています。

MySQL Load の主な実行フローは次のとおりです。

1. ユーザーが FE に LOAD DATA リクエストを送信します。FE はリクエストを解析し、Stream Load としてラップします。
2. FE は BE ノードを選択し、Stream Load リクエストを送信します。
3. リクエストの送信中、FE は MySQL クライアントからローカルファイルのデータを非同期かつストリーミング方式で読み取り、Stream Load の HTTP リクエストにリアルタイムで送ります。
4. MySQL クライアントがデータの転送を終えると、FE は Stream Load の完了を待ち、インポートの成功または失敗の情報をクライアントに返します。

## クイックスタート

### 事前確認

MySQL Load を実行する前に、次の条件を満たしていることを確認してください。

- 現在のユーザーに対象テーブルの **INSERT 権限**があること。INSERT 権限がない場合は、`GRANT` コマンドで付与できます。

### インポートジョブの作成

次の四つの手順で、MySQL Load によるインポートを一通り実行します。

#### 1. テストデータを準備する

次のサンプルデータを含む `client_local.csv` というファイルを作成します。

```sql
1,10
2,20
3,30
4,40
5,50
6,60
```

#### 2. クライアントを接続する

LOAD DATA コマンドを実行する前に、MySQL クライアントで接続します。

```Shell
mysql --local-infile  -h <fe_ip> -P <fe_query_port> -u root -D testdb
```

:::caution
MySQL Load を実行する際は、クライアント接続で指定のオプションを使用する必要があります。

1. MySQL クライアントで接続する場合は、`--local-infile` オプションを指定してください。指定しないとエラーが報告されることがあります。
2. JDBC 経由で接続する場合は、URL に `allowLoadLocalInfile=true` を指定する必要があります。
:::

#### 3. テストテーブルを作成する

Doris で次のテーブルを作成します。

```sql
CREATE TABLE testdb.t1 (
    pk     INT, 
    v1     INT SUM
) AGGREGATE KEY (pk) 
DISTRIBUTED BY hash (pk);
```

#### 4. LOAD DATA インポートコマンドを実行する

MySQL クライアントで接続した後、次のコマンドでインポートジョブを作成します。

```sql
LOAD DATA LOCAL
INFILE 'client_local.csv'
INTO TABLE testdb.t1
COLUMNS TERMINATED BY ','
LINES TERMINATED BY '\n';
```

### インポートジョブの結果を確認する

MySQL Load は同期インポート方式のため、結果がコマンドライン上でユーザーに直接返されます。インポートが失敗した場合は、具体的なエラーメッセージが表示されます。

インポートが**成功した場合**は、インポートされた行数が返されます。

```sql
Query OK, 6 rows affected (0.17 sec)
Records: 6  Deleted: 0  Skipped: 0  Warnings: 0
```

インポートが**失敗した場合**は、クライアントに対応するエラーが表示されます。

```sql
ERROR 1105 (HY000): errCode = 2, detailMessage = [DATA_QUALITY_ERROR]too many filtered rows with load id b612907c-ccf4-4ac2-82fe-107ece655f0f
```

エラーメッセージには、このインポートの `loadId` が含まれます。`show load warnings` コマンドで詳細を確認できます。

```sql
show load warnings where label='b612907c-ccf4-4ac2-82fe-107ece655f0f';
```

### インポートジョブをキャンセルする

ユーザーは MySQL Load を**手動でキャンセルできません**。タイムアウトまたはインポートエラーが発生すると、システムが MySQL Load を自動的にキャンセルします。

## リファレンス

### インポート構文

LOAD DATA の完全な構文は次のとおりです。

```SQL
LOAD DATA LOCAL
INFILE '<load_data_file>'
INTO TABLE [<db_name>.]<table_name>
[PARTITION (partition_name [, partition_name] ...)]
[COLUMNS TERMINATED BY '<column_terminated_operator>']
[LINES TERMINATED BY '<line_terminated_operator>']
[IGNORE <ignore_lines> LINES]
[(col_name_or_user_var[, col_name_or_user_var] ...)]
[SET col_name={expr | DEFAULT}[, col_name={expr | DEFAULT}] ...]
[PROPERTIES (key1 = value1 [, key2=value2]) ]
```

各句の説明は次のとおりです。

| 句 | 説明 |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| INFILE | ローカルファイルのパスを指定します。相対パスまたは絶対パスを使用できます。現在、`load_data_file` では単一ファイルのインポートのみがサポートされています。 |
| INTO TABLE | データベース名とテーブル名を指定します。データベース名は省略できます。 |
| PARTITION | インポート先のパーティションを指定します。各行が属するパーティションを判断できる場合は、指定を推奨します。指定したパーティションに一致しない行は除外されます。 |
| COLUMNS TERMINATED BY | インポート時の列区切り文字を指定します。 |
| LINES TERMINATED BY | インポート時の行区切り文字を指定します。 |
| IGNORE num LINES | インポートする CSV でスキップする行数を指定します。通常はヘッダーをスキップするために 1 を指定します。 |
| col_name_or_user_var | 列マッピングの構文を指定します。データ変換については、[列マッピング](../../../data-operate/import/load-data-convert#column-mapping)のセクションを参照してください。 |
| PROPERTIES | インポートパラメータを指定します。 |

### インポートパラメータ

`PROPERTIES (key1 = value1 [, key2=value2])` 構文で、インポートパラメータを設定できます。

| パラメータ | 説明 |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| max_filter_ratio | 許容されるフィルター率の上限です。0 以上 1 以下で指定します。デフォルト値は 0 で、エラー行は許容されません。 |
| timeout | インポートのタイムアウト時間です。単位は秒です。デフォルトは 600 秒で、有効な範囲は 1 秒から 259200 秒です。 |
| strict_mode | このインポートで厳格モードを有効にするかどうかを指定します。デフォルトでは無効です。 |
| timezone | このインポートで使用するタイムゾーンです。デフォルトは現在のクラスターのタイムゾーンです。このパラメータは、インポートに関係するすべてのタイムゾーン関連関数の結果に影響します。 |
| exec_mem_limit | インポートのメモリ上限です。デフォルトは 2 GB で、単位はバイトです。 |
| trim_double_quotes | 真偽値です。デフォルト値は false です。true にすると、インポートファイル内の各フィールドから一番外側の二重引用符が削除されます。 |
| enclose | 囲み文字を指定します。CSV データのフィールドに行区切り文字や列区切り文字が含まれる場合、単一バイトの文字を囲み文字として指定すると、意図しない位置でフィールドが切られるのを防げます。たとえば、列区切り文字が `,`、囲み文字が `'`、データが `a,'b,c'` の場合、`b,c` は一つのフィールドとして解析されます。 |
| escape | エスケープ文字を指定します。フィールド内に囲み文字と同じ文字がある場合、その文字をエスケープするために使用します。たとえば、データが `a,'b,'c'`、囲み文字が `'` で、`b,'c` を一つのフィールドとして解析したい場合は、`\` のような単一バイトのエスケープ文字を指定し、データを `a,'b,\'c'` に変更する必要があります。 |

## インポート例

次の例は、一般的なインポートシナリオを示します。

### インポートのタイムアウト時間を指定する

PROPERTIES パラメータ `timeout` でインポートのタイムアウト時間を調整します。次の例では 100 秒に設定します。

```sql
LOAD DATA LOCAL
INFILE 'testData'
INTO TABLE testDb.testTbl
PROPERTIES ("timeout"="100");
```

### 許容されるインポートエラー率を指定する

PROPERTIES パラメータ `max_filter_ratio` で、インポート時に許容するエラー率を調整します。次の例では 20% に設定します。

```sql
LOAD DATA LOCAL
INFILE 'testData'
INTO TABLE testDb.testTbl
PROPERTIES ("max_filter_ratio"="0.2");
```

### インポートする列をマッピングする

次の例では、CSV の列の順序に合わせてマッピングを調整します。

```sql
LOAD DATA LOCAL
INFILE 'testData'
INTO TABLE testDb.testTbl
(k2, k1, v1);
```

### 列区切り文字と行区切り文字を指定する

`COLUMNS TERMINATED BY` 句と `LINES TERMINATED BY` 句で、インポート時の列区切り文字と行区切り文字を指定します。次の例では、列区切り文字にカンマ（`,`）、行区切り文字に改行（`\n`）を使用します。

```sql
LOAD DATA LOCAL
INFILE 'testData'
INTO TABLE testDb.testTbl
COLUMNS TERMINATED BY ','
LINES TERMINATED BY '\n';
```

### インポート先のパーティションを指定する

`PARTITION` 句でインポート先のパーティションを指定します。次の例では `p1` と `p2` にデータをインポートします。`p1` と `p2` に属さないデータは除外されます。

```sql
LOAD DATA LOCAL
INFILE 'testData'
INTO TABLE testDb.testTbl
PARTITION (p1, p2);
```

### インポートのタイムゾーンを指定する

PROPERTIES パラメータ `timezone` でタイムゾーンを指定します。次の例では `Africa/Abidjan` に設定します。

```sql
LOAD DATA LOCAL
INFILE 'testData'
INTO TABLE testDb.testTbl
PROPERTIES ("timezone"="Africa/Abidjan");
```

### インポートのメモリ使用量を制限する

PROPERTIES パラメータ `exec_mem_limit` でインポートのメモリ上限を指定します。次の例では 10 GB に設定します。

```sql
LOAD DATA LOCAL
INFILE 'testData'
INTO TABLE testDb.testTbl
PROPERTIES ("exec_mem_limit"="10737418240");
```

## FAQ

<!-- Knowledge type: Troubleshooting -->

### Q1: LOAD DATA の実行時に `The used command is not allowed with this MySQL version` というエラーが報告された場合は、どうすればよいですか？

このエラーは通常、クライアントで `local-infile` オプションが有効になっていないことが原因です。次のように対処してください。

- コマンドラインからの接続: 接続時に `--local-infile` パラメータを明示的に追加します。
- JDBC 接続: URL に `allowLoadLocalInfile=true` を追加します。

### Q2: MySQL Load でインポートできるファイルの大きさは？

**10 GB 未満**のファイルをインポートすることを推奨します。ファイルが大きすぎる場合は、先に分割してから各部分を MySQL Load でインポートしてください。

### Q3: MySQL Load は手動でキャンセルできますか？

**できません。**タイムアウトまたはインポートエラーが発生すると、システムが MySQL Load を自動的にキャンセルします。

### Q4: インポート失敗時に具体的な原因を調べるには？

エラーメッセージから `loadId` を取得し、次のコマンドでエラーの詳細を確認します。

```sql
show load warnings where label='<loadId>';
```

### Q5: CSV の NULL 値と空文字列を区別するには？

- NULL 値（null）: `\N` を使用します。例: `a,\N,b`。
- 空文字列: 空のままにします。例: `a, ,b`。

### Q6: インポートの原子性は保証されますか？

はい。MySQL Load はバッチインポートタスクの原子性を保証します。すべての行が正常にインポートされるか、どの行もインポートされないかのいずれかです。

## 関連情報

MySQL Load の構文とベストプラクティスの詳細については、[MySQL Load](../../../sql-manual/sql-statements/data-modification/load-and-export/MYSQL-LOAD) のコマンドリファレンスを参照してください。
