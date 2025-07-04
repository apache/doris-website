---
{
    "title": "Tiered Storage Overview",
    "language": "en-US"
}
---

To help users reduce storage costs, Doris provides flexible options for cold data management.

| **Cold Data Options**       | **Applicable Conditions**                                                          | **Features**                                                                                                           |
|-----------------------------|------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------|
| **Compute-Storage Separation** | Users have the capability to deploy a compute-storage separation setup             | - Data is stored as a single replica in object storage<br>- Local caching accelerates hot data access<br>- Independent scaling of storage and compute resources significantly reduces costs |
| **Local Tiering**           | In the compute-storage integrated mode, users want to further optimize local storage resources | - Supports cooling cold data from SSD to HDD<br>- Fully utilizes the tiered characteristics of local storage to save high-performance storage costs         |
| **Remote Tiering**          | In the compute-storage integrated mode, users want to reduce costs using affordable object storage or HDFS | - Cold data is stored as a single replica in object storage or HDFS<br>- Hot data continues to use local storage<br>- Cannot be combined with local tiering for the same table |

With the above options, Doris can flexibly adapt to different deployment scenarios, achieving a balance between query efficiency and storage cost.
