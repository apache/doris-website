---
{
    "title": "Upgrade",
    "language": "en"
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

This guide provides step-by-step instructions for upgrading Doris with a storage-compute decoupling architecture. The upgrade process involves three main steps: upgrading MetaService (MS), optionally upgrading Recycler, and finally upgrading the Frontend (FE) and Backend (BE) components.

## Prerequisites

Before proceeding with the upgrade, ensure the following:

1. **Process Check:**  Verify that all Doris processes (MetaService, Frontend, Backend) are functioning correctly. If a Recycler is deployed independently, ensure that the Recycler process is also running normally.

## Upgrade Steps

### Step 1: Upgrade MetaService

Assuming the following environment variables:
- `${MS_HOME}`: Working directory of MetaService.
- `${MS_PACKAGE_DIR}`: Directory containing the new MetaService package.

Upgrade each MetaService instance by following these steps.

1.1. Stop the current MetaService:
```shell
cd ${MS_HOME}
sh bin/stop_ms.sh
```

1.2. Backup the existing MetaService binaries:
```shell
mv ${MS_HOME}/bin bin_backup_$(date +%Y%m%d_%H%M%S)
mv ${MS_HOME}/lib lib_backup_$(date +%Y%m%d_%H%M%S)
```

1.3. Deploy the new package:
```shell
cp ${MS_PACKAGE_DIR}/bin ${MS_HOME}/bin
cp ${MS_PACKAGE_DIR}/lib ${MS_HOME}/lib
```

1.4. Start the new MetaService:
```shell
sh ${MS_HOME}/bin/start_ms.sh --daemon
```

1.5. Check status of the new MetaService:


### Step 2: Upgrade Recycler (Optional)

Assuming the following environment variables:
- `${RECYCLER_HOME}`: Working directory of Recycler
- `${MS_PACKAGE_DIR}`: Directory containing the new MetaService package, MetaService and Recycler use same package.

Upgrade each Recycler instance by following these steps.

1.1. Stop the current Recycler:
```shell
cd ${RECYCLER_HOME}
sh bin/stop_ms.sh
```

1.2. Backup the existing Recycler binaries:
```shell
mv ${RECYCLER_HOME}/bin bin_backup_$(date +%Y%m%d_%H%M%S)
mv ${RECYCLER_HOME}/lib lib_backup_$(date +%Y%m%d_%H%M%S)
```

1.3. Deploy the new package:
```shell
cp ${RECYCLER_PACKAGE_DIR}/bin ${RECYCLER_HOME}/bin
cp ${RECYCLER_PACKAGE_DIR}/lib ${RECYCLER_HOME}/lib
```

1.4. Start the new Recycler:
```shell
sh ${RECYCLER_HOME}/bin/start_ms.sh --recycler --daemon
```

1.5. Check status of the new Recycler:

### Step 3: Upgrade BE

Verify that all instances of MetaService and Recycler (if installed separately) have been upgraded.

Assuming the following environment variables:
- `${BE_HOME}`: Working directory of BE.
- `${BE_PACKAGE_DIR}`: Directory containing the new BE package.

Upgrade each BE instance by following these steps.

1.1. Stop the current BE:
```shell
cd ${BE_HOME}
sh bin/stop_be.sh
```

1.2. Backup the existing BE binaries:
```shell
mv ${BE_HOME}/bin bin_backup_$(date +%Y%m%d_%H%M%S)
mv ${BE_HOME}/lib lib_backup_$(date +%Y%m%d_%H%M%S)
```

1.3. Deploy the new package:
```shell
cp ${BE_PACKAGE_DIR}/bin ${BE_HOME}/bin
cp ${BE_PACKAGE_DIR}/lib ${BE_HOME}/lib
```

1.4. Start the new BE:
```shell
sh ${BE_HOME}/bin/start_be.sh --daemon
```

1.5. Check status of the new BE:
```sql
show backends;
```

### Step 4: Upgrade FE

Verify that all instances of BE have been upgraded.

Assuming the following environment variables:
- `${FE_HOME}`: Working directory of FE.
- `${FE_PACKAGE_DIR}`: Directory containing the new FE package.

Upgrade the Frontend (FE) instances in the following order:
1. Observer FE nodes
2. Non-master FE nodes
3. Master FE node

Upgrade each Frontend (FE) node by following these steps.

1.1. Stop the current FE:
```shell
cd ${FE_HOME}
sh bin/stop_fe.sh
```

1.2. Backup the existing FE binaries:
```shell
mv ${FE_HOME}/bin bin_backup_$(date +%Y%m%d_%H%M%S)
mv ${FE_HOME}/lib lib_backup_$(date +%Y%m%d_%H%M%S)
```

1.3. Deploy the new package:
```shell
cp ${FE_PACKAGE_DIR}/bin ${FE_HOME}/bin
cp ${FE_PACKAGE_DIR}/lib ${FE_HOME}/lib
```

1.4. Start the new FE:
```shell
sh ${FE_HOME}/bin/start_fe.sh --daemon
```

1.5. Check status of the new FE:
```sql
show frontends;
```