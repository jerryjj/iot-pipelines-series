# Device simulator

This utility will send mock data to the data pipeline we have built.
Instructions of when to use this is included in the articles.

## Setup

This project requires node.js to be installed locally, optionally you can also run the tool as a container.

### Verify credentials

Make sure you have followed all the steps in the articles and you have your private key in the secrets folder.

### Install dependencies

```sh
npm install
```

## Running simulator

To run it with default configuration (5 devices), just run:

```sh
node src/index.js
```

If you want to modifiy the number of devices and the center where devices will be moving, run:

```sh
DEVICE_COUNT=10 GEO_CENTER='60.168958,24.945093' node src/index.js
```

### Skip real Pub/Sub sending

if you want to skip sending to the real Pub/Sub topic while testing etc, export following environment variable:

```sh
export SKIP_PUBSUB=1
```

OR

```sh
SKIP_PUBSUB=1 node src/index.js
```
