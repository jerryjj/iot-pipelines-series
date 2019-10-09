# Support repository for Article series 'IoT Datapipelines in GCP'

This repository is meant to be followed with the article series I wrote about different ways of creating Data pipelines in GCP.

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
