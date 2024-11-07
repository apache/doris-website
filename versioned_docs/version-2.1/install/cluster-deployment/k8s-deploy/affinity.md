---
{
  "title": "Affinity",
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

# Node Scheduling
The Doris Operator supports two types of scheduling strategies in K8s: nodeSelector, affinity and anti-affinity. During deployment, Doris Operator add pod anti-affinity for fe, and be. For FE, Doris Operator add anti-affinity to avoid two not running on same node for best effort. 
For BE the default anti-affinity do best effort to avoid FE and BE running on same node, and avoid two BE running on same node.

## NodeSelector
The Doris Operator provides `NodeSelector` to achieve strict scheduling for keeping services running on a specific group nodes. Please add labels to chosen nodes, refer to the [K8s doc](https://kubernetes.io/docs/tasks/configure-pod-container/assign-pods-nodes/) and do it.  

- FE NodeSelector  
    To schedule the FE service of a cluster to the nodes with the label `test-label = test-value`, after labeling the selected host nodes, please add the following configuration to [the DorisCluster resource to be deployed](install-quickstart.md#step-3-deploy-doris-cluster):
    ```yaml
    spec:
      feSpec:
        nodeSelector:
          test-label: test-value
    ```
    The nodeSelector supports adding multiple labels, and multiple labels can be added one by one in the yaml format when in use.  
- BE NodeSelector  
    To schedule the BE service of a cluster to the nodes with the two labels `test-be1 = test-value1, test-be2 = test-value2`, after labeling the selected host nodes, please add the following configuration to [the DorisCluster resource to be deployed](install-quickstart.md#step-3-deploy-doris-cluster):
    ```yaml
    spec:
      beSpec:
        nodeSelector:
          test-be1: test-value1
          test-be2: test-value2
    ```

## Affinity and Anti-affinity
The Doris Operator provides the native affinity and anti-affinity settings of K8s, which can be used to set the affinity and anti-affinity scheduling related to nodes and the affinity and anti-affinity scheduling between pods.  

### FE affinity
- required scheduling  
    To schedule the FE service to the nodes whose labels contain the key `topology.kubernetes.io/zone` and the value in `east1, east2`, please add the following configuration to [the DorisCluster resource to be deployed](install-quickstart.md#step-3-deploy-doris-cluster):
    ```yaml
    spec:
      feSpec:
        affinity:
          nodeAffinity:
            requiredDuringSchedulingIgnoredDuringExecution:
              nodeSelectorTerms:
              - matchExpressions:
                - key: topology.kubernetes.io/zone
                  operator: In
                  values:
                  - east1
                  - east2
    ```
  
- preferred scheduling  
    Do the best effort to schedule the FE service to the nodes whose labels contain the key `topology.kubernetes.io/zone` and the value in `east1, east2`, please add the following configuration to [the DorisCluster resource to be deployed](install-quickstart.md#step-3-deploy-doris-cluster):
    ```yaml
    spec:
      feSpec:
        affinity:
          nodeAffinity:
            preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 1
              preference:
                matchExpressions:
                - key: another-node-label-key
                  operator: In
                  values:
                  - east1
                  - east2
    ```
  
### BE affinity
- required scheduling  
  To schedule the BE service to the nodes whose labels contain the key `topology.kubernetes.io/zone` and the value in `east1, east2`, please add the following configuration to [the DorisCluster resource to be deployed](install-quickstart.md#step-3-deploy-doris-cluster):
    ```yaml
    spec:
      feSpec:
        affinity:
          nodeAffinity:
            requiredDuringSchedulingIgnoredDuringExecution:
              nodeSelectorTerms:
              - matchExpressions:
                - key: topology.kubernetes.io/zone
                  operator: In
                  values:
                  - east1
                  - east2
    ```

- preferred scheduling  
  Do the best effort to schedule the BE service to the nodes whose labels contain the key `topology.kubernetes.io/zone` and the value in `east1, east2`, please add the following configuration to [the DorisCluster resource to be deployed](install-quickstart.md#step-3-deploy-doris-cluster):
    ```yaml
    spec:
      feSpec:
        affinity:
          nodeAffinity:
            preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 1
              preference:
                matchExpressions:
                - key: another-node-label-key
                  operator: In
                  values:
                  - east1
                  - east2
    ```
:::tip Tip  
Please refer to the K8s official doc to learn more about [Affinity and Anti-affinity](https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/). 
:::