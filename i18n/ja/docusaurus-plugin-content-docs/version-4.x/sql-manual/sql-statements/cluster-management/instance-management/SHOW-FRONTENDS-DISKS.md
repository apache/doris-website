---
{
    "title": "SHOW FRONTENDS DISKS",
    "language": "ja",
    "description": "このステートメントは、メタデータ、ログ、監査ログなど、FE ノード上の重要なディレクトリのディスク情報を表示するために使用します。"
}
---

## 説明

このステートメントは、FE ノード上のメタデータ、ログ、監査ログ、一時ディレクトリなど、重要なディレクトリのディスク情報を表示します。

## 構文

```sql
SHOW FRONTENDS DISKS;
```

## 戻り値

| カラム | 説明 |
|--------------------|-------------------------------------------------|
| Name | bdbje における FE ノードの名前。 |
| Host | FE ノードの IP アドレス。 |
| DirType | 表示されるディレクトリの種類には、meta、log、audit-log、temp、deploy の四つのカテゴリがあります。 |
| Dir | 対象となる種類のディレクトリ。 |
| FileSystem | 対象となる種類のディレクトリが配置されている Linux のファイルシステム。 |
| Capacity | ファイルシステムの容量。 |
| Used | ファイルシステムの使用済み容量。 |
| Available | ファイルシステムの残り容量。 |
| UseRate | ファイルシステムの容量使用率。 |
| MountOn | ファイルシステムのマウントディレクトリ。 |

## アクセス制御要件

この SQL を実行するユーザーには、少なくとも次の権限が必要です。

| 権限 | オブジェクト | 備考 |
|-------------------------|----|----|
| ADMIN_PRIV or NODE_PRIV |    |    |

## 使用上の注意

クエリ結果をさらに絞り込む必要がある場合は、テーブル値関数 [frontends_disks()](../../../sql-functions/table-valued-functions/frontends_disks.md) を使用できます。SHOW BACKENDS は、次のステートメントと同等です。

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
