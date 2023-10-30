# typescript-serverless-template

Template for TypeScript Serverless applications.

Since this tries to follow the [3 Musketeers](https://3musketeersdev.netlify.app) methodology, the following are heavily used:

- Docker
- Docker Compose
- Make

## Usage

#### Configure

```bash
$ make .env
```

- See generated `.env` file for configuration

**Note:** For deployment via CI/CD, `CICD_MODE` environment variable should be set to `true` in the build server. All configuration should also be set in the build server's environment variables. They will automatically be used if `.env` is generated from `.env.cicd`.

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
