---
{
  "title": "タブレットローカルデバッグ",
  "language": "ja",
  "description": "Dorisのオンライン運用中に、様々な理由により各種のバグが発生する可能性があります。例えば：replicaが不整合、"
}
---
# Tablet Local Debug

Dorisのオンライン運用中に、様々な理由により各種バグが発生する可能性があります。例えば、レプリカの不整合、バージョン差分にデータが存在するなどです。

この場合、tabletのコピーデータをオンラインからローカル環境にコピーして再現し、問題を特定する必要があります。

## 1. tabletに関する情報を取得する

tablet idはBEログで確認でき、その後以下のコマンドで情報を取得できます（tablet idが10020であると仮定）。

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
`admin copy tablet`コマンドは、指定されたタブレットに対応するレプリカとバージョンのスナップショットファイルを生成できます。スナップショットファイルは、`Ip`フィールドで示されるBEノードの`Path`ディレクトリに保存されます。

このディレクトリの下には、tablet idという名前のディレクトリがあり、後で使用するために全体がパッケージ化されます。（このディレクトリは最大60分間保持され、その後自動的に削除されることに注意してください）。

```
cd /path/to/be/storage/snapshot/20220830101353.2.3600
tar czf 10020.tar.gz 10020/
```
このコマンドは、tabletに対応するテーブル作成ステートメントも同時に生成します。なお、このテーブル作成ステートメントは元のテーブル作成ステートメントではなく、bucket数とreplica数はともに1で、`versionInfo`フィールドが指定されています。このテーブル構築ステートメントは、後でtabletをローカルでロードする際に使用されます。

これまでで、必要な情報をすべて取得しました。リストは以下の通りです：

1. パッケージ化されたtabletデータ（例：10020.tar.gz）
2. テーブル作成ステートメント

## 2. Tabletをローカルでロード

1. ローカルデバッグ環境の構築

     ローカルに単一ノードのDorisクラスター（1FE、1BE）をデプロイし、デプロイバージョンはオンラインクラスターと同じにします。オンラインのデプロイバージョンがDORIS-1.1.1の場合、ローカル環境もDORIS-1.1.1バージョンをデプロイします。

2. テーブルの作成

     前のステップのcreate tableステートメントを使用して、ローカル環境でテーブルを作成します。

3. 新しく作成したテーブルのtablet情報の取得

     新しく作成したテーブルのbucket数とreplica数は1であるため、1つのreplicaを持つ1つのtabletのみが存在します：

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
このコマンドは、タブレット10017が配置されているディレクトリに移動し、パスを表示します。ここで、以下のようなパスが表示されます：

    ```
    /path/to/storage/data/0/10017
    ```
`0`はshard idです。

4. Tabletデータの変更

    最初のステップで取得したtabletデータパッケージを解凍します。エディターで10017.hdr.jsonファイルを開き、以下のフィールドを前のステップで取得した情報に変更します：

    ```
    "table_id":10015
    "partition_id":10014
    "tablet_id":10017
    "schema_hash":44622287
    "shard_id":0
    ```
5. タブレットをロードする

     まず、デバッグ環境のBEプロセスを停止します（./bin/stop_be.sh）。次に、10017.hdr.jsonファイルと同じレベルディレクトリにあるすべての.datファイルを`/path/to/storage/data/0/10017/44622287`ディレクトリにコピーします。このディレクトリは、ステップ3で取得したデバッグ環境タブレットが配置されているディレクトリです。`10017/44622287`はそれぞれタブレットIDとスキーマハッシュです。

     `meta_tool`ツールを使用して元のタブレットメタを削除します。このツールは`be/lib`ディレクトリにあります。

    ```
    ./lib/meta_tool --root_path=/path/to/storage --operation=delete_meta --tablet_id=10017 --schema_hash=44622287
    ```
`/path/to/storage`はBEのデータルートディレクトリです。削除が成功すると、delete successfullyログが表示されます。

`meta_tool`ツールを使用して新しいタブレットメタを読み込みます。

    ```
    ./lib/meta_tool --root_path=/path/to/storage --operation=load_meta --json_meta_path=/path/to/10017.hdr.json
    ```
ロードが成功した場合、load successfullyログが表示されます。

6. 検証

   デバッグ環境のBEプロセス (./bin/start_be.sh) を再起動します。テーブルをクエリして、正しければロードされたtabletのデータをクエリするか、オンラインの問題を再現できます。
