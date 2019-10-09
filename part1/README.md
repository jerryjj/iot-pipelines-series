# Part 1

This is the support folder for article xxx (link)

## Setup

### Enable APIs

```sh
ENABLE_APIS=(
"pubsub.googleapis.com" \
"bigquery-json.googleapis.com"
)

gcloud services enable --project=$GCP_PROJECT_ID ${ENABLE_APIS[@]}
```

### Create Pub/Sub topic

Topic for ingesting the devices signal data:

```sh
gcloud pubsub topics create $PS_TOPIC_ID \
--project $GCP_PROJECT_ID
```

### Create Service Account for local use

Create a private key, which have write access to that topic.
We will use this locally with our simulator.

```sh
KEY_NAME="ps-secret-key"

gcloud iam service-accounts create $KEY_NAME \
--project=$GCP_PROJECT_ID \
--display-name $KEY_NAME

gcloud pubsub topics add-iam-policy-binding $PS_TOPIC_ID \
--project=$GCP_PROJECT_ID \
--member serviceAccount:$KEY_NAME@$GCP_PROJECT_ID.iam.gserviceaccount.com \
--role roles/pubsub.publisher

gcloud iam service-accounts keys create \
--project=$GCP_PROJECT_ID \
--key-file-type json \
--iam-account $KEY_NAME@$GCP_PROJECT_ID.iam.gserviceaccount.com \
../secrets/$KEY_NAME.json
```

#### Testing our Pub/Sub

Let's test our setup by subscribing to our topic and send some data to it.

First run the following command to create the subscription:

```sh
gcloud pubsub subscriptions create test_sub \
--topic $PS_TOPIC_ID \
--project $GCP_PROJECT_ID
```

Then run the following script to send dummy event to the topic:

```sh
gcloud pubsub topics publish $PS_TOPIC_ID \
--project $GCP_PROJECT_ID \
--message 'hello, pub/sub'
```

Then lets pull data from out subscription:

```sh
gcloud pubsub subscriptions pull test_sub \
--project $GCP_PROJECT_ID \
--auto-ack
```

Finally let's remove our test subscription:

```sh
gcloud pubsub subscriptions delete test_sub \
--project $GCP_PROJECT_ID
```

### Prepare BigQuery

First let's create our dataset and set the location to EU (if you are using different region, adjust accordingly):

```sh
bq --project_id=$GCP_PROJECT_ID mk --data_location EU $BQ_DATASET_ID
```

Let's create our BigQuery table using schema defined in the `table-schema.json`:

```sh
bq --project=$GCP_PROJECT_ID mk \
--display_name="devices signal data" \
--time_partitioning_type=DAY \
--time_partitioning_field=timestamp \
--table $BQ_DATASET_ID.$BQ_TABLE_ID table-schema.json
```

#### Testing our table

Before processing real data to the table, lets run some test queries in the BigQuery Web UI (link).
Make sure you select the right project and then copy-paste the following query to the Query editor and run it.

