---
{
    "title": "PipelineX 执行引擎",
    "language": "zh-CN",
    "toc_min_heading_level": 2,
    "toc_max_heading_level": 4
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

PipelineX 执行引擎 是 Doris 在 2.1 版本加入的实验性功能。目标是为了解决 Doris pipeline 引擎的四大问题：

1. 执行并发上，当前 Doris 执行并发收到两个因素的制约，一个是 fe 设置的参数，另一个是受存储层 bucket 数量的限制，这样的静态并发使得执行引擎无法充分利用机器资源。

2. 执行逻辑上，当前 Doris 有一些固定的额外开销，例如表达式部分各个 instance 彼此独立，而 instance 的初始化参数有很多公共部分，所以需要额外进行很多重复的初始化步骤。

3. 调度逻辑上，当前 pipeline 的调度器会把阻塞 task 全部放入一个阻塞队列中，由一个线程负责轮询并从阻塞队列中取出可执行 task 放入 runnable 队列，所以在有查询执行的过程中，会固定有一个核的资源作为调度的开销。

4. profile 方面，目前 pipeline 无法为用户提供简单易懂的指标。

使用最新的 PipelineX 执行引擎，请参考 Doris 2.1。