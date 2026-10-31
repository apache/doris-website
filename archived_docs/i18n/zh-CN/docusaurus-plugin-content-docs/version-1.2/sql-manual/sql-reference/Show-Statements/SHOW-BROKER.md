---
{
    "title": "SHOW-BROKER",
    "language": "zh-CN"
}
---

## SHOW-BROKER

### Name

SHOW BROKER

## 描述

该语句用于查看当前存在的 broker

语法：

```sql
SHOW BROKER;
```

说明：

       1. LastStartTime 表示最近一次 BE 启动时间。
       2. LastHeartbeat 表示最近一次心跳。
       3. Alive 表示节点是否存活。
       4. ErrMsg 用于显示心跳失败时的错误信息。

## 举例

### Keywords

    SHOW, BROKER

### Best Practice

