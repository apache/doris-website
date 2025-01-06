---
{
"title": "软硬件环境检查",
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

部署 Doris 时，需要对软硬件环境进行以下检查：

- 硬件环境检查
  
- 服务器建议配置
  
- 硬盘空间计算
  
- Java 环境检查

## 硬件环境检查

在硬件环境检查中，要对以下硬件条件进行检查：

| 检查项   | 预期结果               |
| -------- | ---------------------- |
| CPU      | 具有 AVX2 指令集。     |
| 内存     | 建议至少 CPU 4 倍。    |
| 存储     | 推荐 SSD 硬盘。        |
| 文件系统 | ext4 或 xfs 文件系统。 |
| 网卡     | 万兆网卡。             |

### CPU 检查

当安装 Doris 时，建议选择支持 AVX2 指令集的机器，以利用 AVX2 的向量化能力实现查询向量化加速。

运行以下命令，有输出结果，及表示机器支持 AVX2 指令集。

```bash
cat /proc/cpuinfo | grep avx2
```

如果机器不支持 AVX2 指令集，可以使用 no AVX2 的 Doris 安装包进行部署。

### 内存检查

Doris 没有强制的内存限制。一般在生产环境中，可以根据以下建议选择内存大小：

| 组件 | 推荐内存配置                                                 |
| ---- | ------------------------------------------------------------ |
| FE   | 建议至少 16GB 以上。                                         |
| BE   | 建议内存至少是 CPU 核数的 4 倍（例如，16 核机器至少配置 64G 内存）。在内存是 CPU 核数 8 倍时，会得到更好的性能。 |

### 存储检查

Doris 部署时数据可以存放在 SSD 或 HDD 硬盘或者对象存储中。

在以下几种场景中建议使用 SSD 作为数据存储：

- 大规模数据量下的高并发点查场景
  
- 大规模数据量下的高频数据更新场景

### 文件系统检查

Doris 推荐使用 EXT4 或 XFS 文件系统。EXT4 文件系统具有良好的稳定性、性能和较低的碎片化问题。XFS 文件系统在处理大规模数据和高并发写操作时表现优越，适合高吞吐量应用。

### 网卡检查

Doris 在进行计算过程涉及将数据分片分发到不同的实例上进行并行处理，会导致一定的网络资源开销。为了最大程度优化 Doris 性能并降低网络资源开销，强烈建议在部署时选用万兆网卡（10 Gigabit Ethernet，即 10GbE）或者更快网络。如果有多块网卡，建议使用链路聚合方式将多块网卡绑定成一块网卡，提高网络带宽、冗余性和复杂均衡的能力。

## 服务器建议配置

Doris 支持运行和部署在 x86-64 架构的服务器平台或 ARM64 架构的服务器上。

- 开发及测试环境
  
  | 模块       | CPU   | 内存     | 磁盘                | 网络      | 实例数量（最低要求） |
  | -------- | ----- | ------ | ----------------- | ------- | ---------- |
  | Frontend | 8 核 + | 8 GB+  | SSD 或 SATA，10 GB+ | 千兆/万兆网卡 | 1          |
  | Backend  | 8 核 + | 16 GB+ | SSD 或 SATA，50 GB+ | 千兆/万兆网卡 | 1          |

  :::info 说明
  * 在验证测试环境中，可以将 FE 与 BE 部署在同一台服务器上
  * 一台机器上一般只建议部署一个 BE 实例，同时只能部署一个 FE
  * 如果需要 3 副本数据，那么至少需要 3 台机器各部署一个 BE 实例，而不是 1 台机器部署 3 
  :::

- 生产环境
  
  | 模块       | CPU    | 内存     | 磁盘                  | 网络   | 实例数量（最低要求） |
  | -------- | ------ | ------ | ------------------- | ---- | ---------- |
  | Frontend | 16 核 + | 64 GB+ | SSD 或 RAID 卡，100GB+ | 万兆网卡 | 1          |
  | Backend  | 16 核 + | 64 GB+ | SSD 或 SATA，100G+    | 万兆网卡 | 3          |

  :::info 说明
  * 在生产环境中，如果 FE 与 BE 混布，需要注意资源争用问题，建议元数据存储与数据存储分盘存放
  * BE 节点可以配置多块硬盘存储，在一个 BE 实例上绑定多块 HDD 或 SSD 盘
  * 集群的性能与 BE 节点的资源有关，BE 节点越多，Doris 性能越好。通常情况下在 10 - 100 台机器上可以充分发挥 Doris 的性能
  :::

## 硬盘空间计算

在 Doris 集群中，FE 主要用于元数据存储，包括元数据 edit log 和 image。BE 的磁盘空间主要用于存放数据，需要根据业务需求计算。

| 组件     | 磁盘空间说明                                                                                                |
| ------ | ----------------------------------------------------------------------------------------------------- |
| FE     | 建议预留 100GB 以上的存储空间，使用 SSD 硬盘。                                                                         |
| BE     | Doris 默认 LZ4 压缩方式进行存储，压缩比在 0.3 - 0.5 左右磁盘空间需要按照总数据量 \* 3（3 副本）计算需要预留出 40% 空间用作后台 compaction 以及临时数据的存储 |

## Java 环境检查

Doris 的所有进程都依赖 Java。

- 在 2.1（含）版本之前，请使用 Java 8，推荐版本：`openjdk-8u352-b08-linux-x64`。
  
- 从 3.0（含）版本之后，请使用 Java 17，推荐版本：`jdk-17.0.10_linux-x64_bin.tar.gz`。
