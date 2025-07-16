---
{
    "title": "GET TABLETS DISTRIBUTION BETWEEN DIFFERENT DISKS",
    "language": "zh-CN"
}
---

# GET TABLETS DISTRIBUTION BETWEEN DIFFERENT DISKS
   
获取BE节点上每一个partition下的tablet在不同磁盘上的分布情况

```
curl -X GET http://be_host:webserver_port/api/tablets_distribution?group_by=partition
```

返回值就是BE节点上每一个partition下的tablet在各个磁盘上的数量分布，只包含tablet数量。

```
{
    msg: "OK",
    code: 0,
    data: {
        host: "***",
        tablets_distribution: [
            {
                partition_id:***,
                disks:[
                    {
                        disk_path:"***",
                        tablets_num:***,
                    },
                    {
                        disk_path:"***",
                        tablets_num:***,
                    },

                    ...

                ]
            },
            {
                partition_id:***,
                disks:[
                    {
                        disk_path:"***",
                        tablets_num:***,
                    },
                    {
                        disk_path:"***",
                        tablets_num:***,
                    },

                    ...

                ]
            },

            ...

        ]
    },
    count: ***
}
```

```
curl -X GET http://be_host:webserver_port/api/tablets_distribution?group_by=partition&partition_id=xxx
```

返回值就是BE节点上指定id的partition下的tablet在各个磁盘上的分布，包含tablet数量以及每一个tablet的id、schema hash和tablet size信息。

```
{
    msg: "OK",
    code: 0,
    data: {
        host: "***",
        tablets_distribution: [
            {
                partition_id:***,
                disks:[
                    {
                        disk_path:"***",
                        tablets_num:***,
                        tablets:[
                            {
                                tablet_id:***,
                                schema_hash:***,
                                tablet_size:***
                            },

                            ...

                        ]
                    },

                    ...

                ]
            }
        ]
    },
    count: ***
}
```
