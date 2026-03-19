---
{
  "title": "負荷に基づくバッチ削除",
  "language": "ja",
  "description": "削除操作はデータ更新の特殊な形式です。Primary Key（Unique Key）テーブルにおいて、"
}
---
## 負荷に基づくバッチ削除

削除操作は、データ更新の特別な形式です。プライマリキーモデル（Unique Key）テーブルにおいて、Dorisはデータロード時に削除サインを追加することによる削除をサポートしています。

`DELETE`文と比較して、削除サインの使用は以下のシナリオにおいて、より優れた使いやすさとパフォーマンスを提供します：

1. **CDCシナリオ**: OLTPデータベースからDorisにデータを同期する際、binlog内のInsertとDelete操作は通常交互に現れます。`DELETE`文はこれらの操作を効率的に処理できません。削除サインを使用することで、InsertとDelete操作を統一的に処理でき、DorisへのCDCコード記述を簡素化し、データロードとクエリパフォーマンスを向上させます。
2. **指定されたプライマリキーのバッチ削除**: 大量のプライマリキーを削除する必要がある場合、`DELETE`文の使用は非効率的です。`DELETE`の各実行は削除条件を記録する空のrowsetを生成し、新しいデータバージョンを作成します。頻繁な削除や削除条件の過多は、クエリパフォーマンスに深刻な影響を与える可能性があります。

## 削除サインの動作原理

### 原理の説明

- **テーブル構造**: 削除サインは、プライマリキーテーブル内の隠し列`__DORIS_DELETE_SIGN__`として格納されます。この列の値が1の場合、削除サインが有効であることを示します。
- **データロード**: ユーザーはロードタスクで削除サイン列のマッピング条件を指定できます。使用方法は異なるロードタスクによって異なり、詳細は以下の構文説明で述べられています。
- **クエリ**: クエリ中、Doris FEは自動的にクエリプランにフィルター条件`__DORIS_DELETE_SIGN__ != true`を追加し、削除サイン値が1のデータを除外します。
- **データCompaction**: Dorisのバックグラウンドデータcompactionは、削除サイン値が1のデータを定期的にクリーンアップします。

### データ例

#### テーブル構造

サンプルテーブルを作成：

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
セッション変数 `show_hidden_columns` を使用して非表示の列を表示します：

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
#### データ読み込み

テーブルには以下の既存データがあります：

```sql
+------+-------+
| id   | value |
+------+-------+
|    1 | foo   |
|    2 | bar   |
+------+-------+
```
id 1に削除サインを挿入します（これは原理のデモンストレーションのみであり、ロードにおける削除サインの様々な使用方法は紹介しません）：

```sql
mysql> insert into example_table (id, __DORIS_DELETE_SIGN__) values (1, 1);
```
#### Query

データを直接確認すると、id 1のレコードが削除されていることがわかります：

```sql
mysql> select * from example_table;
+------+-------+
| id   | value |
+------+-------+
|    2 | bar   |
+------+-------+
```
セッション変数`show_hidden_columns`を使用して隠しカラムを表示すると、id 1の行が実際には削除されていないことがわかります。その隠しカラム`__DORIS_DELETE_SIGN__`の値は1であり、クエリ時にフィルタリングされます。

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
## 構文の説明

異なるロードタイプでは、削除サインを設定するための構文が異なります。以下は、さまざまなロードタイプにおける削除サインの使用構文です。

### Load Mergeタイプの選択

データをロードする際には、いくつかのマージタイプがあります：

1. **APPEND**: すべてのデータが既存のデータに追加されます。
2. **DELETE**: ロードされたデータと同じキー列の値を持つすべての行を削除します。
3. **MERGE**: DELETE ON条件に基づいてAPPENDまたはDELETEを決定します。

### Stream Load

`Stream Load`の構文は、ヘッダーのcolumnsフィールドに削除サイン列を設定するためのフィールドを追加することです。例：`-H "columns: k1, k2, label_c3" -H "merge_type: [MERGE|APPEND|DELETE]" -H "delete: label_c3=1"`。

Stream Loadの使用例については、[Stream Load Manual](../import/import-way/stream-load-manual.md)の「削除操作でmerge_typeを指定する」および「マージ操作でmerge_typeを指定する」セクションを参照してください。

### Broker Load

`Broker Load`の構文は、`PROPERTIES`で削除サイン列フィールドを設定することです。以下の通りです：

```sql
LOAD LABEL db1.label1
(
    [MERGE|APPEND|DELETE] DATA INFILE("hdfs://abc.com:8888/user/palo/test/ml/file1")
    INTO TABLE tbl1
    COLUMNS TERMINATED BY ","
    (tmp_c1,tmp_c2, label_c3)
    SET
    (
        id=tmp_c2,
        name=tmp_c1,
    )
    [DELETE ON label_c3=true]
)
WITH BROKER 'broker'
(
    "username"="user",
    "password"="pass"
)
PROPERTIES
(
    "timeout" = "3600"
);
```
### Routine Load

`Routine Load`の構文では、`columns`フィールドにマッピングを追加します。マッピング方法は上記と同じで、以下のようになります：

```sql
CREATE ROUTINE LOAD example_db.test1 ON example_tbl 
 [WITH MERGE|APPEND|DELETE]
 COLUMNS(k1, k2, k3, v1, v2, label),
 WHERE k1  100 and k2 like "%doris%"
 [DELETE ON label=true]
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
