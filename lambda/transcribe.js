const AWS = require('aws-sdk');

const transcribe = new AWS.TranscribeService();

exports.handler = function (event) {
    console.log(JSON.stringify(event, undefined, 2));

    console.log(process.env.INPUT_BUCKET_NAME);
    console.log(process.env.TRANSCRIBED_BUCKET_NAME);

    const key = event.Records[0].s3.object.key;
    const uri = 's3://' + process.env.INPUT_BUCKET_NAME + '/' + key;
    const arr = key.split('.')
    const fileName = arr.slice(0, arr.length - 1).join('.');
    const jobName = 'transcribe-'+ fileName + '-' + Date.now();
    console.log(uri);

    const params = {
        LanguageCode: 'en-US',
        Media: { /* required */
            MediaFileUri: uri
        },
        TranscriptionJobName: jobName, /* required */
        ContentRedaction: {
            RedactionOutput: 'redacted', /* required */
            RedactionType: 'PII' /* required */
        },
        OutputBucketName: process.env.TRANSCRIBED_BUCKET_NAME,
    };
    transcribe.startTranscriptionJob(params, (err, data) => {
        if (err)
            console.log(err, err.stack);
        else {
            console.log(JSON.stringify(data, undefined, 2));
        }
    });
}