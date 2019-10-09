# Part 3

This is the support folder for article xxx (link)
This part assumes that you have already done everything in the part 1 & 2.

## Setup

### Enable APIs

```sh
ENABLE_APIS=(
"cloudfunctions.googleapis.com"
)

gcloud services enable --project=$GCP_PROJECT_ID ${ENABLE_APIS[@]}
```

### Create Service Account for our Cloud Function

We want to create a custom service account for our GCF which has limited access to our project.
We could limit the access even more, but for simplicity this will do.

```sh
KEY_NAME="pipeline-handlers-sa"

gcloud iam service-accounts create $KEY_NAME \
--project=$GCP_PROJECT_ID \
--display-name $KEY_NAME

gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
--project=$GCP_PROJECT_ID \
--member serviceAccount:$KEY_NAME@$GCP_PROJECT_ID.iam.gserviceaccount.com \
--role roles/bigquery.dataEditor
```

OPTIONAL:
If you want to test/develop your functions locally, you need to create a secret key for the service account and download it.
To do so, you can run:

```sh
gcloud iam service-accounts keys create \
--project=$GCP_PROJECT_ID \
--key-file-type json \
--iam-account $KEY_NAME@$GCP_PROJECT_ID.iam.gserviceaccount.com \
../secrets/$KEY_NAME.json
```

### Deploy our function

As we are using the Functions Framework in this example, we must use the Node.js 10 runtime which is currently in Beta.

```sh
gcloud functions deploy deviceSignalsHandler \
--project $GCP_PROJECT_ID \
--runtime nodejs10 \
--region $GCP_REGION \
--service-account pipeline-handlers-sa@$GCP_PROJECT_ID.iam.gserviceaccount.com \
--set-env-vars BQ_PROJECT_ID=$GCP_PROJECT_ID,BQ_DATASET_ID=devices,BQ_TABLE_ID=signals \
--trigger-topic $PS_TOPIC_ID \
--memory=128 \
--retry
```

## Cleanup

Once you are ready, you can remove the Function

```sh
gcloud functions delete deviceSignalsHandler \
--project $GCP_PROJECT_ID \
--region $GCP_REGION
```
