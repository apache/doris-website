---
{
    "title": "升级",
    "language": "zh-CN"
}
---

<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements. See the NOTICE file
distributed with this work for additional information
regarding copyright ownership. The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License. You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied. See the License for the
specific language governing permissions and limitations
under the License.
-->

本指南提供了使用存储计算解耦架构升级 Doris 的分步说明。升级过程涉及三个主要步骤：升级 MetaService（MS）、可选升级 Recycler，最后升级前端（FE）和后端（BE）组件。

## 先决条件

在开始升级之前，请确保以下事项：

1. **进程检查：** 验证所有 Doris 进程（MetaService、Frontend、Backend）是否正常运行。如果独立部署了 Recycler，请确保 Recycler 进程也正常运行。

## 升级步骤

### 步骤 1：升级 MetaService

假设以下环境变量：
- `${MS_HOME}`：MetaService 的工作目录。
- `${MS_PACKAGE_DIR}`：包含新 MetaService 包的目录。

按照以下步骤升级每个 MetaService 实例。

1.1. 停止当前 MetaService：
```shell
cd ${MS_HOME}
sh bin/stop_ms.sh
```

1.2. 备份现有 MetaService 二进制文件：
```shell
mv ${MS_HOME}/bin bin_backup_$(date +%Y%m%d_%H%M%S)
mv ${MS_HOME}/lib lib_backup_$(date +%Y%m%d_%H%M%S)
```

1.3. 部署新包：
```shell
cp ${MS_PACKAGE_DIR}/bin ${MS_HOME}/bin
cp ${MS_PACKAGE_DIR}/lib ${MS_HOME}/lib
```

1.4. 启动新的 MetaService：
```shell
sh ${MS_HOME}/bin/start_ms.sh --daemon
```

1.5. 检查新 MetaService 的状态：

### 步骤 2：升级 Recycler（可选）

假设以下环境变量：
- `${RECYCLER_HOME}`：Recycler 的工作目录
- `${MS_PACKAGE_DIR}`：包含新 MetaService 包的目录，MetaService 和 Recycler 使用相同的包。

按照以下步骤升级每个 Recycler 实例。

1.1. 停止当前 Recycler：
```shell
cd ${RECYCLER_HOME}
sh bin/stop_ms.sh
```

1.2. 备份现有 Recycler 二进制文件：
```shell
mv ${RECYCLER_HOME}/bin bin_backup_$(date +%Y%m%d_%H%M%S)
mv ${RECYCLER_HOME}/lib lib_backup_$(date +%Y%m%d_%H%M%S)
```

1.3. 部署新包：
```shell
cp ${RECYCLER_PACKAGE_DIR}/bin ${RECYCLER_HOME}/bin
cp ${RECYCLER_PACKAGE_DIR}/lib ${RECYCLER_HOME}/lib
```

1.4. 启动新的 Recycler：
```shell
sh ${RECYCLER_HOME}/bin/start_ms.sh --recycler --daemon
```

1.5. 检查新 Recycler 的状态：

### 步骤 3：升级 BE

验证所有 MetaService 和 Recycler（如果单独安装）实例已升级。

假设以下环境变量：
- `${BE_HOME}`：BE 的工作目录。
- `${BE_PACKAGE_DIR}`：包含新 BE 包的目录。

按照以下步骤升级每个 BE 实例。

1.1. 停止当前 BE：
```shell
cd ${BE_HOME}
sh bin/stop_be.sh
```

1.2. 备份现有 BE 二进制文件：
```shell
mv ${BE_HOME}/bin bin_backup_$(date +%Y%m%d_%H%M%S)
mv ${BE_HOME}/lib lib_backup_$(date +%Y%m%d_%H%M%S)
```

1.3. 部署新包：
```shell
cp ${BE_PACKAGE_DIR}/bin ${BE_HOME}/bin
cp ${BE_PACKAGE_DIR}/lib ${BE_HOME}/lib
```

1.4. 启动新的 BE：
```shell
sh ${BE_HOME}/bin/start_be.sh --daemon
```

1.5. 检查新 BE 的状态：
```sql
show backends;
```

### 步骤 4：升级 FE

验证所有 BE 实例已升级。

假设以下环境变量：
- `${FE_HOME}`：FE 的工作目录。
- `${FE_PACKAGE_DIR}`：包含新 FE 包的目录。

按以下顺序升级 Frontend（FE）实例：
1. 观察者 FE 节点
2. 非主 FE 节点
3. 主 FE 节点

按照以下步骤升级每个 Frontend（FE）节点。

1.1. 停止当前 FE：
```shell
cd ${FE_HOME}
sh bin/stop_fe.sh
```

1.2. 备份现有 FE 二进制文件：
```shell
mv ${FE_HOME}/bin bin_backup_$(date +%Y%m%d_%H%M%S)
mv ${FE_HOME}/lib lib_backup_$(date +%Y%m%d_%H%M%S)
```

1.3. 部署新包：
```shell
cp ${FE_PACKAGE_DIR}/bin ${FE_HOME}/bin
cp ${FE_PACKAGE_DIR}/lib ${FE_HOME}/lib
```

1.4. 启动新的 FE：
```shell
sh ${FE_HOME}/bin/start_fe.sh --daemon
```

1.5. 检查新 FE 的状态：
```sql
show frontends;
```