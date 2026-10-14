---
{
    "title": "FRONTENDS_DISKS",
    "language": "ja",
    "description": "frontendsdisks テーブル関数は、現在の Doris クラスター内の FE ノードのディスク情報を確認できる一時テーブルを生成します。"
}
---

## 説明

`frontends_disks` テーブル関数は、現在の Doris クラスター内の FE ノードのディスク情報を確認できる一時テーブルを生成します。返される情報は基本的に `show frontends disks` ステートメントの表示内容と同じですが、`frontends_disks()` のフィールド型はより明確です。また、このテーブル値関数が生成したテーブルに対して、フィルタリングや結合などの操作を行えます。

この関数は `FROM` 句で使用できます。


## 構文
```sql
FRONTENDS_DISKS()
```

## アクセス権限の要件

| 権限  | オブジェクト | 備考 |
| :--------- |:-------|:------|
| SELECT_PRIV | internal.information_schema | デフォルトでは、すべてのユーザーにこのデータベースへの権限があります |


## 戻り値

frontends_disks() 関数が返すフィールドを確認します。

```sql
desc function frontends_disks();
```
```text
+------------+------+------+-------+---------+-------+
| Field      | Type | Null | Key   | Default | Extra |
+------------+------+------+-------+---------+-------+
| Name       | text | No   | false | NULL    | NONE  |
| Host       | text | No   | false | NULL    | NONE  |
| DirType    | text | No   | false | NULL    | NONE  |
| Dir        | text | No   | false | NULL    | NONE  |
| Filesystem | text | No   | false | NULL    | NONE  |
| Capacity   | text | No   | false | NULL    | NONE  |
| Used       | text | No   | false | NULL    | NONE  |
| Available  | text | No   | false | NULL    | NONE  |
| UseRate    | text | No   | false | NULL    | NONE  |
| MountOn    | text | No   | false | NULL    | NONE  |
+------------+------+------+-------+---------+-------+
```

各フィールドの意味は次のとおりです。

| フィールド        | 型    | 説明                                                                                 |
|--------------|---------|---------------------------------------------------------------------------------------------|
| `Name`       | TEXT    | フロントエンドノード（FE）の一意の識別子。                                            |
| `Host`       | TEXT    | フロントエンドノードの IP アドレスまたはホスト名。                                            |
| `DirType`    | TEXT    | ディレクトリの種類（例：`meta`、`log`、`audit-log`、`temp`、`deploy`）。                  |
| `Dir`        | TEXT    | 指定されたディレクトリ種別に対応する、ディスク上のディレクトリのパス。                      |
| `Filesystem` | TEXT    | ファイルシステムの種類。                                           |
| `Capacity`   | TEXT    | ディスクの総容量。                                                      |
| `Used`       | TEXT    | 使用済みのディスク容量。                                                 |
| `Available`  | TEXT    | 利用可能なディスク容量。                                          |
| `UseRate`    | TEXT    | ディスク容量の使用率。                                                  |
| `MountOn`    | TEXT    | ファイルシステムにおけるディスクのマウントポイント。                                              |


## 例
```sql
select * from frontends_disks();
```
```text
+-----------------------------------------+------------+-----------+-----------------------------------------------------------+--------------+----------+------+-----------+---------+------------+
| Name                                    | Host       | DirType   | Dir                                                       | Filesystem   | Capacity | Used | Available | UseRate | MountOn    |
+-----------------------------------------+------------+-----------+-----------------------------------------------------------+--------------+----------+------+-----------+---------+------------+
| fe_f4642d47_62a2_44a2_b79d_3259050ab9de | 10.x.x.6 | meta      | /mnt/disk2/doris/fe/doris-meta | /dev/nvme1n1 | 3T       | 3T   | 223G      | 94%     | /mnt/disk2                              |
| fe_f4642d47_62a2_44a2_b79d_3259050ab9de | 10.x.x.6 | log       | /mnt/disk2/doris/fe/log        | /dev/nvme1n1 | 3T       | 3T   | 223G      | 94%     | /mnt/disk2                              |
| fe_f4642d47_62a2_44a2_b79d_3259050ab9de | 10.x.x.6 | audit-log | /mnt/disk2/doris/fe/log        | /dev/nvme1n1 | 3T       | 3T   | 223G      | 94%     | /mnt/disk2                              |
| fe_f4642d47_62a2_44a2_b79d_3259050ab9de | 10.x.x.6 | temp      | /mnt/disk2/doris/fe/temp_dir   | /dev/nvme1n1 | 3T       | 3T   | 223G      | 94%     | /mnt/disk2                              |
| fe_f4642d47_62a2_44a2_b79d_3259050ab9de | 10.x.x.6 | deploy    | /mnt/disk2/doris/fe            | /dev/nvme1n1 | 3T       | 3T   | 223G      | 94%     | /mnt/disk2                              |
+-----------------------------------------+------------+-----------+-----------------------------------------------------------+--------------+----------+------+-----------+---------+------------+
```
