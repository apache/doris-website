---
{
    "title": "Точка отладки",
    "language": "ru",
    "description": "Точка отладки представляет собой фрагмент кода, добавленный в код FE или BE. Когда выполнение программы достигает этого фрагмента,"
}
---

# Точка отладки {#debug-point}

Точка отладки представляет собой фрагмент кода, добавленный в код FE или BE.

При выполнении этого фрагмента могут изменяться значения переменных или поведение программы.

Точки отладки в основном используются в модульных или регрессионных тестах, когда определённые исключения невозможно вызвать обычными способами.

У каждой точки отладки есть произвольное имя. Для включения и отключения точек отладки предусмотрены переключатели.

В точки отладки также можно передавать данные.

Точки отладки поддерживаются как в FE, так и в BE. После добавления кода точки отладки необходимо перекомпилировать FE или BE.

## Примеры кода {#code-example}

Пример для FE

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

Пример для BE

```c++
void Status foo() {
     // dbug_be_foo_do_nothing is the debug point name
     // when it's active, DBUG_EXECUTE_IF will execute the code block
     DBUG_EXECUTE_IF("dbug_be_foo_do_nothing",  { return Status.Nothing; });
   
     do_foo_action();
     
     return Status.Ok;
}
```


## Глобальная конфигурация {#global-config}

Чтобы включить точки отладки глобально, необходимо установить для `enable_debug_points` значение true.

Параметр `enable_debug_points` находится в файле fe.conf для FE и в файле be.conf для BE.


## Активация указанной точки отладки {#activate-a-specified-debug-point}

После глобального включения точек отладки необходимо отправить на узел FE или BE HTTP-запрос с именем точки отладки. <br/>
Только после этого при достижении указанной точки отладки программа сможет выполнить соответствующий код.

### API {#api}

```
POST /api/debug_point/add/{debug_point_name}[?timeout=<int>&execute=<int>]
```


### Параметры запроса {#query-parameters}

* `debug_point_name`
    Имя точки отладки. Обязательный параметр.

* `timeout`
    Тайм-аут в секундах. По его истечении точка отладки отключается. По умолчанию: -1, время действия не ограничено. Необязательный параметр.

* `execute`
    Максимальное число срабатываний точки отладки после активации. По умолчанию: -1, число срабатываний не ограничено. Необязательный параметр.  


### Тело запроса {#request-body}

Отсутствует

### Ответ {#response}

```
{
    msg: "OK",
    code: 0
}
```

### Примеры {#examples}


После активации точка отладки `foo` сработает не более пяти раз.


```
curl -X POST "http://127.0.0.1:8030/api/debug_point/add/foo?execute=5"

```


## Передача пользовательских параметров {#pass-custom-parameters}
При активации точки отладки помимо упомянутых выше параметров "timeout" и "execute" можно передавать пользовательские параметры.<br/>
Параметр задаётся парой ключа и значения в виде "key=value" в пути URL после имени точки отладки, через символ '?'.<br/> 
См. примеры ниже.

### API {#api-1}

```
POST /api/debug_point/add/{debug_point_name}[?k1=v1&k2=v2&k3=v3...]
```
* `k1=v1` <br/>
  k1: имя параметра <br/>
  v1: значение параметра <br/>
  Несколько пар ключей и значений соединяются символом `&` <br/>
  

  
### Тело запроса {#request-body-1}

Отсутствует

### Ответ {#response-1}

```
{
    msg: "OK",
    code: 0
}
```

### Примеры {#examples-1}
Предположим, что в файле fe.conf узла FE задана конфигурация http_port=8030. <br/>
Следующий HTTP-запрос активирует на узле FE точку отладки с именем `foo` и передаёт параметры `percent` и `duration`:
>ПРИМЕЧАНИЕ: могут потребоваться имя пользователя и пароль.
```
curl -u root: -X POST "http://127.0.0.1:8030/api/debug_point/add/foo?percent=0.5&duration=3"
```

