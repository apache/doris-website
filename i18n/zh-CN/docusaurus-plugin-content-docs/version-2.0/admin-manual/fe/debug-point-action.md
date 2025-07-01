---
{
    "title": "代码打桩",
    "language": "zh-CN"
}
---

代码打桩是代码测试使用的。激活木桩后，可以执行木桩代码。木桩的名字是任意取的。

FE 和 BE 都支持代码打桩。

## 木桩代码示例

FE 桩子示例代码

```java
private Status foo() {  
	// dbug_fe_foo_do_nothing 是一个木桩名字，
	// 打开这个木桩之后，DebugPointUtil.isEnable("dbug_fe_foo_do_nothing") 将会返回 true
	if (DebugPointUtil.isEnable("dbug_fe_foo_do_nothing")) {
		return Status.Nothing;
	}
      	
     do_foo_action();
     
     return Status.Ok;
}
```

BE 桩子示例代码

```c++
void Status foo() {

     // dbug_be_foo_do_nothing 是一个木桩名字，
     // 打开这个木桩之后，DEBUG_EXECUTE_IF 将会执行宏参数中的代码块
     DEBUG_EXECUTE_IF("dbug_be_foo_do_nothing",  { return Status.Nothing; });
   
     do_foo_action();
     
     return Status.Ok;
}
```

## 总开关

需要把木桩总开关 `enable_debug_points` 打开之后，才能激活木桩。默认情况下，木桩总开关是关闭的。

总开关`enable_debug_points` 分别在 FE 的 fe.conf 和 BE 的 be.conf 中配置。


## 打开木桩

### API

```
	POST /api/debug_point/add/{debug_point_name}[?timeout=<int>&execute=<int>]
```


### 参数

* `debug_point_name`
    木桩名字。必填。

* `timeout`
    超时时间，单位为秒。超时之后，木桩失活。默认值 -1 表示永远不超时。可填。

* `execute`
    木桩最大激活次数。默认值 -1 表示不限激活次数。可填。       


### Request body

无

### Response

    ```
    {
        msg: "OK",
        code: 0
    }
    ```
    
## 举例s


打开木桩 `foo`，最多激活 5 次。
	
	
    ```
    curl -X POST "http://127.0.0.1:8030/api/debug_point/add/foo?execute=5"

    ```
    
## 关闭木桩

### API

```
	POST /api/debug_point/remove/{debug_point_name}
```


### 参数

* `debug_point_name`
    木桩名字。必填。     


### Request body

无

### Response

```
    {
        msg: "OK",
        code: 0
    }
```
    
## 举例s


关闭木桩`foo`。
	
	
    ```
    curl -X POST "http://127.0.0.1:8030/api/debug_point/remove/foo"

    ```
    
## 清除所有木桩

### API

```
	POST /api/debug_point/clear
```



### Request body

无

### Response

    ```
    {
        msg: "OK",
        code: 0
    }
    ```
    
## 举例s


清除所有木桩。
	
    ```
    curl -X POST "http://127.0.0.1:8030/api/debug_point/clear"
    ```
