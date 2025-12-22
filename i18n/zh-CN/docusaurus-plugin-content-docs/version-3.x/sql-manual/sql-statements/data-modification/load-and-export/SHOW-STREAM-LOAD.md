---
{
    "title": "SHOW STREAM LOAD",
    "language": "zh-CN",
    "description": "该语句用于展示指定的 Stream Load 任务的执行情况"
}
---

## 描述

该语句用于展示指定的 Stream Load 任务的执行情况

语法：

```sql
SHOW STREAM LOAD
[FROM db_name]
[
  WHERE
  [LABEL [ = "your_label" | LIKE "label_matcher"]]
  [STATUS = ["SUCCESS"|"FAIL"]]
]
[ORDER BY ...]
[LIMIT limit][OFFSET offset];
```

说明：

1. 默认 BE 是不记录 Stream Load 的记录，如果你要查看需要在 BE 上启用记录，配置参数是：`enable_stream_load_record=true` ，具体怎么配置请参照 [BE 配置项](../../../../admin-manual/config/be-config)
2. 如果不指定 db_name，使用当前默认 db

2.  如果使用 LABEL LIKE，则会匹配 Stream Load 任务的 label 包含 label_matcher 的任务
3.  如果使用 LABEL = ，则精确匹配指定的 label
4.  如果指定了 STATUS，则匹配 STREAM LOAD 状态
5.  可以使用 ORDER BY 对任意列组合进行排序
6.  如果指定了 LIMIT，则显示 limit 条匹配记录。否则全部显示
7.  如果指定了 OFFSET，则从偏移量 offset 开始显示查询结果。默认情况下偏移量为 0。

## 示例

1. 展示默认 db 的所有 Stream Load 任务
   
    ```sql
      SHOW STREAM LOAD;
    ```

2. 展示指定 db 的 Stream Load 任务，label 中包含字符串 "2014_01_02"，展示最老的 10 个
   
    ```sql
    SHOW STREAM LOAD FROM example_db WHERE LABEL LIKE "2014_01_02" LIMIT 10;
    ```

2. 展示指定 db 的 Stream Load 任务，指定 label 为 "load_example_db_20140102"
   
    ```sql
    SHOW STREAM LOAD FROM example_db WHERE LABEL = "load_example_db_20140102";
    ```

2. 展示指定 db 的 Stream Load 任务，指定 status 为 "success", 并按 StartTime 降序排序
   
    ```sql
    SHOW STREAM LOAD FROM example_db WHERE STATUS = "success" ORDER BY StartTime DESC;
    ```

2. 展示指定 db 的导入任务 并按 StartTime 降序排序，并从偏移量 5 开始显示 10 条查询结果
   
    ```sql
    SHOW STREAM LOAD FROM example_db ORDER BY StartTime DESC limit 5,10;
    SHOW STREAM LOAD FROM example_db ORDER BY StartTime DESC limit 10 offset 5;
    ```

## 关键词

SHOW, STREAM, LOAD



