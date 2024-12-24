---
{
    "title": "Business continuity & data recovery Overview",
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

**Doris** provides robust disaster recovery features through three core functionalities: **cross-cluster data synchronization**, **backup and recovery**, and **recycle bin recovery**. These capabilities help users effectively address data loss caused by hardware failures, software errors, or human mistakes, ensuring high data availability and reliability.

---

## 1. Cross-Cluster Data Synchronization

Doris's cross-cluster data synchronization feature enables real-time replication of data across different Doris clusters. This ensures critical data is distributed across multiple physically or logically isolated clusters, achieving geographical disaster recovery.

### Key Features:

- **Real-Time Synchronization**: Supports both full and incremental synchronization. Full synchronization replicates all data during the initial setup, while incremental synchronization continuously captures and syncs data changes, including data (inserts, updates, deletions) and schema changes (DDL).
- **Data Consistency**: Tracks data changes using logging mechanisms (e.g., Binlog) to ensure that the target cluster mirrors the source cluster exactly.
- **Geographical Disaster Recovery**: Supports synchronization between clusters located in different regions, allowing seamless failover to another cluster in case of failure.
- **Multi-Scenario Application**: Suitable for disaster recovery, business separation (e.g., read/write splitting), and multi-active cluster scenarios.

### Use Case Example:
A company deploys two Doris clusters in different cities: Cluster A as the primary cluster and Cluster B as the backup cluster. Using cross-cluster synchronization, if Cluster A is disrupted by a natural disaster, Cluster B can take over business operations seamlessly, minimizing downtime.

---

## 2. Backup and Recovery

Doris provides comprehensive backup and recovery capabilities to periodically save data snapshots and prevent data loss due to unexpected events.

### Key Features:

- **Full Backup**: Allows users to back up entire databases or tables, creating complete snapshots of the data.

### Use Case Example:
A company performs regular data backups and stores them in an object storage service (e.g., Amazon S3). When a critical table is accidentally deleted, the company quickly restores the data using the backup, ensuring business continuity.

---

## 3. Recycle Bin Recovery

Doris also offers a **recycle bin** feature that provides a straightforward way to recover recently deleted data, minimizing the impact of accidental operations.

### Key Features:

- **Temporary Deletion**: When a table or database is deleted, it is moved to the recycle bin instead of being permanently removed.
- **Retention Period**: Data remains in the recycle bin for a configurable retention period, allowing users to restore it if needed.
- **Quick Restoration**: Users can easily recover accidentally deleted data from the recycle bin without requiring a full backup restoration.
- **Data Security**: If no recovery is needed, data in the recycle bin will be automatically cleaned up after the retention period.

### Use Case Example:
A team accidentally deletes an important table during routine operations. By using the recycle bin, they quickly recover the table, avoiding the need for complex backup restoration processes and minimizing downtime.

---

## 4. Comprehensive Disaster Recovery Practices

By combining cross-cluster synchronization, backup and recovery, and recycle bin recovery, Doris enables a complete and efficient disaster recovery strategy:

- **Proactive Disaster Recovery**: Use cross-cluster synchronization for multi-active deployments, allowing business operations to switch to any cluster rapidly.
- **Passive Disaster Recovery**: Regularly back up data to ensure that even in the worst-case scenario, data can be restored from backups.
- **Quick Fixes**: Use the recycle bin to recover from accidental deletions swiftly.
- **Testing and Validation**: Regularly verify backups, synchronization, and recycle bin functionality to ensure the disaster recovery plan's effectiveness.

---

## Conclusion

Doris’s disaster recovery capabilities, powered by cross-cluster synchronization, backup and recovery, and recycle bin recovery, offer users:

- Comprehensive data protection.
- Flexible disaster recovery options.
- Rapid recovery from accidental deletions and system failures.

Whether addressing everyday operational errors or preparing for catastrophic disasters, Doris is an ideal choice for building highly reliable data systems. Explore Doris’s features further to create a robust disaster recovery plan tailored to your business needs!
