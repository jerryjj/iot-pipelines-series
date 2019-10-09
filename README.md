# Support repository for Article series 'IoT Datapipelines in GCP'

This repository is meant to be followed with the article series I wrote about different ways of creating Data pipelines in GCP.

- [IoT Data Pipelines in GCP, multiple ways — Part 1](https://medium.com/@jerry.jalava/iot-data-pipelines-in-gcp-multiple-ways-part-1-9eade945d218)
- [IoT Data Pipelines in GCP, multiple ways — Part 2](https://medium.com/@jerry.jalava/iot-data-pipelines-in-gcp-multiple-ways-part-2-893269d56371)
- [IoT Data Pipelines in GCP, multiple ways — Part 3](https://medium.com/@jerry.jalava/iot-data-pipelines-in-gcp-multiple-ways-part-3-11e54b35ed42)

## Preparations

Before moving to any steps, take a look at the `.env` -file and input your preferred values.
Then set them to your environment

```sh
source .env
```

If the Project ID you selected does not yet exists, you can create it like so:

```sh
gcloud projects create $GCP_PROJECT_ID

export BILLING_ID=[YOUR BILLING ID]
gcloud beta billing projects link $GCP_PROJECT_ID --billing-account $BILLING_ID
```

That's it, now you are ready to move on to the `Step 1`
