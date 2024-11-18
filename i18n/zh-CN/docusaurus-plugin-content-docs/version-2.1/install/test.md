---
{
"title": "Test",
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


## Title 标题

### level -3 标题

#### level 4

1. 创建 EKS 集群前，请确保[环境中已安装如下命令行工具](https://docs.aws.amazon.com/eks/latest/userguide/getting-started.html)。
   - 安装并配置 AWS 的命令行工具 AWS CLI。
   - 安装 EKS 集群命令行工具 eksctl。
   - 安装 Kubernetes 集群命令行工具 kubectl。
2. 创建 EKS 集群。支持以下两种方式：
   - [使用 eksctl 快速创建 EKS 集群](https://docs.aws.amazon.com/zh_cn/eks/latest/userguide/getting-started-eksctl.html)。
   - [使用 AWS 控制台和 AWS CLI 手动创建 EKS 集群](https://docs.aws.amazon.com/zh_cn/eks/latest/userguide/getting-started-console.html)。



1. 添加定制资源 StarRocksCluster。

    ```Bash
    kubectl apply -f https://raw.githubusercontent.com/StarRocks/starrocks-kubernetes-operator/main/deploy/starrocks.com_starrocksclusters.yaml
    ```

:::tip
zhengwei
:::


