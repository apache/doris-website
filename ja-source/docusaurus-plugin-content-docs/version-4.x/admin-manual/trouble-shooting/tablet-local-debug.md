---
{
  "title": "タブレットローカルデバッグ",
  "language": "ja",
  "description": "Dorisのオンライン運用中に、様々な理由により各種のバグが発生する可能性があります。例えば：replicaが不整合、"
}
---
# Tablet Local Debug

Dorisのオンライン運用中に、様々な理由により各種バグが発生する可能性があります。例えば、レプリカが不整合、データがversion diffに存在する、などです。

このような場合、オンライン上のtabletのコピーデータをローカル環境にコピーして再現し、問題を特定する必要があります。

## 1. tabletに関する情報を取得する

tablet idはBEログで確認でき、その後以下のコマンドで情報を取得できます（tablet idが10020と仮定）。

tabletが配置されているDbId/TableId/PartitionIdなどの情報を取得します。

```
mysql> show tablet 10020\G
*************************** 1. row ***************************
       DbName: default_cluster:db1
    TableName: tbl1
PartitionName: tbl1
    IndexName: tbl1
         DbId: 10004
      TableId: 10016
  PartitionId: 10015
      IndexId: 10017
       IsSync: true
        Order: 1
    DetailCmd: SHOW PROC '/dbs/10004/10016/partitions/10015/10017/10020';
```
前のステップで`DetailCmd`を実行して、BackendId/SchemaHashなどの情報を取得します。

```
mysql>  SHOW PROC '/dbs/10004/10016/partitions/10015/10017/10020'\G
*************************** 1. row ***************************
        ReplicaId: 10021
        BackendId: 10003
          Version: 3
LstSuccessVersion: 3
 LstFailedVersion: -1
    LstFailedTime: NULL
       SchemaHash: 785778507
    LocalDataSize: 780
   RemoteDataSize: 0
         RowCount: 2
            State: NORMAL
            IsBad: false
     VersionCount: 3
         PathHash: 7390150550643804973
          MetaUrl: http://192.168.10.1:8040/api/meta/header/10020
 CompactionStatus: http://192.168.10.1:8040/api/compaction/show?tablet_id=10020
```
タブレットスナップショットを作成してテーブル作成文を取得する

```
mysql> admin copy tablet 10020 properties("backend_id" = "10003", "version" = "2")\G
*************************** 1. row ***************************
         TabletId: 10020
        BackendId: 10003
               Ip: 192.168.10.1
             Path: /path/to/be/storage/snapshot/20220830101353.2.3600
ExpirationMinutes: 60
  CreateTableStmt: CREATE TABLE `tbl1` (
  `k1` int(11) NULL,
  `k2` int(11) NULL
) ENGINE=OLAP
DUPLICATE KEY(`k1`, `k2`)
DISTRIBUTED BY HASH(k1) BUCKETS 1
PROPERTIES (
"replication_num" = "1",
"version_info" = "2"
);
```
`admin copy tablet`コマンドは、指定されたタブレットに対応するレプリカとバージョンのスナップショットファイルを生成できます。スナップショットファイルは、`Ip`フィールドで指定されたBEノードの`Path`ディレクトリに保存されます。

このディレクトリの下には、tablet idという名前のディレクトリがあり、これは後で使用するために全体がパッケージ化されます。（なお、このディレクトリは最大60分間保持され、その後自動的に削除されます）。

```
cd /path/to/be/storage/snapshot/20220830101353.2.3600
tar czf 10020.tar.gz 10020/
```
このコマンドは同時にtabletに対応するテーブル作成文も生成します。このテーブル作成文は元のテーブル作成文ではなく、bucket数とreplica数が両方とも1で、`versionInfo`フィールドが指定されていることに注意してください。このテーブル作成文は後でtabletをローカルで読み込む際に使用されます。

これまでに、必要な情報をすべて取得しました。リストは以下の通りです：

1. パッケージ化されたtabletデータ（例：10020.tar.gz）
2. テーブル作成文

## 2. Tabletをローカルで読み込む

