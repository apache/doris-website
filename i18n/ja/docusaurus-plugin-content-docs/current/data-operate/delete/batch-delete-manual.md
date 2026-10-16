---
{
    "title": "ロードによるバッチ削除",
    "language": "ja",
    "description": "Doris の Unique Key モデルでは、データロード時に削除マーカーを付与してバッチ削除を実行できます。CDC 同期や主キーによる大量削除に適しており、DELETE 文より高いパフォーマンスを発揮します。",
    "keywords": [
        "Doris バッチ削除",
        "Unique Key 削除",
        "削除マーカー",
        "__DORIS_DELETE_SIGN__",
        "CDC 同期",
        "merge_type DELETE",
        "Stream Load 削除",
        "Broker Load 削除",
        "Routine Load 削除"
    ]
}
---

<!-- Knowledge type: Procedure + Feature description -->
<!-- Applicable scenarios: CDC synchronization / Large-scale primary key deletion / Merged data writes -->

**ロードによるバッチ削除**は、Doris の Unique Key モデルが提供する削除方法です。データロード時に**削除マーカー列**を付与して対象行に削除済みの印を付け、その後バックグラウンドの Compaction で非同期にクリーンアップします。

`DELETE` 文と比べて、削除マーカーはバッチ削除や CDC のシナリオで高いパフォーマンスと使いやすさを提供します。

### 適用シナリオ

| シナリオ | 説明 |
|------|------|
| **CDC 同期** | MySQL などの OLTP データベースから binlog を介して Doris に同期する場合、binlog には Insert 操作と Delete 操作が交互に現れます。削除マーカーを使うと両方の操作を統一的に処理でき、コードが簡単になり、ロードとクエリのパフォーマンスも向上します。 |
| **主キーによるバッチ削除** | 主キーを指定して大量のデータを削除する場合、`DELETE` 文を実行するたびに空の Rowset が生成され、データの新しいバージョンが作られます。削除を頻繁に行うと、クエリのパフォーマンスが大きく低下します。削除マーカーはまとめて書き込めるため、この問題を回避できます。 |

### DELETE 文との比較

| 項目 | ロードによるバッチ削除 | DELETE 文 |
|------|------|------|
| 適用できるモデル | Unique Key | Unique Key / Aggregate Key / Duplicate Key |
| 実行方法 | ロード時に削除マーカーを付与 | SQL を実行 |
| データバージョン | ロードのバージョンを共有 | 実行ごとに新しいバージョンを生成 |
| 大量データのバッチ削除性能 | 高い | 低い |
| CDC シナリオへの適合性 | ネイティブに対応 | 追加の処理が必要 |

---

## 仕組み

<!-- Knowledge type: Concept description -->

### 中核となる仕組み

- **隠し列**: すべての Unique Key テーブルには隠し列 `__DORIS_DELETE_SIGN__` があります。値が `1` の行には削除済みの印が付いています。
- **ロード時の書き込み**: ロードタスクでは、マッピング条件を使って削除済みとしてマークする行を指定できます。構文はロード方式によって少し異なります。
- **クエリ時のフィルタリング**: クエリのプランニング時に、FE はフィルター条件 `__DORIS_DELETE_SIGN__ != true` を自動的に追加します。そのため、マークされた行はユーザーから見えません。
- **バックグラウンドでのクリーンアップ**: BE の Compaction プロセスが、削除済みとしてマークされた行を定期的に物理削除します。

### データ例

#### ステップ 1: テーブルを作成する

Unique Key テーブルを作成します。

```sql
CREATE TABLE example_table (
    id BIGINT NOT NULL,
    value STRING
)
UNIQUE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 10
PROPERTIES (
    "replication_num" = "3"
);
```

#### ステップ 2: 隠し列を表示する

セッション変数 `show_hidden_columns` を使って隠し列を表示します。

```sql
mysql> set show_hidden_columns=true;

mysql> desc example_table;
+-----------------------+---------+------+-------+---------+-------+
| Field                 | Type    | Null | Key   | Default | Extra |
+-----------------------+---------+------+-------+---------+-------+
| id                    | bigint  | No   | true  | NULL    |       |
| value                 | text    | Yes  | false | NULL    | NONE  |
| __DORIS_DELETE_SIGN__ | tinyint | No   | false | 0       | NONE  |
| __DORIS_VERSION_COL__ | bigint  | No   | false | 0       | NONE  |
+-----------------------+---------+------+-------+---------+-------+
```

#### ステップ 3: 削除マーカーを書き込む

テーブルに次のデータがあるとします。

```sql
+------+-------+
| id   | value |
+------+-------+
|    1 | foo   |
|    2 | bar   |
+------+-------+
```

`INSERT INTO` を使い、`id = 1` の行に削除マーカーを書き込みます（これは説明用の例です。本番環境では、対応するロード方式を使用してください）。

```sql
mysql> insert into example_table (id, __DORIS_DELETE_SIGN__) values (1, 1);
```

#### ステップ 4: クエリ結果を確認する

デフォルトでは、クエリによってマークされた行が自動的に除外されます。

```sql
mysql> select * from example_table;
+------+-------+
| id   | value |
+------+-------+
|    2 | bar   |
+------+-------+
```

`show_hidden_columns` を有効にすると、`id = 1` の行が残っており、削除済みとしてマークされているだけであることが分かります。

