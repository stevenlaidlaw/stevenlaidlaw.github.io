---
layout: main.njk
title: Learn Docker via an Over-engineered Todo
---

# {{ title }}

Learning new stuff is hard, so today I'm going to guide you through using Docker by over-engineering the hell out of Todo app. We will build a three-tier, RESTful web app running multiple containers. You know, like a normal person would.

> **Disclaimer:** All the commands here will assume you're running Linux. If you're not, then substitute the commands for your OS.

## The Specification

First we need to lay out the spec to make sure we know what we're building. For a standard three-tier app we'd need three separate containers that spoke to each other: the DB, the server, and the app.

For these I chose to use Postgres, Express, and React, respectively, but those technologies aren't the point of this article and can be replaced with anything you need. I'll include some of that code just so you understand what is going on, but won't go deep into detail on them.

The complete code is available in a link to my GitHub at the end of the article, so if you're interested in that part (or making fun of me for bad code) then feel free to peruse.

In any case, here is the basic spec I came up with:

1. Database container automatically initialise with relevant structure.
2. Express server with the following RESTful endpoints:
	1. **GET** `/todo` - List all todos
	2. **POST** `/todo` - Insert a new todo 
	3. **PATCH** `/todo/:id` - Update the relevant todo
3. React app that consumes the endpoints to update the database.

So it's a weak spec. I'm not a Product Manager, sue me, but it serves our purpose.

> **Note:** You might notice there is no DELETE endpoint. This is deliberate, as it's been drilled into me never to delete user data. Instead we will flag items as deleted in the database.

So let's create our directory structure:

```bash
mkdir -p overengineeredTodo/{app,db,server} && cd overengineeredTodo
```

## The Database Container

First we need to create the database which will persist our Todos. This is one of the simplest parts of Docker as containers for all your standard databases already exist. Whatever you're familiar with there is very likely to be a container for you. As I'm using Postgres we just need two files:

1. The Dockerfile
2. The DB init SQL file

Let's create them:

```bash
touch Dockerfile todo-init.sql
```

The `Dockerfile` file is what tells Docker what you want it to do and thanks to the pre-existing containers are really simple to use. Open it up in your editor of choice and enter the following line:

```Dockerfile
FROM postgres:9.5
ENV POSTGRES_DB tododb
COPY todo-init.sql /docker-entrypoint-initdb.d/
```

