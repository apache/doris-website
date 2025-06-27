---
{
    "title": "使用arthas对fe进行profile",
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
在doris 3.1.0及以上版本中，在fe部署目录`${DORIS_FE_HOME}/arthas`中存放了Arthas工具（4.0.5版本），可以使用Arthas来打印火焰图、跟踪函数调用路径、输出函数调用时间、观察函数的入参和返回值等等，方便我们定位fe的各种运行时问题。
具体Arthas的使用方法可以参考：[Arthas官方文档](https://arthas.aliyun.com/en/doc/)


:::note
注：目前仅支持Linux和MacOS系统，暂未支持Windows系统
:::

打印火焰图的案例如下：
1. 运行`${DORIS_FE_HOME}/arthas/as.sh`脚本，选择`DorisFE`进程
```shell
bash ./as.sh
Arthas script version: 4.0.5
Found existing java process, please choose one and input the serial number of the process, eg : 1. Then hit ENTER.
* [1]: 75123 com.intellij.idea.Main
  [2]: 77285 org.apache.doris.DorisFE
  [3]: 76901 DorisBE
  [4]: 6776 org.jetbrains.jps.cmdline.Launcher
  [5]: 76265 DorisBE
  [6]: 80527 org.jetbrains.jps.cmdline.Launcher
2
```

2. 开始profile
```shell
[arthas@77285]$ profiler start
Profiling started
```

3. 结束profile，生成火焰图文件为20250627-115104.html
```angular2html
[arthas@77285]$ profiler stop --format html
OK
profiler output file: <DORIS_FE_HOME>/arthas-output/20250627-115104.html
```

# 在低版本fe中使用Arthas
For versions prior to 3.1, you need to manually download Arthas:
```shell
wget https://github.com/alibaba/arthas/releases/download/arthas-all-4.0.5/arthas-bin.zip
unzip arthas-bin.zip -o ${DORIS_FE_HOME}/arthas
```
