---
{
  "title": "データキャッシュ",
  "description": "Data Cacheは、リモートストレージシステム（HDFSまたはオブジェクト",
  "language": "ja"
}
---
Data Cacheは、リモートストレージシステム（HDFSまたはオブジェクトストレージ）から最近アクセスされたデータファイルをローカルディスクにキャッシュすることで、同じデータの後続クエリを高速化します。同じデータに頻繁にアクセスするシナリオでは、Data Cacheはリモートデータアクセスの繰り返しオーバーヘッドを回避し、ホットデータのクエリ分析のパフォーマンスと安定性を向上させることができます。

## 適用シナリオ

データキャッシュ機能は、Hive、Iceberg、Hudi、およびPaimonTableのクエリでのみ機能します。内部tableクエリや非ファイル外部tableクエリ（JDBCやElasticsearchなど）には効果がありません。

データキャッシュがクエリ効率を向上させることができるかどうかは、複数の要因に依存します。以下は、データキャッシュの適用シナリオです：

* 高速ローカルディスク

  データキャッシュディレクトリには、SSDやNVMEメディアローカルディスクなどの高速ローカルディスクの使用を推奨します。データキャッシュディレクトリにメカニカルハードドライブを使用することは推奨されません。基本的に、ローカルディスクのIO帯域幅とIOPSは、ネットワーク帯域幅およびソースストレージシステムのIO帯域幅とIOPSよりも大幅に高い必要があり、それによって顕著なパフォーマンス向上をもたらします。

* 十分なキャッシュ領域サイズ

  データキャッシュは、キャッシュ追い出しポリシーとしてLRU戦略を使用します。クエリされるデータにホットとコールドの明確な区別がない場合、キャッシュされたデータが頻繁に更新および置換される可能性があり、これによりクエリパフォーマンスが低下する場合があります。クエリパターンにホットとコールドの明確な区別があるシナリオ（例：ほとんどのクエリは今日のデータのみにアクセスし、履歴データにはほとんどアクセスしない）で、キャッシュ領域がホットデータを保存するのに十分な場合に、データキャッシュを有効にすることを推奨します。

* リモートストレージの不安定なIOレイテンシ

  この状況は通常、HDFSストレージで発生します。ほとんどの企業では、異なる事業部門が同じHDFSを共有しており、これによりピーク時間中に非常に不安定なIOレイテンシが発生する可能性があります。この場合、安定したIOレイテンシを確保する必要がある場合は、データキャッシュを有効にすることを推奨します。ただし、最初の2つの条件も考慮する必要があります。

## Data Cacheの有効化

データキャッシュ機能はデフォルトで無効になっており、FEとBEで関連パラメータを設定することで有効にする必要があります。

### BE設定

まず、`be.conf`でキャッシュパス情報を設定し、BEノードを再起動して設定を有効にします。

| パラメータ            | 必須 | 説明                              |
| ------------------- | --- | -------------------------------------- |
| `enable_file_cache` | Yes   | Data Cacheを有効にするかどうか、デフォルトはfalse               |
| `file_cache_path`   | Yes   | キャッシュディレクトリに関連する設定、JSON形式                      |
| `clear_file_cache`  | No   | デフォルトはfalse。trueの場合、BEノードの再起動時にキャッシュディレクトリがクリアされます |

`file_cache_path`の設定例：

```sql
file_cache_path=[{"path": "/path/to/file_cache1", "total_size":53687091200},{"path": "/path/to/file_cache2", "total_size":53687091200},{"path": "/path/to/file_cache3", "total_size":53687091200}]
```
`path` はキャッシュが保存されるパスであり、1つまたは複数のパスを設定できます。ディスクあたり1つのパスのみを設定することを推奨します。

`total_size` はキャッシュ領域サイズの上限値で、バイト単位で指定します。キャッシュ領域が上限を超えた場合、LRU戦略を使用してキャッシュデータが削除されます。

### FE 構成

単一セッションでData Cacheを有効にする：

```sql
SET enable_file_cache = true;
```
Data Cacheをグローバルに有効にする:

```sql
SET GLOBAL enable_file_cache = true;
```
`enable_file_cache`が有効でない場合、BEがキャッシュディレクトリで設定されていてもキャッシュは使用されないことに注意してください。同様に、BEがキャッシュディレクトリで設定されていない場合、`enable_file_cache`が有効であってもキャッシュは使用されません。

## Cache オブザーバビリティ

### View Cache Hit Rate

`set enable_profile=true`を実行してセッション変数を開くと、FE Webページの`Queries`タブでジョブのProfileを表示できます。データキャッシュ関連のメトリクスは以下の通りです：

```sql
-  FileCache:  0ns
    -  BytesScannedFromCache:  2.02  GB
    -  BytesScannedFromRemote:  0.00  
    -  BytesWriteIntoCache:  0.00  
    -  LocalIOUseTimer:  2s723ms
    -  NumLocalIOTotal:  444
    -  NumRemoteIOTotal:  0
    -  NumSkipCacheIOTotal:  0
    -  RemoteIOUseTimer:  0ns
    -  WriteCacheIOUseTimer:  0ns
```
* `BytesScannedFromCache`: ローカルキャッシュから読み取られたデータ量。

* `BytesScannedFromRemote`: リモートから読み取られたデータ量。

* `BytesWriteIntoCache`: キャッシュに書き込まれたデータ量。

* `LocalIOUseTimer`: ローカルキャッシュのIO時間。

* `RemoteIOUseTimer`: リモート読み取りのIO時間。

* `NumLocalIOTotal`: ローカルキャッシュでのIO操作数。

* `NumRemoteIOTotal`: リモートIO操作数。

* `WriteCacheIOUseTimer`: キャッシュへの書き込みのIO時間。

`BytesScannedFromRemote`が0の場合、キャッシュが完全にヒットしていることを意味します。

### 監視メトリクス

ユーザーはシステムTable`file_cache_statistics`を通じて、各Backendノードのキャッシュ統計を確認できます。

## 付録

### 原理

データキャッシュは、アクセスされたリモートデータをローカルのBEノードにキャッシュします。元のデータファイルは、アクセスされたIOサイズに基づいてBlocksに分割され、Blocksはローカルファイル`cache_path/hash(filepath).substr(0, 3)/hash(filepath)/offset`に保存され、BlockメタデータはBEノードに保存されます。同じリモートファイルにアクセスする際、dorisはファイルのキャッシュデータがローカルキャッシュに存在するかをチェックし、Blockのオフセットとサイズに基づいて、どのデータをローカルBlockから読み取り、どのデータをリモートから取得するかを決定し、新たに取得したリモートデータをキャッシュします。BEノードが再起動すると、`cache_path`ディレクトリをスキャンしてBlockメタデータを復元します。キャッシュサイズが上限に達すると、LRU原則に従って長時間使用されていないBlocksをクリーンアップします。