Boom. That's it. Using just that first line you can have a running, containerised instance of Postgres 9.5 running on your machine. The second is an optional environment variable to rename the database from the default. I've called it "tododb", but you can call it whatever you want. The third is a bit of Postgres specific magic that will allow us to run some SQL when the container is first initialised. Any files (you can have multiple) that are copied over to `/docker-entrypoint-initdb.d/` will be run automatically. For more information about Postgres entrypoints, see the Docker Hub documentation [here](https://hub.docker.com/_/postgres/).

Of course now we need to fill that file with data, so let's open up `todo-init.sql` and enter our database structure inside:

```sql
create table todo (
	id serial primary key,
	label varchar(256),
	complete boolean default false,
	deleted boolean default false,
	updated_date timestamp default current_timestamp
);
```

Here we're setting an id, a label, two flags for whether the todo is complete or deleted, and a timestamp for when the item was last updated. That's really all we need to do for the database.

## The Server Container

We won't go into full detail on the server as it's all specific to Express and Postgres, but you can view the relevant files in my [GitHub, here](https://github.com/stevenlaidlaw/OverengineeredTodo/blob/master/server/server.js). There are just some things to take note of relating to Docker that I'd like to call attention to:

1. Use environment variables for all the DB and server information.
2. CORS. We have to make sure to use CORS, as the separate containers are cross-origin.

Now run the commands to create the package.json file and install the required dependencies:

```bash
npm init && npm i -S express body-parser cors pg-promise
```

We also want to modify the scripts in package.json to allow the container to run it:

```js
{
	...
	"scripts": {
		"start": "node server.js"
	}
	...
}
```

Once this is set up you can go ahead and create another `Dockerfile` file in the server directory. We'll go through this one a few lines at a time as it's the most complex of the three.

```Dockerfile
FROM node:8
WORKDIR /usr/src/app
```

First we set the base container to be node 8 so that we can run the express server and set the working directory to `/usr/src/app`. This will determine where all the files we copy from this point on end up in the container's filesystem.

```Dockerfile
COPY package*.json ./
RUN npm install
```

Now we copy over the package files and then use the **RUN** command to install the relevant dependencies. **RUN** is a build step in the image, and you can have as many of those as you like. We include the wildcard in **COPY** to make sure we transfer over the `package-lock.json` file too.

```Dockerfile
COPY server.js ./
CMD [ "npm", "start" ]
``` 

Now we copy over the actual server file, and then run it! Here we use **CMD**, which describes what the container executes when you launch it. There can only be one **CMD**.

## The Application Container

For ease of use I used 'create-react-app' for this, but you can use whatever you like. Here I made a choice to run the builds locally and then copy over the built files to the Docker image. This is a judgement call, as you can just as well copy over the package.json files and run the build as part of the Dockerfile using the **RUN** command (just like our server did).

As with the server file I won't go into full detail in this post, but you can find the full application logic [here](https://github.com/stevenlaidlaw/OverengineeredTodo/blob/master/app/src/App.js). It's a fairly basic todo app written in React.

```Dockerfile
FROM nginx
COPY build /usr/share/nginx/html
```

First we use the base 'nginx' image to use as our webserver, and then copy over the build output. We will ensure that the build folder always contains the latest build by adding it to our build step.

## Bringing it all together

Now that all the individual container images are configured we can use Docker Compose to orchestrate it. Docker Compose is a tool for defining and running multi-container applications, so it's exactly what we need here! Drop back to the base `overengineeredTodo` directory and run the following command:

```bash
touch docker-compose.yml
```

This will create a configuration file for us to define how the containers should be brought up. First I'll dump the whole file here, and the we'll go through each command and what it does.

```yaml
version: '2.1'
services:

  app:
    build: 'app'
    restart: on-failure
    ports:
      - 8888:80

  db:
    build: 'db'
    restart: on-failure
    ports:
      - 5444:5432
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -h localhost -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 20

  server:
    build: 'server'
    restart: on-failure
    ports:
      - 8889:8889
    environment:
      - DB_HOST=localhost
      - DB_PORT=5444
      - DB_NAME=tododb
      - DB_USERNAME=postgres
      - DB_PASSWORD=postgres
      - API_HOST=localhost
      - API_PORT=8889
    network_mode: 'host'
    depends_on:
      db:
        condition: service_healthy
```

First we set the `version`. This tells us which format the docker-compose file should take. I'm personally using 2.1 as it's the one I'm most familiar with, but if you're starting a new project you should use the latest which, at time of this writing, is 3.7.

Next we build the services. These can be named whatever you like. Common to each service are a few commands.

### Common Commands

First is the `build` command, which is a path to a directory that contains a `Dockerfile`. This tells Compose where to find the images for building.

The next shared command is `restart`, which I've set to `on-failure`. This ensures the containers restart themselves if there are any issues.

The last common command is `ports`, which maps the relevant ports for each container.

For the ports I've done a few different things. On `app` I've remapped port 80 to 8888. This is for development purposes, and would likely just stay on port 80 in a live deployment environment. Similarly, I've remapped the default postgres port (5432) to `5444`. This isn't necessary at all, but I've got various other postgres containers running on my machine, so that's what you're stuck with.

### Unique Commands

#### healthcheck

This command is used to check on the health of the container and determine whether it's ready for operation. This is important for the database as if we attempt to bring up the `server` container before postgres is ready then it will crash. To implement this we pass the following arguments:

1. **test**: The command to run on the container to determine the health. Arguments are provided as a comma-separated array.
2. **interval**: This determines how long the container will wait to run the check, and then the interval thereafter. Default is `30s`.
3. **timeout**: How long the test should run before timing out. Default is `30s`
4. **retries**: How many attempts to make before giving up and considering the container `unhealthy`. Defaults to `3`.

#### environment

Pretty self explanatory, these are the environment variables we'd like the container to receive. Here we pass in all the API and DB information we need for the server to run.

#### network_mode

This changes the network mode that the container runs in. We've switched it to `hosts` here to ensure that it allows incoming connections from other containers.

Note that when setting the `network_mode` to 'host' you are unable to map any ports.

#### depends_on

This is where we link back to the `healthcheck` command that we set up in the `db` container. This command tells us to wait until the `db` is healthy before running the container. This ensures the database is ready to accept connections.

---

Of course there are many more commands are your disposal for a variety of setups. The full list of Docker Compose commands, and their available arguments, are available [here](https://docs.docker.com/compose/).

## Bringing it all up

Now we're ready to launch! Now if you jump into the `overengineeredTodo` directory and run the following commands:

```bash
docker-compose up -d
```

This builds the images and brings the containers up. The `-d` command detaches the containers so we aren't getting the output of them streamed to the console. If you followed the steps you should now be able to visit your app at http://localhost:8888. If you used my project it should look something like this:

![App demo](https://github.com/stevenlaidlaw/OverengineeredTodo/blob/master/overengineeredTodo.png?raw=true)

Try changing a few things then refresh the page. You'll see your changes have persisted to the database, and will continue to be available for the lifetime of the container.

Some more helpful commands:

```bash
# Build the images
docker-compose build
# Start the containers
docker-compose start 
# Stop the containers
docker-compose stop 
# Stop and destroys the containers
# Be careful as you'll lose your DB data!
docker-compose down
# Get the status of the relevant containers
docker-compose ps
```

---

Hopefully this _very_ basic introduction has shed some light on Docker and how to use it in a real world app. Don't forget to add the build step for `app` before running the `docker-compose` command to ensure your files are the most up-to-date. You can see the way I've done it in the scripts section of my `package.json` file [here](https://github.com/stevenlaidlaw/OverengineeredTodo).

That's it! Please let me know if you have any questions or corrections to any of the information here.
