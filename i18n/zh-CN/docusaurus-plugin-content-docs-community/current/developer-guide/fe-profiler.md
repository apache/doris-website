---
{
    "title": "FE profiler生成火焰图",
    "language": "zh-CN"
}
---

<!-- 
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

# 介绍
在doris 2.1.4及以上版本中，在fe部署目录`${DORIS_FE_HOME}/bin`中会存在一个`profile_fe.sh`脚本。该脚本可以利用async-profiler工具生成fe的火焰图，用来发现fe的瓶颈点。


:::note
注：async-profiler工具目前仅支持Linux和MacOS系统，暂未支持Windows系统
:::

使用案例如下
```shell
$ # 默认监听fe 10秒，生成火焰图
$ ${DORIS_FE_HOME}/bin/profile_fe.sh

$ # 设置监听fe 30秒，生成火焰图
$ PROFILE_SECONDS=30 ${DORIS_FE_HOME}/bin/profile_fe.sh
```

在运行上面的命令后，将会监听fe一段时间。在这段时间内我们需要将关键的查询重复地发送给这个fe，使得async-profiler可以收集fe的关键栈帧信息。
在收集栈帧信息完成后，脚本将会在`${DORIS_FE_HOME}/log`目录下生成一个html火焰图文件，通常来讲fe的瓶颈将会在火焰图中呈现为平顶山（又矮又宽）的形态，针对这些栈帧对应的代码，我们可以做性能的优化。

如下是火焰图的示例
![](/images/fe-profiler.png)

# 在低版本fe中使用async-profiler
在2.1.4以下的版本中，需要手动下载两个文件
1. 将[ap-loader-all-3.0-8.jar](https://repo1.maven.org/maven2/me/bechberger/ap-loader-all/3.0-8/ap-loader-all-3.0-8.jar)下载至`${DORIS_FE_HOME}/lib`目录
2. 将[profile_fe.sh](https://raw.githubusercontent.com/apache/doris/master/bin/profile_fe.sh)下载至`${DORIS_FE_HOME}/bin`目录
3. 运行`profile_fe.sh`即可