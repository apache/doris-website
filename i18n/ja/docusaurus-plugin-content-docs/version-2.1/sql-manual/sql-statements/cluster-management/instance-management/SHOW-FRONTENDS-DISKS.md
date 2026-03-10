---
{
  "title": "SHOW FRONTENDS DISKS",
  "language": "ja",
  "description": "このステートメントは、metadata、logs、audit logsなどのFEノード上の重要なディレクトリのディスク情報を表示するために使用されます。"
}
---
## Description

このステートメントは、メタデータ、ログ、監査ログ、一時ディレクトリなど、FEノード上の重要なディレクトリのディスク情報を表示するために使用されます。

## Syntax

```sql
SHOW FRONTENDS DISKS;
```
## 戻り値

| カラム                 | 備考                                              |
|--------------------|-------------------------------------------------|
| Name               | bdbje内のFEノードの名前                            |
| Host               | FEノードのIPアドレス                                     |
| DirType        | 表示されるディレクトリの種類には以下の4つのカテゴリが含まれます：meta、log、audit-log、temp、deploy |
| Dir           | 表示されるディレクトリの種類のディレクトリ                                     |
| FileSystem          | 表示されるディレクトリの種類が配置されているLinuxシステムのファイルシステム                      |
| Capacity            | ファイルシステムの容量                                         |
| Used | ファイルシステムの使用済みサイズ                                        |
| Available               | ファイルシステムの残り容量                                       |
| UseRate           | ファイルシステム容量の使用率                                      |
| MountOn          | ファイルシステムのマウントディレクトリ                                        |

## アクセス制御要件

このSQLを実行するユーザーは、少なくとも以下の権限を持つ必要があります：

| 権限               | オブジェクト | 備考 |
|-------------------------|----|----|
| ADMIN_PRIV または NODE_PRIV |    |    |

## 使用上の注意

クエリ結果をさらにフィルタリングする必要がある場合は、テーブル値関数 [frontends_disks()](../../../sql-functions/table-valued-functions/frontends_disks.md) を使用できます。SHOW BACKENDSは以下のステートメントと同等です：

```sql
SELECT * FROM FRONTENDS_DISKS();
```
## 例

```sql
SHOW FRONTENDS DISKS; 
```
```text
+-----------------------------------------+-------------+-----------+---------------------------------+------------+----------+------+-----------+---------+------------+
| Name                                    | Host        | DirType   | Dir                             | Filesystem | Capacity | Used | Available | UseRate | MountOn    |
+-----------------------------------------+-------------+-----------+---------------------------------+------------+----------+------+-----------+---------+------------+
| fe_a1daac68_5ec0_477c_b5e8_f90a33cdc1bb | 10.xx.xx.90 | meta      | /home/disk/output/fe/doris-meta | /dev/sdf1  | 7T       | 2T   | 4T        | 36%     | /home/disk |
| fe_a1daac68_5ec0_477c_b5e8_f90a33cdc1bb | 10.xx.xx.90 | log       | /home/disk/output/fe/log        | /dev/sdf1  | 7T       | 2T   | 4T        | 36%     | /home/disk |
| fe_a1daac68_5ec0_477c_b5e8_f90a33cdc1bb | 10.xx.xx.90 | audit-log | /home/disk/output/fe/log        | /dev/sdf1  | 7T       | 2T   | 4T        | 36%     | /home/disk |
| fe_a1daac68_5ec0_477c_b5e8_f90a33cdc1bb | 10.xx.xx.90 | temp      | /home/disk/output/fe/temp_dir   | /dev/sdf1  | 7T       | 2T   | 4T        | 36%     | /home/disk |
| fe_a1daac68_5ec0_477c_b5e8_f90a33cdc1bb | 10.xx.xx.90 | deploy    | /home/disk/output/fe            | /dev/sdf1  | 7T       | 2T   | 4T        | 36%     | /home/disk |
+-----------------------------------------+-------------+-----------+---------------------------------+------------+----------+------+-----------+---------+------------+
```
