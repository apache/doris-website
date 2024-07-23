---
{
    "title": "Use FE profiler to generate flame graph",
    "language": "en"
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

# introduce
In versions 2.1.4 and above of Doris, there will be a `profile_fe.sh` script in the fe deployment directory `${DORIS_FE_HOME}/bin`. This script can use the async-profiler tool to generate a flame graph of fe, which can be used to identify the bottleneck points of fe.

:::note
Note: The async profiler tool currently only supports Linux and MacOS systems, and does not currently support Windows systems
:::

The usage cases are as follows
```shell
$ # By default, monitor FE for 10 seconds to generate a flame graph
$ ${DORIS_FE_HOME}/bin/profile_fe.sh

$ # Set listening fe for 30 seconds to generate a flame graph
$ PROFILE_SECONDS=30 ${DORIS_FE_HOME}/bin/profile_fe.sh
```

After running the above command, it will listen to fe for a period of time. During this period, we need to repeatedly send key queries to this FE so that the async-profiler can collect FE's key stack frame information.
After collecting stack frame information, the script will generate an HTML flame graph file in the `${DORIS_FE_HOME}/log` directory. Generally, the bottleneck of fe will appear as a flat top (short and wide) in the flame graph. We can optimize the performance of the code corresponding to these stack frames.

The following is an example of a flame graph
![](/images/fe-profiler.png)

# Using async-profiler in lower versions of fe
In versions below 2.1.4, two files need to be manually downloaded
1. Download [ap-loader-all-3.0-8.jar](https://repo1.maven.org/maven2/me/bechberger/ap-loader-all/3.0-8/ap-loader-all-3.0-8.jar) to the `${DORIS_FE_HOME}/lib`directory
2. Download [profile_fe.sh](https://raw.githubusercontent.com/apache/doris/master/bin/profile_fe.sh) to the `${DORIS_FE_HOME}/bin`directory
3. Just run `profile_fe.sh`