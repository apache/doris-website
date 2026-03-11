export NODE_OPTIONS=--max-old-space-size=8192
export TEST_ENV_URL=http://localhost:3000
yarn build
touch build/.dummy
cp .asf-site.yaml ./build/.asf-site.yaml
cp versions.json ./build/