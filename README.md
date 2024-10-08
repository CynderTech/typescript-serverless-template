# typescript-serverless-template

Template for TypeScript serverless applications.

Deploys an [AWS Lambda application](https://docs.aws.amazon.com/lambda/latest/dg/deploying-lambda-apps.html) by utilizing [Serverless Framework](https://www.serverless.com). Env file (i.e., `.env`) is used for configuration.

Since this tries to follow the [3 Musketeers](https://3musketeers.pages.dev/) pattern, the following are heavily used:

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)
- [Make](https://www.gnu.org/software/make/)

## Usage

#### Configure

```bash
$ make .env
```

- See generated `.env` file for configuration

**Note:** For deployment via CI/CD, `CICD_MODE` environment variable should be set to `true` in the build server. All env configuration should then be set in the build server's environment variables. They will automatically be used if `.env` is generated from `.env.cicd`. See [Docker's handling of env variables from host environment](https://docs.docker.com/engine/reference/commandline/run/#:~:text=You%20can%20also%20use%20variables%20exported%20to%20your%20local%20environment) for more details.

#### Install dependencies (generate `node_modules`)

```bash
$ make deps
```

#### Run linter (autofix)

```bash
$ make lint
```

#### Run tests

```bash
$ make test
```

#### Deploy Serverless application

```bash
$ make deploy
```
