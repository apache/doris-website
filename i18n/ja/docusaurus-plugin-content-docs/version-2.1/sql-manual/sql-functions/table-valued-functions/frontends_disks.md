---
{
  "title": "FRONTENDS_DISKS",
  "language": "ja",
  "description": "frontendsdisksテーブル関数は、現在のDorisクラスター内のFEノードのディスク情報を表示できる一時テーブルを生成します。"
}
---
## 説明

`frontends_disks` テーブル関数は、現在のDorisクラスター内のFEノードのディスク情報を表示できる一時テーブルを生成します。その結果は本質的に `show frontends disks` ステートメントで表示される情報と同じですが、`frontends_disks()` のフィールドタイプはより明示的であり、TVFによって生成されたテーブルをフィルタリング、結合、その他の操作に使用することができます。

この関数は `FROM` 句で使用できます。


## 構文

```sql
FRONTENDS_DISKS()
```
## アクセス制御要件

| Privilege  | Object | Notes |
| :--------- |:-------|:------|
| ADMIN_PRIV | global |       |


## 戻り値

frontends_disks() 関数の戻りフィールドを確認する

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
フィールドの意味は以下の通りです：

| Field        | Type    | Explanation                                                                                 |
|--------------|---------|---------------------------------------------------------------------------------------------|
| `Name`       | TEXT    | フロントエンドノード（FE）の一意識別子。                                            |
| `Host`       | TEXT    | フロントエンドノードのIPアドレスまたはホスト名。                                            |
| `DirType`    | TEXT    | ディレクトリの種類（例：`meta`、`log`、`audit-log`、`temp`、`deploy`）。                  |
| `Dir`        | TEXT    | 指定されたディレクトリタイプのディスク上のディレクトリへのパス。                      |
| `Filesystem` | TEXT    | ファイルシステムタイプ。                                           |
| `Capacity`   | TEXT    | ディスクの総ストレージ容量。                                                      |
| `Used`       | TEXT    | 使用されているディスク容量。                                                 |
| `Available`  | TEXT    | 使用可能なディスク容量。                                          |
| `UseRate`    | TEXT    | 使用されているディスク容量の割合。                                                  |
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
