---
{
    'title': "Scaling Bitcoin data to billions of records with Apache Doris: our journey to auto-partitioning",
    'description': "To power lightning-fast queries and ensure the Deep Dive dashboards deliver real-time insights, Ortege relies on Apache Doris. A crucial feature they embrace is Auto Partition.",
     'summary': "To power lightning-fast queries and ensure the Deep Dive dashboards deliver real-time insights, Ortege relies on Apache Doris. A crucial feature they embrace is Auto Partition.",
    'date': '2024-11-20',
    'author': 'Justin Trollip',
    'tags': ['Best Practice'],
    'picked': "true",
    'order': "1",
    "image": '/images/ortege-1.jpg'
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

:::info Special Thanks

 The Apache Doris community shares our deep appreciation for [Justin Trollip](https://www.linkedin.com/in/justintrollip/), Founder of [Ortege AI](https://www.ortege.ai/), for providing his hands-on experience in applying Auto Partition of Apache Doris to manage massive blockchain data. Justin is a passionate and visionary technologist and entrepreneur, and we are glad to have him join the Apache Doris user community and share his insights with us.

:::

At Ortege, we're building the ultimate blockchain data platform, providing comprehensive and accessible insights to empower the crypto community. One of our biggest challenges is managing the sheer volume of data, especially for Bitcoin. Our bitcoin.outputs table alone contains over **3 billion records** and it's growing every day!

To power our lightning-fast queries and ensure Ortege Studio's Deep Dive dashboards deliver real-time insights, we rely on Apache Doris, a high-performance analytical database. A crucial feature we've embraced is **Doris' auto-partitioning**.

**From manual to automated:**

Initially, we manually defined partitions for our Bitcoin tables, meticulously crafting ranges based on block height. While this worked well for Bitcoin's relatively predictable growth, it became cumbersome for newer chains like Stacks, where data patterns are more dynamic.

**Enter Doris auto-partitioning:**

Doris' auto-partitioning changed the game. It automatically creates partitions based on the data being ingested, eliminating the need for manual intervention. We can now define partition rules (e.g., partition by month based on the block timestamp) and let Doris handle the rest. This is a game-changer for:

- **Scalability:** Effortlessly accommodate massive data growth without manual schema updates.
- **Performance:** Optimize query speed by ensuring data is distributed efficiently across partitions.
- **Flexibility:** Easily adapt to changing data patterns, especially for newer chains with less predictable growth.

**A tailored approach:**

While auto-partitioning is perfect for many scenarios, we've found that a hybrid approach works best for Bitcoin. We use auto-partitioning for recent data while manually managing partitions for historical data, balancing automation with fine-grained control.

**Lessons learned:**

Our experience with Doris auto-partitioning has taught us that:

- **Flexibility is key:** Choose a data platform that can adapt to your specific needs and data characteristics.
- **Automation is powerful:** Leverage automation to streamline data management and focus on extracting insights.
- **Performance matters:** A high-performance database like Apache Doris is essential for handling the scale of blockchain data.

**We're committed to providing the most comprehensive and accessible blockchain data platform, and Apache Doris' auto-partitioning is a crucial part of that journey. Stay tuned as we continue to innovate and empower the crypto community with data-driven insights.**

This article was written by Justin Trollip and originally posted on [Linkedin](https://www.linkedin.com/pulse/scaling-bitcoin-data-billions-records-apache-doris-our-journey-diknc/?trackingId=pSs7z3aeSguCbWyxTcew6w%3D%3D).