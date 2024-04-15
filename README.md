# Tulip-nodejs-api

node_modules folder is ignored

## Install NPM dependencies
Open a terminal and navigate to nodejs folder. Execute next command within nodejs folder:
```
$ npm install
```

## Run Project
After having node_modules folder created, execute next command within nodejs folder:
```
$ node dist/app.js
```

# Dockerfile
Make sure you have the nodejs folder with dist/ inside it. Then, run next command to build:
```
$ docker build -t minitulip-api:latest .
```
After having the image, run de container in background with next command:
```
$ docker run -d -p 8000:8000 minitulip-api
```

# Testing

`yarn test:unit src/controllers/__tests__/remedy_story`
`clear && yarn test:unit src/controllers/__tests__/remedy_story --coverage`

# Database

Test database:
`docker run --rm -d --name atlas-demo -p 3306:3306 -e MYSQL_ROOT_PASSWORD=pass -e MYSQL_DATABASE=example mysql:8.0.30`

## Connection strings

DB_PROD=tulip-prod-db-mysql-sfo3-do-user-10903731-0.b.db.ondigitalocean.com
DB_PROD_PASSWORD=AVNS_ORk8AGE61DYoLFIwo_9

DB_STAGING=db-mysql-sfo3-10927-staging-do-user-10903731-0.b.db.ondigitalocean.com
DB_STAGING_PASSWORD=AVNS_OlWzcBuE0wZNWgdDc8L

DB_DEV=tulip-dev-db-mysql-sfo3-91667-do-user-10903731-0.b.db.ondigitalocean.com
DB_DEV_PASSWORD=AVNS_o_yNz0DvBOs6MJL8Nev

## Connection strings for deployment

DB_ORIGIN="mysql://doadmin:$DB_DEV_PASSWORD@$DB_DEV:25060"
DB_TARGET="mysql://doadmin:$DB_DEV_PASSWORD@$DB_DEV:25060"
DB_ORIGIN="mysql://doadmin:$DB_STAGING_PASSWORD@$DB_STAGING:25060"
DB_TARGET="mysql://doadmin:$DB_STAGING_PASSWORD@$DB_STAGING:25060"
DB_ORIGIN="mysql://doadmin:$DB_PROD_PASSWORD@$DB_PROD:25060"
DB_TARGET="mysql://doadmin:$DB_PROD_PASSWORD@$DB_PROD:25060"



DB_ORIGIN_DEFAULTDB="$DB_ORIGIN/defaultdb" 
DB_TARGET_DEFAULTDB="$DB_TARGET/defaultdb"

DB_ORIGIN_DECISION="$DB_ORIGIN/decision" 
DB_TARGET_DECISION="$DB_TARGET/decision"

DB_ORIGIN_USERS="$DB_ORIGIN/users"
DB_TARGET_USERS="$DB_TARGET/users"

## Setup

docker run --rm -d --name atlas-demo -p 3306:3306 -e MYSQL_ROOT_PASSWORD=pass -e MYSQL_DATABASE=example mysql:8.0.30

echo atlas schema apply -u "$DB_TARGET_DEFAULTDB" -f defaultdb/schema.hcl --dev-url "mysql://root:pass@:3306/example"
atlas migrate hash
atlas migrate apply --url "$DB_TARGET_DEFAULTDB" --allow-dirty

echo atlas schema apply -u "$DB_TARGET_DECISION" -f decision/schema.hcl --dev-url "mysql://root:pass@:3306/example"
atlas migrate hash
atlas migrate apply --url "$DB_TARGET_DECISION" --allow-dirty

echo atlas schema apply -u "$DB_TARGET_USERS" -f users/schema.hcl --dev-url "mysql://root:pass@:3306/example"
atlas migrate hash
atlas migrate apply --url "$DB_TARGET_USERS" --allow-dirty


