---
{
  "title": "SHOW FRONTENDS DISKS",
  "description": "この文は、メタデータ、ログ、監査ログなどのFEノード上の重要なディレクトリのディスク情報を表示するために使用されます、",
  "language": "ja"
}
---
## デスクリプション

このステートメントは、FEノード上の重要なディレクトリのディスク情報を表示するために使用されます。対象となるディレクトリには、メタデータ、ログ、監査ログ、一時ディレクトリなどがあります。

## Syntax

```sql
SHOW FRONTENDS DISKS;
```
## 戻り値

| Column                 | Note                                              |
|--------------------|-------------------------------------------------|
| Name               | bdbje内のFEノードの名前                            |
| Host               | FEノードのIPアドレス                                     |
| DirType        | 表示されるディレクトリの種類には、meta、log、audit-log、temp、deployの4つのカテゴリが含まれます。 |
| Dir           | 表示されるディレクトリ種類のディレクトリ                                     |
| FileSystem          | 表示されるディレクトリ種類が配置されているLinuxシステム内のファイルシステム                      |
| Capacity            | ファイルシステムの容量                                         |
| Used | ファイルシステムの使用サイズ                                        |
| Available               | ファイルシステムの残り容量                                       |
| UseRate           | ファイルシステム容量の使用率                                      |
| MountOn          | ファイルシステムのマウントディレクトリ                                        |

## アクセス制御要件

このSQLを実行するユーザーは、少なくとも以下の権限を持つ必要があります：

| Privilege               | Object | 注釈 |
|-------------------------|----|----|
| ADMIN_PRIV or NODE_PRIV |    |    |

## 使用上の注意

クエリ結果のさらなるフィルタリングが必要な場合は、Table値関数frontends_disks()を使用できます。SHOW BACKENDSは以下のステートメントと同等です：

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
