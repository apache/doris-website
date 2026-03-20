---
{
  "title": "ディスク容量管理",
  "language": "ja",
  "description": "この文書では、主にディスクストレージ容量に関連するシステムパラメータと処理戦略について紹介します。"
}
---
# Disk Capacity Management

このドキュメントは、ディスクストレージ容量に関連するシステムパラメータと処理戦略について主に紹介します。

Dorisのデータディスク容量が制御されていない場合、ディスクがフルになることでプロセスがハングしてしまいます。そのため、ディスク使用量と残り容量を監視し、異なる警告レベルを設定することでDorisシステム内の様々な操作を制御し、ディスクフルの状況を回避するよう努めています。

## 用語集

* Data Dir: データディレクトリ、BE設定ファイル`be.conf`の`storage_root_path`で指定された各データディレクトリ。通常、データディレクトリは1つのディスクに対応するため、以下の**ディスク**もデータディレクトリを指します。

## 基本原理

BEは定期的に（毎分）ディスク使用量をFEに報告します。FEはこれらの統計値を記録し、これらの統計値に基づいて様々な操作リクエストを制限します。

FEには**High Watermark**と**Flood Stage**という2つの閾値が設定されています。Flood StageはHigh Watermarkより高く設定されます。ディスク使用量がHigh Watermarkより高い場合、Dorisは特定の操作（レプリカバランシングなど）の実行を制限します。Flood Stageより高い場合は、特定の操作（データロードなど）が禁止されます。

同時に、BE上にも**Flood Stage**が設定されています。FEがBE上のディスク使用量をタイムリーに完全に検知できない場合があり、特定のBE操作（Compactionなど）を制御できないことを考慮してのことです。そのため、BE上のFlood Stageは、BEが積極的に特定の操作を拒否・停止することで自己保護の目的を達成するために使用されます。

## FEパラメータ

**High Watermark:**

```
storage_high_watermark_usage_percent: default value is 85 (85%).
storage_min_left_capacity_bytes: default value is 2GB.
```
ディスク容量が `storage_high_watermark_usage_percent` **より多い**場合、**または**ディスクの空き容量が `storage_min_left_capacity_bytes` **より少ない**場合、そのディスクは以下の操作の宛先パスとして使用されなくなります：

* Tablet Balance
* Colocation Relocation
* Decommission

**Flood Stage:**

```
storage_flood_stage_usage_percent: default value is 95 (95%).
storage_flood_stage_left_capacity_bytes: default value is 1GB.
```
ディスク容量が `storage_flood_stage_usage_percent` **より多い**場合、**または**ディスク空き容量が `storage_flood_stage_left_capacity_bytes` **より少ない**場合、そのディスクは以下の操作の宛先パスとして使用されなくなります：

* Tablet Balance
* Colocation Relocation  
* Replica make up
* Restore
* Load/Insert

## BEパラメータ

**Flood Stage:**

```
storage_flood_stage_usage_percent: default value is 90 (90%).
storage_flood_stage_left_capacity_bytes: default value is 1GB.
```
ディスク容量が `storage_flood_stage_usage_percent` **を超え**、**かつ**ディスク空き容量が `storage_flood_stage_left_capacity_bytes` **を下回った**場合、このディスクでの以下の操作は禁止されます：

* Base/Cumulative Compaction
* データロード
* Clone Task（通常、レプリカが修復またはバランシングされる際に発生します。）
* Push Task（HadoopインポートのLoading段階で発生し、ファイルがダウンロードされます。）
* Alter Task（Schema ChangeまたはRollup Task。）
* Download Task（復旧操作のDownloading段階。）
    
## ディスク容量の解放

ディスク容量がHigh WatermarkやFlood Stageを超えた場合、多くの操作が禁止されます。この時、以下の方法でディスク使用量を削減し、システムを復旧できます。

* テーブルまたはパーティションの削除

    テーブルまたはパーティションを削除することで、ディスク領域使用量を迅速に削減し、クラスターを復旧できます。
    **注意：`DROP`操作のみがディスク領域使用量の迅速な削減を実現できます。`DELETE`操作では実現できません。**

    ```
    DROP TABLE tbl;
    ALTER TABLE tbl DROP PARTITION p1;
    ```
