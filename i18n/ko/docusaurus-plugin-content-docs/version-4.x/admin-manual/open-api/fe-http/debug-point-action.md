---
{
    "title": "디버그 포인트",
    "language": "ko",
    "description": "디버그 포인트는 FE 또는 BE 코드에 삽입하는 코드로, 프로그램 실행 중 이 코드에 도달하면"
}
---

# 디버그 포인트 {#debug-point}

디버그 포인트는 FE 또는 BE 코드에 삽입하는 코드로, 프로그램 실행 중 이 코드에 도달하면

프로그램의 변수나 동작을 변경할 수 있습니다.

주로 일반적인 방법으로는 특정 예외를 발생시킬 수 없을 때 단위 테스트나 회귀 테스트에 사용합니다.

각 디버그 포인트에는 원하는 이름을 지정할 수 있으며, 디버그 포인트를 활성화하거나 비활성화하는 스위치가 있습니다.

디버그 포인트에 데이터를 전달할 수도 있습니다.

FE와 BE는 모두 디버그 포인트를 지원하며, 디버그 포인트 코드를 삽입한 후에는 FE 또는 BE를 다시 컴파일해야 합니다.

## 코드 예제 {#code-example}

FE 예제

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

BE 예제

```c++
void Status foo() {
     // dbug_be_foo_do_nothing is the debug point name
     // when it's active, DBUG_EXECUTE_IF will execute the code block
     DBUG_EXECUTE_IF("dbug_be_foo_do_nothing",  { return Status.Nothing; });
   
     do_foo_action();
     
     return Status.Ok;
}
```


## 전역 설정 {#global-config}

디버그 포인트를 전역으로 활성화하려면 `enable_debug_points`를 true로 설정해야 합니다.

`enable_debug_points`는 FE의 fe.conf와 BE의 be.conf에 있습니다.


## 특정 디버그 포인트 활성화 {#activate-a-specified-debug-point}

디버그 포인트를 전역으로 활성화한 후에는 디버그 포인트 이름을 포함한 http 요청을 FE 또는 BE 노드로 보내야 합니다. <br/>
그 후에야 프로그램이 지정된 디버그 포인트에 도달할 때 관련 코드가 실행됩니다.

### API {#api}

```
POST /api/debug_point/add/{debug_point_name}[?timeout=<int>&execute=<int>]
```


### 쿼리 매개변수 {#query-parameters}

* `debug_point_name`
    디버그 포인트 이름입니다. 필수 매개변수입니다.

* `timeout`
    제한 시간이며, 단위는 초입니다. 제한 시간이 지나면 디버그 포인트가 비활성화됩니다. 기본값은 -1이며, 시간 제한이 없습니다. 선택 매개변수입니다.

* `execute`
    활성화 후 디버그 포인트를 실행할 수 있는 최대 횟수입니다. 기본값은 -1이며, 횟수 제한이 없습니다. 선택 매개변수입니다.  


### 요청 본문 {#request-body}

없음

### 응답 {#response}

```
{
    msg: "OK",
    code: 0
}
```

### 예제 {#examples}


디버그 포인트 `foo`를 활성화하고 최대 다섯 번 실행되도록 설정합니다.


```
curl -X POST "http://127.0.0.1:8030/api/debug_point/add/foo?execute=5"

```


## 사용자 정의 매개변수 전달 {#pass-custom-parameters}
디버그 포인트를 활성화할 때는 앞서 설명한 "timeout"과 "execute" 외에 사용자 정의 매개변수도 전달할 수 있습니다.<br/>
매개변수는 "key=value" 형식의 키-값 쌍으로, url 경로에서 디버그 포인트 이름 뒤에 '?' 문자로 연결합니다.<br/> 
아래 예제를 참고하세요.

### API {#api-1}

```
POST /api/debug_point/add/{debug_point_name}[?k1=v1&k2=v2&k3=v3...]
```
* `k1=v1` <br/>
  k1은 매개변수 이름입니다 <br/>
  v1은 매개변수 값입니다 <br/>
  여러 키-값 쌍은 `&`로 연결합니다 <br/>
  

  
### 요청 본문 {#request-body-1}

없음

### 응답 {#response-1}

```
{
    msg: "OK",
    code: 0
}
```

### 예제 {#examples-1}
fe.conf에서 http_port=8030으로 설정한 FE 노드가 있다고 가정합니다. <br/>
다음 http 요청은 FE 노드에서 `foo`라는 디버그 포인트를 활성화하고 `percent`와 `duration` 매개변수를 전달합니다:
>참고: 사용자 이름과 비밀번호가 필요할 수 있습니다.
```
curl -u root: -X POST "http://127.0.0.1:8030/api/debug_point/add/foo?percent=0.5&duration=3"
```

