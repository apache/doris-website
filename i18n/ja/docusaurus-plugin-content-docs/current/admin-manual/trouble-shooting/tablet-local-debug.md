---
{
    "title": "タブレットのローカルデバッグ",
    "language": "ja",
    "description": "Doris のオンライン運用中には、レプリカの不整合など、さまざまな理由で不具合が発生することがあります。"
}
---

# タブレットのローカルデバッグ

Doris のオンライン運用中には、さまざまな理由で不具合が発生することがあります。たとえば、レプリカ間の不整合や、バージョン間のデータの差異などです。

このような場合は、オンライン環境のタブレットのレプリカデータをローカル環境にコピーして問題を再現し、原因を特定します。

## 1. タブレットの情報を取得する

タブレット ID は BE ログで確認できます。確認したら、次のコマンドで情報を取得します（ここではタブレット ID を 10020 とします）。

タブレットが属する DbId/TableId/PartitionId などの情報を取得します。

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

前の手順で得た `DetailCmd` を実行し、BackendId/SchemaHash などの情報を取得します。

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

タブレットのスナップショットを作成し、テーブル作成文を取得します。

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

`admin copy tablet` コマンドは、指定したタブレットについて、該当するレプリカとバージョンのスナップショットファイルを生成します。スナップショットファイルは、BE ノードの `Path` ディレクトリに保存されます。対象の BE ノードは `Ip` フィールドで示されます。

このディレクトリの下にタブレット ID を名前とするディレクトリが作成されます。後で使用するため、このディレクトリ全体をアーカイブします（ディレクトリが保持されるのは最長 60 分で、その後は自動的に削除されます）。

```
cd /path/to/be/storage/snapshot/20220830101353.2.3600
tar czf 10020.tar.gz 10020/
```

このコマンドは、タブレットに対応するテーブル作成文も生成します。このテーブル作成文は元のテーブル作成文とは異なり、バケット数とレプリカ数がどちらも 1 で、`versionInfo` フィールドが指定されている点に注意してください。このテーブル作成文は、後でタブレットをローカル環境にロードするときに使用します。

ここまでで必要な情報がそろいました。次のとおりです。

1. アーカイブしたタブレットデータ（例: 10020.tar.gz）。
2. テーブル作成文。

## 2. タブレットをローカル環境にロードする

1. ローカルデバッグ環境を構築する

     ローカル環境に単一ノードの Doris クラスター（1FE、1BE）をデプロイします。オンライン環境のクラスターと同じバージョンを使用してください。たとえば、オンライン環境が DORIS-1.1.1 の場合は、ローカル環境にも DORIS-1.1.1 をデプロイします。

2. テーブルを作成する

     前の手順で取得したテーブル作成文を使用して、ローカル環境にテーブルを作成します。

3. 新しく作成したテーブルのタブレット情報を取得する

     新しく作成したテーブルのバケット数とレプリカ数はいずれも 1 なので、レプリカを一つ持つタブレットが一つだけ存在します。
    
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
    
    ここで、次の情報を記録します。
    
    * TableId
    * PartitionId
    * TabletId
    * SchemaHash

    さらに、デバッグ環境の BE ノードのデータディレクトリに移動し、新しいタブレットが属するシャード ID を確認します。
    
    ```
    cd /path/to/storage/data/*/10017 && pwd
    ```
    
    このコマンドは、タブレット 10017 のディレクトリに移動して、そのパスを表示します。たとえば、次のようなパスが表示されます。
    
    ```
    /path/to/storage/data/0/10017
    ```
    
    この場合、`0` がシャード ID です。
        
4. タブレットデータを変更する

    最初の手順で取得したタブレットデータのアーカイブを展開します。エディターで 10017.hdr.json ファイルを開き、次のフィールドを前の手順で取得した情報に変更します。
    
    ```
    "table_id":10015
    "partition_id":10014
    "tablet_id":10017
    "schema_hash":44622287
    "shard_id":0
    ```

5. タブレットをロードする

     まず、デバッグ環境の BE プロセスを停止します（./bin/stop_be.sh）。次に、10017.hdr.json ファイルと同じディレクトリにあるすべての .dat ファイルを `/path/to/storage/data/0/10017/44622287` ディレクトリにコピーします。このディレクトリは、手順 3 で確認したデバッグ環境のタブレットのディレクトリです。`10017/44622287` はそれぞれタブレット ID とスキーマハッシュです。
    
     `meta_tool` ツールを使用して、元のタブレットメタデータを削除します。このツールは `be/lib` ディレクトリにあります。
    
    ```
    ./lib/meta_tool --root_path=/path/to/storage --operation=delete_meta --tablet_id=10017 --schema_hash=44622287
    ```
    
    `/path/to/storage` は BE のデータルートディレクトリです。削除に成功すると、delete successfully というログが表示されます。
    
    `meta_tool` ツールを使用して、新しいタブレットメタデータをロードします。
        
    ```
    ./lib/meta_tool --root_path=/path/to/storage --operation=load_meta --json_meta_path=/path/to/10017.hdr.json
    ```
    
    ロードに成功すると、load successfully というログが表示されます。
    
6. 検証する

     デバッグ環境の BE プロセスを再起動します（./bin/start_be.sh）。テーブルをクエリし、ロードしたタブレットのデータを取得できるか、オンライン環境で発生した問題を再現できるか確認します。