* BE 拡張

    バックエンド拡張後、データタブレットは自動的にディスク使用量の少ないBEノードにバランスされます。拡張操作により、クラスターはデータ量とノード数に応じて数時間から数日でバランスの取れた状態に達します。

* テーブルまたはパーティションのレプリカの変更

    テーブルまたはパーティションのレプリカ数を削減できます。たとえば、デフォルトの3レプリカを2レプリカに削減できます。この方法はデータの信頼性を低下させますが、ディスク使用率を迅速に削減し、クラスターを正常な状態に復旧できます。
    この方法は通常、緊急復旧システムで使用されます。復旧後は拡張またはデータ削除によりディスク使用率を削減した後、コピー数を3に戻してください。
    レプリカの変更操作は即座に有効になり、バックエンドは自動的かつ非同期で冗長なレプリカを削除します。

    ```
    ALTER TABLE tbl MODIFY PARTITION p1 SET("replication_num" = "2");
    ```
* 不要なファイルの削除

    ディスクがフルになったためにBEがクラッシュし、起動できない場合（この現象はFEまたはBEの検出が遅れることで発生する可能性があります）、BEプロセスが起動できるようにデータディレクトリ内の一時ファイルを削除する必要があります。
    以下のディレクトリ内のファイルは直接削除できます：

    * log/：logディレクトリ内のログファイル。
    * snapshot/：snapshotディレクトリ内のスナップショットファイル。
    * trash/：trashディレクトリ内のゴミ箱ファイル。

    **この操作は[BEごみ箱からのデータ復元](../../admin-manual/data-admin/recyclebin.md)に影響します。**

    BEがまだ起動できる場合は、`ADMIN CLEAN TRASH ON(BackendHost:BackendHeartBeatPort);`を使用して一時ファイルを積極的にクリーンアップできます。**すべてのtrashファイル**と期限切れのsnapshotファイルがクリーンアップされ、**これはゴミ箱からのデータ復元操作に影響します**。

    手動で`ADMIN CLEAN TRASH`を実行しない場合でも、システムは数分から数十分以内に自動的にクリーンアップを実行します。以下の2つの状況があります：
    * ディスク使用量が**Flood Stage**の90%に達していない場合、期限切れのtrashファイルと期限切れのsnapshotファイルがクリーンアップされます。この時、一部の最近のファイルは保持され、データの復旧に影響しません。
    * ディスク使用量が**Flood Stage**の90%に達している場合、**すべてのtrashファイル**と期限切れのsnapshotファイルがクリーンアップされ、**これはゴミ箱からのデータ復元操作に影響します**。

    自動実行の時間間隔は、設定項目の`max_garbage_sweep_interval`と`min_garbage_sweep_interval`で変更できます。

    trashファイルの不足により復旧が失敗した場合、以下の結果が返される可能性があります：

    ```
    {"status": "Fail","msg": "can find tablet path in trash"}
    ```
* データファイルの削除（危険!!!）

    上記の操作のいずれでも容量を解放できない場合は、データファイルを削除してスペースを解放する必要があります。データファイルは、指定されたデータディレクトリの `data/` ディレクトリにあります。tabletを削除するには、まずそのtabletの少なくとも1つのレプリカが正常であることを確認する必要があります。そうでなければ、**唯一のレプリカを削除するとデータ損失が発生します**。

    id 12345のtabletを削除したいとします：

    * Tabletに対応するディレクトリを見つけます。通常は `data/shard_id/tablet_id/` の下にあります。例えば：

        ```data/0/12345/```
        
    * Record the tablet id and schema hash. The schema hash is the name of the next-level directory of the previous step. The following is 352781111: 

        ```data/0/12345/352781111```
* データディレクトリを削除します：

        ```rm -rf data/0/12345/```

    * Delete tablet metadata refer to [Tablet metadata management tool](../trouble-shooting/tablet-meta-tool.md)

        ```./lib/meta_tool --operation=delete_header --root_path=/path/to/root_path --tablet_id=12345 --schema_hash= 352781111```
