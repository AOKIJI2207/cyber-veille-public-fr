const { runIngestion } = require("../ingestion/pipeline");

runIngestion()
  .then((result) => {
    console.log(JSON.stringify({ event: "ingestion_done", metrics: result.metrics }, null, 2));
  })
  .catch((error) => {
    console.error(JSON.stringify({ event: "ingestion_failed", error: error.message }, null, 2));
    process.exit(1);
  });