1. ローカルデバッグ環境を構築する

     ローカルでシングルノードDorisクラスター（1FE、1BE）をデプロイし、デプロイバージョンはオンラインクラスターと同じにします。オンラインデプロイバージョンがDORIS-1.1.1の場合、ローカル環境もDORIS-1.1.1バージョンをデプロイします。

2. テーブルを作成する

     前のステップのcreate table文を使用してローカル環境でテーブルを作成します。

3. 新しく作成されたテーブルのtablet情報を取得する

     新しく作成されたテーブルのbucket数とreplica数は1であるため、1つのreplicaを持つtabletが1つだけ存在します：

    ```
    mysql> show tablets from tbl1\G
    *************************** 1. row ***************************
                   TabletId: 10017
                  ReplicaId: 10018
                  BackendId: 10003
                 SchemaHash: 44622287
                    Version: 1
          LstSuccessVersion: 1
           LstFailedVersion: -1
              LstFailedTime: NULL
              LocalDataSize: 0
             RemoteDataSize: 0
                   RowCount: 0
                      State: NORMAL
    LstConsistencyCheckTime: NULL
               CheckVersion: -1
               VersionCount: -1
                   PathHash: 7390150550643804973
                    MetaUrl: http://192.168.10.1:8040/api/meta/header/10017
           CompactionStatus: http://192.168.10.1:8040/api/compaction/show?tablet_id=10017
    ```
    ```
    mysql> show tablet 10017\G
    *************************** 1. row ***************************
           DbName: default_cluster:db1
        TableName: tbl1
    PartitionName: tbl1
        IndexName: tbl1
             DbId: 10004
          TableId: 10015
      PartitionId: 10014
          IndexId: 10016
           IsSync: true
            Order: 0
        DetailCmd: SHOW PROC '/dbs/10004/10015/partitions/10014/10016/10017';
    ```
ここでは以下の情報を記録します：

    * TableId
    * PartitionId
    * TabletId
    * SchemaHash

    同時に、デバッグ環境のBEノードのデータディレクトリに移動して、新しいタブレットが配置されているシャードIDを確認する必要もあります：

    ```
    cd /path/to/storage/data/*/10017 && pwd
    ```
このコマンドは、tablet 10017が配置されているディレクトリに移動し、パスを表示します。ここでは、以下のようなパスが表示されます：

    ```
    /path/to/storage/data/0/10017
    ```
`0`はshard idです。

4. Tabletデータの変更

    最初のステップで取得したtabletデータパッケージを展開します。エディターで10017.hdr.jsonファイルを開き、前のステップで取得した情報に以下のフィールドを変更します：

    ```
    "table_id":10015
    "partition_id":10014
    "tablet_id":10017
    "schema_hash":44622287
    "shard_id":0
    ```
5. タブレットを読み込む

     まず、デバッグ環境のBEプロセスを停止します（./bin/stop_be.sh）。次に、10017.hdr.jsonファイルと同じレベルのディレクトリにあるすべての.datファイルを`/path/to/storage/data/0/10017/44622287`ディレクトリにコピーします。このディレクトリは、ステップ3で取得したデバッグ環境のタブレットが配置されているディレクトリです。`10017/44622287`はそれぞれタブレットIDとスキーマハッシュです。

     `meta_tool`ツールを使用して、元のタブレットメタを削除します。このツールは`be/lib`ディレクトリに配置されています。

    ```
    ./lib/meta_tool --root_path=/path/to/storage --operation=delete_meta --tablet_id=10017 --schema_hash=44622287
    ```
`/path/to/storage`はBEのデータルートディレクトリです。削除が成功した場合、delete successfullyログが表示されます。

`meta_tool`ツールを使用して新しいタブレットメタを読み込みます。

    ```
    ./lib/meta_tool --root_path=/path/to/storage --operation=load_meta --json_meta_path=/path/to/10017.hdr.json
    ```
読み込みが成功すると、読み込み成功ログが表示されます。
    
6. 検証

     デバッグ環境のBEプロセス（./bin/start_be.sh）を再起動します。テーブルをクエリし、正しければ、読み込まれたtabletのデータをクエリできるか、オンラインの問題を再現できます。