```sql
mysql> set show_hidden_columns=true;
mysql> select * from example_table;
+------+-------+-----------------------+-----------------------+
| id   | value | __DORIS_DELETE_SIGN__ | __DORIS_VERSION_COL__ |
+------+-------+-----------------------+-----------------------+
|    1 | NULL  |                     1 |                     3 |
|    2 | bar   |                     0 |                     2 |
+------+-------+-----------------------+-----------------------+
```

---

## ロード時のマージ方式

<!-- Knowledge type: Configuration parameter -->

ロードタスクでは、`merge_type` によってデータのマージ動作を制御します。次の三つの方式がサポートされています。

| merge_type | 動作 | 一般的な用途 |
|------|------|------|
| **APPEND**（デフォルト） | すべてのデータを既存のデータに追加します | 通常の書き込み |
| **DELETE** | ロードしたデータと Key 列が一致する行をすべて削除します | 主キーによるバッチ削除 |
| **MERGE** | `DELETE ON` 条件に基づき、行ごとに APPEND または DELETE を実行します | Insert と Delete が混在する CDC シナリオ |

> 注意: `MERGE` は `DELETE ON <condition>` と併用する必要があります。

---

## ロード方式ごとの構文

<!-- Knowledge type: Procedure -->

削除マーカーを設定する構文は、ロード方式によって少し異なります。以下でそれぞれ説明します。

### Stream Load

**使い方**: HTTP ヘッダーに `columns`、`merge_type`、`delete` の各フィールドを設定します。

**例**:

```bash
-H "columns: k1, k2, label_c3"
-H "merge_type: [MERGE|APPEND|DELETE]"
-H "delete: label_c3=1"
```

**パラメータの説明**:

- `columns`: ロードするフィールドのマッピングです。削除の判定に使うマーカー列を含める必要があります。
- `merge_type`: マージ方式です。有効な値は `APPEND`、`DELETE`、`MERGE` です。
- `delete`: `merge_type=MERGE` の場合に有効です。削除条件を指定します。

その他の例については、[Stream Load マニュアル](../import/import-way/stream-load-manual.md)の「Delete 操作での merge_type の指定」と「Merge 操作での merge_type の指定」のセクションを参照してください。

### Broker Load

**使い方**: `LOAD` 句で `[MERGE|APPEND|DELETE]` キーワードと `DELETE ON` 句を使い、削除マーカーを指定します。

**構文例**:

```sql
LOAD LABEL db1.label1
(
    [MERGE|APPEND|DELETE] DATA INFILE("hdfs://abc.com:8888/user/palo/test/ml/file1")
    INTO TABLE tbl1
    COLUMNS TERMINATED BY ","
    (tmp_c1, tmp_c2, label_c3)
    SET
    (
        id = tmp_c2,
        name = tmp_c1
    )
    [DELETE ON label_c3=true]
)
WITH BROKER 'broker'
(
    "username" = "user",
    "password" = "pass"
)
PROPERTIES
(
    "timeout" = "3600"
);
```

### Routine Load

**使い方**: Routine Load ジョブの作成時に、`WITH [MERGE|APPEND|DELETE]` 句と `DELETE ON` 句を使い、削除マーカーを指定します。

**構文例**:

```sql
CREATE ROUTINE LOAD example_db.test1 ON example_tbl
[WITH MERGE|APPEND|DELETE]
COLUMNS(k1, k2, k3, v1, v2, label),
WHERE k1 > 100 and k2 like "%doris%"
[DELETE ON label=true]
PROPERTIES
(
    "desired_concurrent_number" = "3",
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

---

## よくある質問

<!-- Knowledge type: FAQ -->

**Q1: ロードによるバッチ削除はどのテーブルモデルに対応していますか？**

Unique Key モデルのみに対応しています。Aggregate Key テーブルと Duplicate Key テーブルでは、`DELETE` 文を使用してください。

**Q2: 削除済みとしてマークされたデータのディスク領域は、いつ解放されますか？**

BE のバックグラウンド Compaction によって非同期にクリーンアップされます。タイミングは Compaction のスケジュールとデータバージョンの数によって異なり、通常はユーザーによる操作は必要ありません。

**Q3: 行に削除済みの印が付いているかどうかを確認するには、どうすればよいですか？**

`SET show_hidden_columns=true;` を実行してからテーブルをクエリします。隠し列 `__DORIS_DELETE_SIGN__` が表示されます。値が `1` の行には削除済みの印が付いています。

**Q4: CDC シナリオではどの merge_type を使用すべきですか？**

`MERGE` を推奨します。`DELETE ON` と併用して削除条件を指定すると、同じロードで Insert 操作と Delete 操作をまとめて処理できます。

**Q5: 削除マーカーはクエリのパフォーマンスに影響しますか？**

通常のクエリではマークされた行が自動的に除外されるため、パフォーマンスへの影響はごくわずかです。バックグラウンドの Compaction が完了すると、マークされたデータは物理的に削除されます。

---

## 関連リンク

- [Stream Load マニュアル](../import/import-way/stream-load-manual.md)
- [Broker Load マニュアル](../import/import-way/broker-load-manual.md)
- [Routine Load マニュアル](../import/import-way/routine-load-manual.md)