```
NOTE:
1. Inside FE and BE code, names and values of parameters are taken as strings.
2. Parameter names and values are case sensitive in http request and FE/BE code.
3. FE and BE share same url paths of REST API, it's just their IPs and Ports are different.
```

### Использование параметров в коде FE и BE {#use-parameters-in-fe-and-be-code}
Следующий запрос активирует точку отладки `OlapTableSink.write_random_choose_sink` в FE и передаёт параметры `needCatchUp` и `sinkNum`: 
```
curl -u root: -X POST "http://127.0.0.1:8030/api/debug_point/add/OlapTableSink.write_random_choose_sink?needCatchUp=true&sinkNum=3"
```

Код FE проверяет точку отладки `OlapTableSink.write_random_choose_sink` и получает значения параметров:
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

Следующий запрос активирует точку отладки `TxnManager.prepare_txn.random_failed` в BE и передаёт параметр `percent`:
```
curl -X POST "http://127.0.0.1:8040/api/debug_point/add/TxnManager.prepare_txn.random_failed?percent=0.7
```

Код BE проверяет точку отладки `TxnManager.prepare_txn.random_failed` и получает значение параметра:
```c++
DBUG_EXECUTE_IF("TxnManager.prepare_txn.random_failed",
		{if (rand() % 100 < (100 * dp->param("percent", 0.5))) {
		        LOG_WARNING("TxnManager.prepare_txn.random_failed random failed");
		        return Status::InternalError("debug prepare txn random failed");
		}}
);
```


## Отключение точки отладки {#disable-debug-point}

### API {#api-2}

```
	POST /api/debug_point/remove/{debug_point_name}
```


### Параметры запроса {#query-parameters-1}

* `debug_point_name`
    Имя точки отладки. Обязательный параметр.
    


### Тело запроса {#request-body-2}

Отсутствует

### Ответ {#response-2}

```
{
    msg: "OK",
    code: 0
}
```

### Примеры {#examples-2}


Отключение точки отладки `foo`.


```
curl -X POST "http://127.0.0.1:8030/api/debug_point/remove/foo"

```

## Удаление всех точек отладки {#clear-debug-points}

### API {#api-3}

```
POST /api/debug_point/clear
```



### Тело запроса {#request-body-3}

Отсутствует

### Ответ {#response-3}

```
{
    msg: "OK",
    code: 0
}
```

### Примеры {#examples-3}


```
curl -X POST "http://127.0.0.1:8030/api/debug_point/clear"
```

## Точки отладки в регрессионных тестах {#debug-points-in-regression-test}

>В системе CI сообщества параметр `enable_debug_points` для FE и BE по умолчанию имеет значение true.

Фреймворк регрессионного тестирования также предоставляет методы для активации и отключения определённой точки отладки. <br/>
Они объявлены следующим образом:
```groovy
// "name" is the debug point to activate, "params" is a list of key-value pairs passed to debug point
def enableDebugPointForAllFEs(String name, Map<String, String> params = null);
def enableDebugPointForAllBEs(String name, Map<String, String> params = null);
// "name" is the debug point to deactivate
def disableDebugPointForAllFEs(String name);
def disableDebugPointForAllFEs(String name);
```
Метод `enableDebugPointForAllFEs()` или `enableDebugPointForAllBEs()` необходимо вызвать до действий теста, при которых должна возникнуть ошибка, <br/>
а `disableDebugPointForAllFEs()` или `disableDebugPointForAllBEs()` необходимо вызвать после них.

### Проблемы параллельного выполнения {#concurrent-issue}

Включённые точки отладки действуют на весь FE или BE, поэтому другие тесты, выполняющиеся параллельно, могут неожиданно завершиться с ошибкой в вашем pull request. <br/>
Во избежание этого принято размещать регрессионные тесты, использующие точки отладки, в каталоге regression-test/suites/fault_injection_p0, <br/>
а их группа должна называться "nonConcurrent": такие тесты выполняются последовательно в рамках workflow для pull request. 

### Примеры {#examples-4}

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
