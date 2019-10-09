# Part 2

This is the support folder for article xxx (link)
This part assumes that you have already done everything in the part 1.

## Setup

### Enable APIs

```sh
ENABLE_APIS=(
"storage-api.googleapis.com" \
"dataflow.googleapis.com"
)

gcloud services enable --project=$GCP_PROJECT_ID ${ENABLE_APIS[@]}
```

### Create bucket for Dataflow

Again, if you selected another region than EU, change the location accordingly

```sh
gsutil mb -p $GCP_PROJECT_ID -l eu gs://$BUCKET_NAME
```

### Copy UDF to Cloud Storage

```sh
gsutil cp udf.js $PIPELINE_FOLDER/udf.js
```

## Launch Dataflow pipeline

```sh
JOB_NAME=device-signals-`date +"%Y%m%d-%H%M%S"`

gcloud dataflow jobs run $JOB_NAME \
--project=$GCP_PROJECT_ID \
--region $GCP_REGION --zone $GCP_ZONE \
--gcs-location gs://dataflow-templates/2019-07-10-00/PubSub_to_BigQuery \
--parameters \
"inputTopic=projects/$GCP_PROJECT_ID/topics/$PS_TOPIC_ID,\
outputTableSpec=$GCP_PROJECT_ID:$BQ_DATASET_ID.$BQ_TABLE_ID,\
outputDeadletterTable=$GCP_PROJECT_ID:$BQ_DATASET_ID.${BQ_TABLE_ID}_deadletter,\
javascriptTextTransformFunctionName=transformDeviceSignalEvent,\
javascriptTextTransformGcsPath=$PIPELINE_FOLDER/udf.js"
```

While the pipeline is preparing, you can already start the simulator to push messages to the topic (if the Dataflow has finished setting up the Pub/Sub Subscription).
You can monitor the topic subscription the pipeline generates from the Cloud Console and see that the 'Unacked message count'
starts climbing up, but when the pipeline is ready, it goes to zero.

## Cleanup

Do not forget to cleanup once you have done following the article.

```sh
JOB_ID=$(gcloud --project $GCP_PROJECT_ID dataflow jobs list --region $GCP_REGION --status active --filter=name:device --format="value(id)")

gcloud --project $GCP_PROJECT_ID dataflow jobs drain --region $GCP_REGION $JOB_ID
```
