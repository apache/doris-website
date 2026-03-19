---
{
  "title": "デバッグポイント",
  "language": "ja",
  "description": "デバッグポイントは、FEまたはBEコードに挿入されるコードの一部であり、プログラムがこのコードに実行が到達した時、"
}
---
# Debug Point

Debug pointは、FEまたはBEコードに挿入されるコードの一部で、プログラムの実行がこのコードに到達すると、

プログラムの変数や動作を変更することができます。

これは主に、通常の手段では例外をトリガーすることが不可能な場合のunit testやregression testに使用されます。

各debug pointには名前があり、名前は任意に設定でき、debug pointを有効化および無効化するスイッチがあり、

debug pointにデータを渡すこともできます。

FEとBEの両方がdebug pointをサポートしており、debug pointコードを挿入した後は、FEまたはBEの再コンパイルが必要です。

## Code Example

FE example

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
BEの例

```c++
void Status foo() {
     // dbug_be_foo_do_nothing is the debug point name
     // when it's active, DBUG_EXECUTE_IF will execute the code block
     DBUG_EXECUTE_IF("dbug_be_foo_do_nothing",  { return Status.Nothing; });
   
     do_foo_action();
     
     return Status.Ok;
}
```
## Global Config

debug pointをグローバルに有効にするには、`enable_debug_points`をtrueに設定する必要があります。

`enable_debug_points`は、FEのfe.confとBEのbe.confに配置されています。


## 指定されたDebug Pointの有効化

debug pointがグローバルに有効になった後、debug point名を含むhttpリクエストをFEまたはBEノードに送信する必要があります。<br/>
その後にのみ、プログラムが指定されたdebug pointに到達した時に、関連するコードが実行されます。

### API

```
POST /api/debug_point/add/{debug_point_name}[?timeout=<int>&execute=<int>]
```
### クエリパラメータ

* `debug_point_name`
    デバッグポイント名。必須パラメータ。

* `timeout`
    タイムアウト秒数。タイムアウト時、デバッグポイントは非アクティブ化されます。デフォルトは-1で、タイムアウトしません。オプション。

* `execute`
    アクティブ化後、デバッグポイントが実行可能な最大回数。デフォルトは-1で、無制限回数。オプション。


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

デバッグポイント `foo` を有効化した後、最大5回まで実行されます。

```
curl -X POST "http://127.0.0.1:8030/api/debug_point/add/foo?execute=5"

```
## カスタムパラメータの渡し方
debug pointを有効化する際、上記の"timeout"と"execute"に加えて、カスタムパラメータを渡すことも可能です。<br/>
パラメータはurlパス内で"key=value"の形式のキーと値のペアであり、debug point名の後に文字'?'で結合されます。<br/>
以下の例を参照してください。

### API

```
POST /api/debug_point/add/{debug_point_name}[?k1=v1&k2=v2&k3=v3...]
```
* `k1=v1` <br/>
  k1はパラメータ名 <br/>
  v1はパラメータ値 <br/>
  複数のキー・バリューペアは`&`で連結される <br/>
  

  
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
fe.confでhttp_port=8030が設定されたFEノードを想定して、<br/>
以下のhttpリクエストは、FEノードで`foo`という名前のデバッグポイントをアクティブにし、パラメータ`percent`と`duration`を渡します：
>注意: ユーザー名とパスワードが必要な場合があります。

```
curl -u root: -X POST "http://127.0.0.1:8030/api/debug_point/add/foo?percent=0.5&duration=3"
```
```
NOTE:
1. Inside FE and BE code, names and values of parameters are taken as strings.
2. Parameter names and values are case sensitive in http request and FE/BE code.
3. FE and BE share same url paths of REST API, it's just their IPs and Ports are different.
```
### FEとBEコードでパラメータを使用する
以下のリクエストは、FE内のデバッグポイント`OlapTableSink.write_random_choose_sink`をアクティブ化し、パラメータ`needCatchUp`と`sinkNum`を渡します：

```
curl -u root: -X POST "http://127.0.0.1:8030/api/debug_point/add/OlapTableSink.write_random_choose_sink?needCatchUp=true&sinkNum=3"
```
FE のコードは debug point `OlapTableSink.write_random_choose_sink` をチェックし、パラメータ値を取得します：

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
以下のリクエストは、BEでデバッグポイント`TxnManager.prepare_txn.random_failed`をアクティベートし、パラメータ`percent`を渡します：

```
curl -X POST "http://127.0.0.1:8040/api/debug_point/add/TxnManager.prepare_txn.random_failed?percent=0.7
```
BEのコードはデバッグポイント`TxnManager.prepare_txn.random_failed`をチェックし、パラメータ値を取得します：

```c++
DBUG_EXECUTE_IF("TxnManager.prepare_txn.random_failed",
		{if (rand() % 100 < (100 * dp->param("percent", 0.5))) {
		        LOG_WARNING("TxnManager.prepare_txn.random_failed random failed");
		        return Status::InternalError("debug prepare txn random failed");
		}}
);
```
## Debug Point を無効化

### API

```
	POST /api/debug_point/remove/{debug_point_name}
```
### クエリパラメータ

* `debug_point_name`
    デバッグポイント名。必須パラメータ。
    


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

デバッグポイント`foo`を無効にします。

```
curl -X POST "http://127.0.0.1:8030/api/debug_point/remove/foo"

```
## Debug Pointのクリア

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
## Regression テストでの Debug Points

>コミュニティの CI システムでは、FE と BE の `enable_debug_points` 設定はデフォルトで true になっています。

Regression テストフレームワークは、特定の debug point を有効化および無効化するメソッドも提供しており、<br/>
以下のように宣言されています：

```groovy
// "name" is the debug point to activate, "params" is a list of key-value pairs passed to debug point
def enableDebugPointForAllFEs(String name, Map<String, String> params = null);
def enableDebugPointForAllBEs(String name, Map<String, String> params = null);
// "name" is the debug point to deactivate
def disableDebugPointForAllFEs(String name);
def disableDebugPointForAllFEs(String name);
```
`enableDebugPointForAllFEs()` または `enableDebugPointForAllBEs()` は、エラーを生成したいテストアクションの前に呼び出す必要があり、<br/>
その後に `disableDebugPointForAllFEs()` または `disableDebugPointForAllBEs()` を呼び出す必要があります。

### Concurrent Issue

有効化されたdebug pointsはFEまたはBEにグローバルに影響するため、プルリクエストで他の並行テストが予期せず失敗する可能性があります。<br/>
これを回避するため、debug pointsを使用するregression testsはディレクトリ regression-test/suites/fault_injection_p0 に配置し、<br/>
グループ名は "nonConcurrent" にする必要があるという慣例があります。これらのregression testsはプルリクエストワークフローによって順次実行されます。

### Examples

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