```sql
WITH dummy_data AS (
  SELECT * FROM unnest(
    array<struct<device_id string, ride_id string, timestamp TIMESTAMP, event_name string, latitude float64, longitude float64, battery_percentage int64, power_on_status bool>>[
      ("0001", "123456", TIMESTAMP("2019-10-07 13:28:30.000 UTC"), "poweron", 60.1696993, 24.9294322, 88, true),
      ("0001", "123456", TIMESTAMP("2019-10-07 13:29:00.000 UTC"), "gps", 60.16962, 24.9288, 86, true),
      ("0001", "123456", TIMESTAMP("2019-10-07 13:29:30.000 UTC"), "gps", 60.16958, 24.92813, 84, true),
      ("0001", "123456", TIMESTAMP("2019-10-07 13:30:00.000 UTC"), "gps", 60.16969, 24.92074, 82, true),
      ("0001", "123456", TIMESTAMP("2019-10-07 13:30:30.000 UTC"), "poweroff", 60.1680235, 24.9222142, 81, false),
      ("0002", "123457", TIMESTAMP("2019-10-07 13:29:00.000 UTC"), "poweron", 60.1696993, 24.9294322, 20, true),
      ("0002", "123457", TIMESTAMP("2019-10-07 13:29:30.000 UTC"), "gps", 60.16962, 24.9288, 18, true),
      ("0002", "123457", TIMESTAMP("2019-10-07 13:30:00.000 UTC"), "gps", 60.16958, 24.92813, 14, true),
      ("0002", "123457", TIMESTAMP("2019-10-07 13:30:30.000 UTC"), "gps", 60.16969, 24.92074, 10, true),
      ("0002", "123457", TIMESTAMP("2019-10-07 13:32:00.000 UTC"), "poweroff", 60.1680235, 24.9222142, 4, false)
    ]
  )
),

-- Defines collection of ride start events from our data
starts AS (SELECT
  timestamp, device_id, ride_id rid, latitude lat, longitude lng, battery_percentage bttr
FROM dummy_data
WHERE
  event_name = "poweron"),

-- Defines collection of ride end events from our data
ends AS (SELECT
  timestamp, device_id, ride_id rid, latitude lat, longitude lng, battery_percentage bttr
FROM dummy_data
WHERE
  event_name = "poweroff"),

-- Defines collection of location update events from our data
location_updates AS (SELECT
  timestamp, device_id, ride_id rid, latitude lat, longitude lng, battery_percentage bttr
FROM dummy_data
WHERE
  event_name = "gps")

-- QUERY:

-- this query gives us each ended ride and their details
SELECT
  ANY_VALUE(starts.device_id) AS device,
  starts.rid, MIN(starts.timestamp) AS start_time, ANY_VALUE(starts.lat) AS start_lat, ANY_VALUE(starts.lng) AS start_lng,
  MAX(ends.timestamp) AS end_time, ANY_VALUE(ends.lat) AS end_lat, ANY_VALUE(ends.lng) AS end_lng,
  TIMESTAMP_DIFF(MAX(ends.timestamp), MIN(starts.timestamp), SECOND) AS duration_secs,
  (MAX(starts.bttr) - MIN(ends.bttr)) AS battery_usage_percent
FROM starts,ends
LEFT JOIN location_updates ON location_updates.rid = starts.rid
WHERE
  ends.rid = starts.rid
  AND location_updates.rid = starts.rid
GROUP BY rid
```

As you can see, as a result, we get rows for each rides in our dummy data.

To answer some other questions, you can replace the final `SELECT` -query with one of the following.

*When was the last time a certain device has been seen and what was the battery level of it:*

```sql
SELECT
  device_id, timestamp AS last_seen, battery_percentage
FROM dummy_data
WHERE
  device_id = '0001'
ORDER BY timestamp DESC
LIMIT 1
```

*From how many unique devices we have received a signal certain month (October):*

```sql
,params AS (
  SELECT
    '2019-10' AS search_month
)

SELECT
  COUNT(DISTINCT(device_id)) AS devices
FROM params,dummy_data
WHERE
  FORMAT_TIMESTAMP('%Y-%m', timestamp) = params.search_month
```

*What routes have devices driven on certain time window:*

```sql
,params AS (
  SELECT
    DATETIME(TIMESTAMP "2019-10-07 13:00:00+00:00") AS start_date,
    DATETIME(TIMESTAMP "2019-10-07 14:00:00+00:00") AS end_date
)

SELECT
  ANY_VALUE(starts.device_id) AS device,
  starts.rid, MIN(starts.timestamp) AS start_time, ANY_VALUE(starts.lat) AS start_lat, ANY_VALUE(starts.lng) AS start_lng,
  MAX(ends.timestamp) AS end_time, ANY_VALUE(ends.lat) AS end_lat, ANY_VALUE(ends.lng) AS end_lng,
  TIMESTAMP_DIFF(MAX(ends.timestamp), MIN(starts.timestamp), SECOND) AS duration_secs,
  (MAX(starts.bttr) - MIN(ends.bttr)) AS battery_usage_percent,
  ARRAY_AGG(STRUCT(location_updates.timestamp, location_updates.lat, location_updates.lng) ORDER BY location_updates.timestamp) AS waypoints
FROM params,starts,ends
LEFT JOIN location_updates ON location_updates.rid = starts.rid
WHERE
  (DATETIME(starts.timestamp) BETWEEN params.start_date AND params.end_date)
  AND ends.rid = starts.rid
  AND location_updates.rid = starts.rid
GROUP BY rid
```

