---
{
"title": "Deploying on AWS",
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


To facilitate a quick experience of Doris on AWS, we have provided a CloudFormation template (CFT) that allows for rapid cluster launch and operation. With this template, you can automatically configure AWS resources and launch a Doris cluster with minimal configuration required.

Alternatively, you can also purchase AWS resources independently and deploy the cluster manually using standard methods.

## What's AWS CloudFormation?

CloudFormation enables users to create a "stack of resources" in just one step. Resources refer to the items created by users, such as EC2 instances, VPCs, subnets, and more. A group of such resources is referred to as a stack. Users can write a template that easily allows them to create a resource stack according to their preferences in a single step. This is faster, more repeatable, and offers better consistency compared to manual creation and configuration. Additionally, templates can be placed into source code for version control, enabling their use for any purpose whenever needed.

## What's Doris on AWS CloudFormation?

Currently, Doris provides the Doris CloudFormation Template, which allows users to quickly create a cluster of the relevant Doris version on AWS by directly using this template, enabling them to experience the latest Doris features.

:::caution

**Note: ** The template for building Doris clusters based on CloudFormation currently only supports the regions of us-east-1, us-west-1, and us-west-2. Doris on AWS CloudFormation is primarily intended for testing or experiencing purposes, and should not be used in production environments.
:::

##  Precautions for Use

- Determine the VPC and Subnet that will be deployed.

- Determine the key pair that will be used to log into the nodes.

- A VPC Endpoint Interface for S3 will be established during deployment.

## Start Deployment

**1. On the AWS console, navigate to CloudFormation and click on "Create stack".**

![Start Deployment](/images/start-deployment.jpeg)

Select the "Amazon S3 URL Template source" option, and fill in the "Amazon S3 URL" field with the following template link:

https://sdb-cloud-third-party.s3.amazonaws.com/doris-cf/cloudformation_doris.template.yaml

**2. Configure the specific parameters of the template**

![Configure the specific parameter](/images/configure-specific-parameters-1.jpeg)

![Configure the specific parameter](/images/configure-specific-parameters-2.jpeg)

![Configure the specific parameter](/images/configure-specific-parameters-3.jpeg)

The main parameters are described as follows:

- **VPC ID**: The VPC where the deployment will be performed.

- **Subnet ID**: The subnet where the deployment will be deployed.

- **Key pair name**: The public/private key pairs used to connect to the deployed BE and FE nodes.

- **Version of Doris**: The version of Doris to be deployed, such as 2.1.0, 2.0.6, etc.

- **Number of Doris FE**: The number of FE nodes. The template defaults to selecting only 1 FE.

- **Fe instance type**: The node type of FE, and the default value can be used.

- **Number of Doris Be**: The number of BE nodes, which can be 1 or 3.

- **Be instance type**: The node type of BE, and the default value can be used.

- **Meta data dir**: The metadata directory of the FE node, and the default value can be used.

- **Sys log level:** Sets the level of system logs, and the default value of "info" can be used.

- **Volume type of Be nodes:** The volume type of EBS mounted on BE nodes. Each node is mounted with one disk by default. The default value can be used.

- **Volume size of Be nodes**: The size of EBS mounted on BE nodes, measured in GB. The default value can be used.

## How to Connect to the Database

**1. The display after successful deployment is as follows:**

![How to Connect to the Database](/images/how-to-connect-to-the-database.jpeg)

**2. Next, find the connection address for FE as follows. In this example, you can view the address as 172.16.0.97 from the FE Outputs.**

![find the connection address for FE ](/images/find-connection-address-for-fe-1.jpeg)

![find the connection address for FE ](/images/find-connection-address-for-fe-2.jpeg)

![find the connection address for FE ](/images/find-connection-address-for-fe-3.jpeg)

**3. To connect to the deployed Doris Cluster, here are some default values after deploying Doris using CloudFormation:**

- **FE IP**: Obtain the IP address of FE following the steps in the previous section.

- **FE MySQL protocol port:** 9030

- **FE HTTP protocol port**: 8030

- **Default root password**: empty

- **Default admin password:** empty