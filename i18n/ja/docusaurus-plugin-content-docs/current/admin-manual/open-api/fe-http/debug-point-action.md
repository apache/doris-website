---
{
    "title": "デバッグポイント",
    "language": "ja",
    "description": "デバッグポイントは FE または BE のコードに挿入するコード片で、プログラムの実行がそこに到達したときに変数や動作を変更できます。"
}
---

# デバッグポイント

デバッグポイントは FE または BE のコードに挿入するコード片です。

プログラムの実行がそのコードに到達すると、変数やプログラムの動作を変更できます。

主に、通常の方法では特定の例外を発生させられない場合に、単体テストや回帰テストで使用します。

各デバッグポイントには任意の名前を付けられます。デバッグポイントの有効化と無効化を切り替えられます。

デバッグポイントにデータを渡すこともできます。

FE と BE はどちらもデバッグポイントをサポートします。デバッグポイントのコードを挿入した後は、FE または BE の再コンパイルが必要です。

## コード例

FE の例

```java
private Status foo() {
	// dbug_fe_foo_do_nothing is the debug point name
	// when it's active, DebugPointUtil.isEnable("dbug_fe_foo_do_nothing") returns true
	if (DebugPointUtil.isEnable("dbug_fe_foo_do_nothing")) {
      	return Status.Nothing;
    }
      	
    do_foo_action();
    
    return Status.Ok;
}
```

BE の例

```c++
void Status foo() {
     // dbug_be_foo_do_nothing is the debug point name
     // when it's active, DBUG_EXECUTE_IF will execute the code block
     DBUG_EXECUTE_IF("dbug_be_foo_do_nothing",  { return Status.Nothing; });
   
     do_foo_action();
     
     return Status.Ok;
}
```


## グローバル設定

デバッグポイントをグローバルに有効化するには、`enable_debug_points` を true に設定します。

`enable_debug_points` は FE の fe.conf と BE の be.conf にあります。


## 特定のデバッグポイントを有効化する

デバッグポイントをグローバルに有効化した後、デバッグポイント名を指定した HTTP リクエストを FE または BE ノードに送信します。<br/>
その後、プログラムの実行が指定したデバッグポイントに到達すると、対応するコードが実行されます。

### API

```
POST /api/debug_point/add/{debug_point_name}[?timeout=<int>&execute=<int>]
```


### クエリパラメータ

* `debug_point_name`
    デバッグポイント名です。必須パラメータです。

* `timeout`
    タイムアウトまでの秒数です。タイムアウトするとデバッグポイントは無効化されます。デフォルトは -1 で、タイムアウトしません。省略可能です。

* `execute`
    有効化後にデバッグポイントを実行できる最大回数です。デフォルトは -1 で、回数に制限はありません。省略可能です。


### リクエストボディ

なし

### レスポンス

```
{
    msg: "OK",
    code: 0
}
```
    
### 例


デバッグポイント `foo` を有効化し、実行回数を五回以下に制限します。
	
	
```
curl -X POST "http://127.0.0.1:8030/api/debug_point/add/foo?execute=5"

```


## カスタムパラメータを渡す
デバッグポイントを有効化する際は、上記の「timeout」と「execute」に加えて、カスタムパラメータも渡せます。<br/>
パラメータは URL パス内の「key=value」形式のキーと値の組で、デバッグポイント名の後に「?」を付けて指定します。<br/>
以下の例を参照してください。

### API

```
POST /api/debug_point/add/{debug_point_name}[?k1=v1&k2=v2&k3=v3...]
```
* `k1=v1` <br/>
  k1 はパラメータ名です。<br/>
  v1 はパラメータの値です。<br/>
  複数のキーと値の組は `&` で連結します。<br/>
  

  
### リクエストボディ

なし

### レスポンス

```
{
    msg: "OK",
    code: 0
}
```

### 例
FE ノードの fe.conf で http_port=8030 が設定されているとします。<br/>
次の HTTP リクエストは、FE ノードのデバッグポイント `foo` を有効化し、パラメータ `percent` と `duration` を渡します。
>注: ユーザー名とパスワードが必要な場合があります。
```
curl -u root: -X POST "http://127.0.0.1:8030/api/debug_point/add/foo?percent=0.5&duration=3"
```

```
NOTE:
1. Inside FE and BE code, names and values of parameters are taken as strings.
2. Parameter names and values are case sensitive in http request and FE/BE code.
3. FE and BE share same url paths of REST API, it's just their IPs and Ports are different.
```

### FE と BE のコードでパラメータを使用する
次のリクエストは、FE のデバッグポイント `OlapTableSink.write_random_choose_sink` を有効化し、パラメータ `needCatchUp` と `sinkNum` を渡します。
```
curl -u root: -X POST "http://127.0.0.1:8030/api/debug_point/add/OlapTableSink.write_random_choose_sink?needCatchUp=true&sinkNum=3"
```