## Extra

As we are dealing with Geolocation data also, you can also test querying the data and mapping it to a map.
As an example lets open a browser, to <https://bigquerygeoviz.appspot.com/> and Sign In, Select our Project ID from the dropdown
and paste the following query:

```sql
WITH dummy_data AS (
  SELECT * FROM unnest(
    array<struct<device_id string, ride_id string, timestamp TIMESTAMP, event_name string, latitude float64, longitude float64, battery_percentage int64, power_on_status bool>>[
      ("0001", "123456", TIMESTAMP("2019-10-07 13:28:30.000 UTC"), "poweron", 60.1696993, 24.9294322, 88, true),
      ("0001", "123456", TIMESTAMP("2019-10-07 13:29:00.000 UTC"), "gps", 60.16962, 24.9288, 86, true),
      ("0001", "123456", TIMESTAMP("2019-10-07 13:29:30.000 UTC"), "gps", 60.16958, 24.92813, 84, true),
      ("0001", "123456", TIMESTAMP("2019-10-07 13:30:00.000 UTC"), "gps", 60.16969, 24.92074, 82, true),
      ("0001", "123456", TIMESTAMP("2019-10-07 13:30:30.000 UTC"), "poweroff", 60.1680235, 24.9222142, 81, false),
      ("0002", "123457", TIMESTAMP("2019-10-07 13:29:00.000 UTC"), "poweron", 60.1796993, 24.9394322, 20, true),
      ("0002", "123457", TIMESTAMP("2019-10-07 13:29:30.000 UTC"), "gps", 60.17962, 24.9388, 18, true),
      ("0002", "123457", TIMESTAMP("2019-10-07 13:30:00.000 UTC"), "gps", 60.17958, 24.93813, 14, true),
      ("0002", "123457", TIMESTAMP("2019-10-07 13:30:30.000 UTC"), "gps", 60.17969, 24.93074, 10, true),
      ("0002", "123457", TIMESTAMP("2019-10-07 13:32:00.000 UTC"), "poweroff", 60.1780235, 24.9322142, 4, false)
    ]
  )
),

-- Defines collection of ride start events from our data
starts AS (SELECT
  timestamp, device_id, ride_id rid, latitude lat, longitude lng, battery_percentage bttr
FROM dummy_data
WHERE
  event_name = "poweron"),

-- Defines collection of ride end events from our data
ends AS (SELECT
  timestamp, device_id, ride_id rid, latitude lat, longitude lng, battery_percentage bttr
FROM dummy_data
WHERE
  event_name = "poweroff"),

-- this query gives us each ended ride and their details
SELECT
  ANY_VALUE(starts.device_id) AS device,
  starts.rid, MIN(starts.timestamp) AS start_time,
  MAX(ends.timestamp) AS end_time,
  ST_GeogPoint(ANY_VALUE(starts.lng), ANY_VALUE(starts.lat)) AS start_wkt,
  ST_GeogPoint(ANY_VALUE(ends.lng), ANY_VALUE(ends.lat)) AS end_wkt,
  TIMESTAMP_DIFF(MAX(ends.timestamp), MIN(starts.timestamp), SECOND) AS duration_secs,
  (MAX(starts.bttr) - MIN(ends.bttr)) AS battery_usage_percent
FROM starts,ends
WHERE
  ends.rid = starts.rid
GROUP BY rid

SELECT
  FORMAT_TIMESTAMP("%Y-%m-%dT%X%Ez", timestamp) as ts, event_name, device_id, ST_GeogPoint(longitude, latitude) AS wkt
FROM dummy_data
WHERE
  ride_id = "123456"
ORDER BY timestamp DESC
LIMIT 5000
```

Then click `Run` and `See Results`
Make sure your `Geometry column` is *wkt*, click `Add styles`.
Change the `fillColor` to be *Data-driven*,
Select `Function`: *categorical* and `Field` *event_name*
Add Domains *poweron*, *gps*, *poweroff* and select different colors for them.

Now you have a visualisation of a single ride.

That's it for the setup on Part 1, continue to Part 2.
