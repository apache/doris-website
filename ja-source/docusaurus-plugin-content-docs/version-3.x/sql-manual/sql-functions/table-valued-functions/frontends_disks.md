---
{
  "title": "FRONTENDS_DISKS",
  "description": "frontendsdisks table関数は、現在の Doris クラスター内の FE ノードのディスク情報を表示できる一時tableを生成します。",
  "language": "ja"
}
---
## 説明

`frontends_disks`table関数は、現在のDorisクラスタ内のFEノードのディスク情報を表示できる一時tableを生成します。その結果は本質的に`show frontends disks`文で表示される情報と同じですが、`frontends_disks()`のフィールドタイプはより明示的であり、TVFによって生成されたtableをフィルタリング、結合、その他の操作に使用できます。

この関数は`FROM`句で使用できます。


## 構文

```sql
FRONTENDS_DISKS()
```
## Access Control Requirements

| Privilege  | Object | 注釈 |
| :--------- |:-------|:------|
| SELECT_PRIV | internal.information_schema | すべてのユーザーはデフォルトでこのデータベースに対する権限を持っています |


## Return Value

frontends_disks() 関数の戻り値フィールドを確認してください

```sql
desc function frontends_disks();
```
```text
+------------+------+------+-------+---------+-------+
| Field      | タイプ | Null | Key   | Default | Extra |
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
フィールドの意味は以下の通りです：

| Field        | タイプ    | Explanation                                                                                 |
|--------------|---------|---------------------------------------------------------------------------------------------|
| `Name`       | TEXT    | フロントエンドノード (FE) の一意識別子。                                            |
| `Host`       | TEXT    | フロントエンドノードのIPアドレスまたはホスト名。                                            |
| `DirType`    | TEXT    | ディレクトリのタイプ（例：`meta`、`log`、`audit-log`、`temp`、`deploy`）。                  |
| `Dir`        | TEXT    | 指定されたディレクトリタイプのディスク上のディレクトリへのパス。                      |
| `Filesystem` | TEXT    | ファイルシステムのタイプ。                                           |
| `Capacity`   | TEXT    | ディスクの総ストレージ容量。                                                      |
| `Used`       | TEXT    | 使用済みのディスク容量。                                                 |
| `Available`  | TEXT    | 使用可能なディスク容量。                                          |
| `UseRate`    | TEXT    | 使用済みディスク容量の割合。                                                  |
| `MountOn`    | TEXT    | ファイルシステム内のディスクのマウントポイント。                                              |


## example

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