FE のコードはデバッグポイント `OlapTableSink.write_random_choose_sink` を確認し、パラメータの値を取得します。
```java
private void debugWriteRandomChooseSink(Tablet tablet, long version, Multimap<Long, Long> bePathsMap) {
    DebugPoint debugPoint = DebugPointUtil.getDebugPoint("OlapTableSink.write_random_choose_sink");
    if (debugPoint == null) {
        return;
    }
    boolean needCatchup = debugPoint.param("needCatchUp", false);
    int sinkNum = debugPoint.param("sinkNum", 0);
    ...
}
```

次のリクエストは、BE のデバッグポイント `TxnManager.prepare_txn.random_failed` を有効化し、パラメータ `percent` を渡します。
```
curl -X POST "http://127.0.0.1:8040/api/debug_point/add/TxnManager.prepare_txn.random_failed?percent=0.7
```

BE のコードはデバッグポイント `TxnManager.prepare_txn.random_failed` を確認し、パラメータの値を取得します。
```c++
DBUG_EXECUTE_IF("TxnManager.prepare_txn.random_failed",
		{if (rand() % 100 < (100 * dp->param("percent", 0.5))) {
		        LOG_WARNING("TxnManager.prepare_txn.random_failed random failed");
		        return Status::InternalError("debug prepare txn random failed");
		}}
);
```


## デバッグポイントを無効化する

### API

```
	POST /api/debug_point/remove/{debug_point_name}
```


### クエリパラメータ

* `debug_point_name`
    デバッグポイント名です。必須パラメータです。
    


### リクエストボディ

なし

### レスポンス

```
{
    msg: "OK",
    code: 0
}
```
    
### 例


デバッグポイント `foo` を無効化します。
	
	
```
curl -X POST "http://127.0.0.1:8030/api/debug_point/remove/foo"

```
    
## デバッグポイントをすべてクリアする

### API

```
POST /api/debug_point/clear
```



### リクエストボディ

なし

### レスポンス

```
{
    msg: "OK",
    code: 0
}
```
    
### 例

	
```
curl -X POST "http://127.0.0.1:8030/api/debug_point/clear"
```

## 回帰テストでのデバッグポイント

>コミュニティの CI システムでは、FE と BE の `enable_debug_points` 設定はデフォルトで true です。

回帰テストフレームワークにも、特定のデバッグポイントを有効化または無効化するメソッドがあります。<br/>
これらのメソッドは次のように宣言されています。
```groovy
// "name" is the debug point to activate, "params" is a list of key-value pairs passed to debug point
def enableDebugPointForAllFEs(String name, Map<String, String> params = null);
def enableDebugPointForAllBEs(String name, Map<String, String> params = null);
// "name" is the debug point to deactivate
def disableDebugPointForAllFEs(String name);
def disableDebugPointForAllFEs(String name);
```
エラーを発生させたいテスト操作の前に `enableDebugPointForAllFEs()` または `enableDebugPointForAllBEs()` を呼び出し、<br/>
操作の後に `disableDebugPointForAllFEs()` または `disableDebugPointForAllBEs()` を呼び出す必要があります。

### 並行実行に関する注意

有効化したデバッグポイントは FE または BE 全体に影響するため、プルリクエスト内の他のテストが並行実行時に予期せず失敗する可能性があります。<br/>
これを避けるため、デバッグポイントを使う回帰テストは regression-test/suites/fault_injection_p0 ディレクトリに配置し、<br/>
グループ名を "nonConcurrent" にする規則があります。これらの回帰テストはプルリクエストのワークフローで逐次実行されます。

### 例

```groovy
// .groovy file of the test case must be in regression-test/suites/fault_injection_p0
// and the group name must be 'nonConcurrent'
suite('debugpoint_action', 'nonConcurrent') {
    try {
        // Activate debug point named "PublishVersionDaemon.stop_publish" in all FE
        // and pass parameter "timeout"
        // "execute" and "timeout" are pre-existing parameters, usage is mentioned above
        GetDebugPoint().enableDebugPointForAllFEs('PublishVersionDaemon.stop_publish', [timeout:1])

        // Activate debug point named "Tablet.build_tablet_report_info.version_miss" in all BE
        // and pass parameter "tablet_id", "version_miss" and "timeout"
        GetDebugPoint().enableDebugPointForAllBEs('Tablet.build_tablet_report_info.version_miss',
                                                  [tablet_id:'12345', version_miss:true, timeout:1])

        // Test actions which will run into debug point and generate error
        sql """CREATE TABLE tbl_1 (k1 INT, k2 INT)
               DUPLICATE KEY (k1)
               DISTRIBUTED BY HASH(k1)
               BUCKETS 3
               PROPERTIES ("replication_allocation" = "tag.location.default: 1");
            """
        sql "INSERT INTO tbl_1 VALUES (1, 10)"
        sql "INSERT INTO tbl_1 VALUES (2, 20)"
        order_qt_select_1_1 'SELECT * FROM tbl_1'

    } finally {
        // Deactivate debug points
        GetDebugPoint().disableDebugPointForAllFEs('PublishVersionDaemon.stop_publish')
        GetDebugPoint().disableDebugPointForAllBEs('Tablet.build_tablet_report_info.version_miss')
    }
}
```