```
NOTE:
1. Inside FE and BE code, names and values of parameters are taken as strings.
2. Parameter names and values are case sensitive in http request and FE/BE code.
3. FE and BE share same url paths of REST API, it's just their IPs and Ports are different.
```

### FE 및 BE 코드에서 매개변수 사용 {#use-parameters-in-fe-and-be-code}
다음 요청은 FE에서 디버그 포인트 `OlapTableSink.write_random_choose_sink`를 활성화하고 `needCatchUp`과 `sinkNum` 매개변수를 전달합니다: 
```
curl -u root: -X POST "http://127.0.0.1:8030/api/debug_point/add/OlapTableSink.write_random_choose_sink?needCatchUp=true&sinkNum=3"
```

FE 코드는 디버그 포인트 `OlapTableSink.write_random_choose_sink`를 확인하고 매개변수 값을 가져옵니다:
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

다음 요청은 BE에서 디버그 포인트 `TxnManager.prepare_txn.random_failed`를 활성화하고 `percent` 매개변수를 전달합니다:
```
curl -X POST "http://127.0.0.1:8040/api/debug_point/add/TxnManager.prepare_txn.random_failed?percent=0.7
```

BE 코드는 디버그 포인트 `TxnManager.prepare_txn.random_failed`를 확인하고 매개변수 값을 가져옵니다:
```c++
DBUG_EXECUTE_IF("TxnManager.prepare_txn.random_failed",
		{if (rand() % 100 < (100 * dp->param("percent", 0.5))) {
		        LOG_WARNING("TxnManager.prepare_txn.random_failed random failed");
		        return Status::InternalError("debug prepare txn random failed");
		}}
);
```


## 디버그 포인트 비활성화 {#disable-debug-point}

### API {#api-2}

```
	POST /api/debug_point/remove/{debug_point_name}
```


### 쿼리 매개변수 {#query-parameters-1}

* `debug_point_name`
    디버그 포인트 이름입니다. 필수 매개변수입니다.
    


### 요청 본문 {#request-body-2}

없음

### 응답 {#response-2}

```
{
    msg: "OK",
    code: 0
}
```

### 예제 {#examples-2}


디버그 포인트 `foo`를 비활성화합니다.


```
curl -X POST "http://127.0.0.1:8030/api/debug_point/remove/foo"

```

## 디버그 포인트 전체 삭제 {#clear-debug-points}

### API {#api-3}

```
POST /api/debug_point/clear
```



### 요청 본문 {#request-body-3}

없음

### 응답 {#response-3}

```
{
    msg: "OK",
    code: 0
}
```

### 예제 {#examples-3}


```
curl -X POST "http://127.0.0.1:8030/api/debug_point/clear"
```

## 회귀 테스트의 디버그 포인트 {#debug-points-in-regression-test}

>커뮤니티 CI 시스템에서는 FE와 BE의 `enable_debug_points` 설정이 기본적으로 true입니다.

회귀 테스트 프레임워크에서도 특정 디버그 포인트를 활성화하거나 비활성화하는 메서드를 제공합니다. <br/>
선언은 다음과 같습니다:
```groovy
// "name" is the debug point to activate, "params" is a list of key-value pairs passed to debug point
def enableDebugPointForAllFEs(String name, Map<String, String> params = null);
def enableDebugPointForAllBEs(String name, Map<String, String> params = null);
// "name" is the debug point to deactivate
def disableDebugPointForAllFEs(String name);
def disableDebugPointForAllFEs(String name);
```
`enableDebugPointForAllFEs()` 또는 `enableDebugPointForAllBEs()`는 오류를 발생시키려는 테스트 동작 전에 호출해야 하며, <br/>
테스트 동작 후에는 `disableDebugPointForAllFEs()` 또는 `disableDebugPointForAllBEs()`를 호출해야 합니다.

### 동시 실행 문제 {#concurrent-issue}

활성화한 디버그 포인트는 FE 또는 BE 전체에 영향을 미치므로, pull request에서 동시에 실행되는 다른 테스트가 예기치 않게 실패할 수 있습니다. <br/>
이를 방지하기 위해 디버그 포인트를 사용하는 회귀 테스트는 regression-test/suites/fault_injection_p0 디렉터리에 두어야 하며, <br/>
그룹 이름은 "nonConcurrent"여야 한다는 규칙이 있습니다. 이러한 회귀 테스트는 pull request 워크플로에서 순차적으로 실행됩니다. 

### 예제 {#examples-4}

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
