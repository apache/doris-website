#!/bin/bash

# Default version
DORIS_QUICK_START_VERSION="2.1.9"

# Parse parameters
while getopts "v:" opt; do
  case $opt in
    v) DORIS_QUICK_START_VERSION="$OPTARG"
    ;;
    \?) echo "Invalid option: -$OPTARG" >&2
    exit 1
    ;;
  esac
done

# Check system type
OS_TYPE=$(uname -s)
if [[ "$OS_TYPE" != "Linux" && "$OS_TYPE" != "Darwin" ]]; then
  echo "Error: Unsupported operating system [$OS_TYPE], only Linux and Mac are supported"
  exit 1
fi

# Check Docker environment
if ! command -v docker &> /dev/null; then
  echo "Error: Docker environment not detected, please install Docker first"
  exit 1
fi

# Check docker-compose
COMPOSE_CMD=""
if command -v docker-compose &> /dev/null; then
  COMPOSE_CMD="docker-compose"
elif docker compose version &> /dev/null; then
  COMPOSE_CMD="docker compose"
else
  echo "Error: docker-compose plugin or docker-compose command is required"
  exit 1
fi

# Generate docker-compose configuration for corresponding system
if [[ "$OS_TYPE" == "Linux" ]]; then
  cat > docker-compose-doris.yaml <<EOF
version: "3"
services:
  fe:
    image: apache/doris:fe-${DORIS_QUICK_START_VERSION}
    hostname: fe
    environment:
     - FE_SERVERS=fe1:127.0.0.1:9010
     - FE_ID=1
    network_mode: host
  be:
    image: apache/doris:be-${DORIS_QUICK_START_VERSION}
    hostname: be
    environment:
     - FE_SERVERS=fe1:127.0.0.1:9010
     - BE_ADDR=127.0.0.1:9050
    depends_on:
      - fe
    network_mode: host
EOF
else # Mac system
  cat > docker-compose-doris.yaml <<EOF
version: "3"
networks:
  custom_network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.80.0/24

services:
  fe:
    image: apache/doris:fe-${DORIS_QUICK_START_VERSION}
    hostname: fe
    ports:
      - 8030:8030
      - 9030:9030
      - 9010:9010
    environment:
      - FE_SERVERS=fe1:172.20.80.2:9010
      - FE_ID=1
    networks:
      custom_network:
        ipv4_address: 172.20.80.2

  be:
    image: apache/doris:be-${DORIS_QUICK_START_VERSION}
    hostname: be
    ports:
      - 8040:8040
      - 9050:9050
    environment:
      - FE_SERVERS=fe1:172.20.80.2:9010
      - BE_ADDR=172.20.80.3:9050
    depends_on:
      - fe
    networks:
      custom_network:
        ipv4_address: 172.20.80.3
EOF
fi

# Start services
$COMPOSE_CMD -f docker-compose-doris.yaml up -d

echo "Doris cluster started successfully, version: ${DORIS_QUICK_START_VERSION}"
echo "You can manage the cluster using the following commands:"
echo "  Stop cluster: $COMPOSE_CMD -f docker-compose-doris.yaml down"
echo "  View logs: $COMPOSE_CMD -f docker-compose-doris.yaml logs -f"
echo "  Connect to cluster: mysql -uroot -P9030 -h127.0.0.1"

# Display connection information based on system type
if [[ "$OS_TYPE" == "Linux" ]]; then
  echo -e "\nAccess FE/BE http ports (8030, 8040) using the following addresses (Linux system):"
  echo "  http://127.0.0.1:8030"
  echo "  http://127.0.0.1:8040"
elif [[ "$OS_TYPE" == "Darwin" ]]; then
  echo -e "\nAccess FE/BE http ports (8030, 8040) using the following addresses (Mac system):"
  echo "  http://docker.for.mac.localhost:8030"
  echo "  http://docker.for.mac.localhost:8040"
  echo "Note: If access fails, try using 127.0.0.1 address:"
  echo "  http://127.0.0.1:8030"
  echo "  http://127.0.0.1:8040"
fi 