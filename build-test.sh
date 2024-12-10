export NODE_OPTIONS=--max-old-space-size=16384
export TEST_ENV_URL=http://localhost:3000
yarn && yarn build
touch build/.dummy
cp .asf-site.yaml ./build/.asf.yaml
cp versions.json ./build/

# tar -czvf build.tar.gz build