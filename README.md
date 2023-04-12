# JSONata Extended Exerciser

This allows you to test JSONata expressions against a JSON input.

In the top editor panes you can enter your JSONata expression, and any [bindings](https://docs.jsonata.org/embedding-extending#expressionevaluateinput-bindings-callback) you wish to include.

In the botton editor panes you can supply your source JSON and see the results.

On the topmenu bar you can select from the same four examples available at [try.jsonata.org](http://try.jsonata.org/)

The custom JSONata extended functions from [https://www.npmjs.com/package/jsonata-extended](https://www.npmjs.com/package/jsonata-extended) are available.

## Running the app locally

- `npm install`
- `npm start`

## Running in Docker

Follow the [Official Docker Instructions](https://docs.docker.com/install/) to get setup and running with the Docker Engine.

Follow the [Official Docker Compose Instructions](https://docs.docker.com/compose/install/) to get setup.

> Its recommended to configure Docker to start on boot to ensure docker is running after a system reboot. Instructions can be found on the docker documentation depending on your OS.

### Start JSONata Extended Exerciser

Now with Docker and Docker Compose installed, create the image and start the container.

```bash
docker-compose up
```
This should start the build of a new image and container using [Nginx](https://hub.docker.com/_/nginx), and then start the container.

You will be able to access the tool at [http://localhost:8080](http://localhost:8080)

> After rebuilding the project you will need to rebuild the image using
> ```bash
> docker-compose build
> ```

## License

MIT © Lushonline
