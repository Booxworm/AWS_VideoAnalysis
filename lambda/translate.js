const AWS = require('aws-sdk');

const s3 = new AWS.S3();
const translate = new AWS.Translate();

const translator = (key, text) => {

    const targetLang = 'es'
    const params = {
        SourceLanguageCode : 'auto',
        TargetLanguageCode : targetLang,
        Text: text,
        TerminologyNames: [ ]
    }
    
    translate.translateText(params, (err, data) => {
        if (err)
            console.log(err, err.stack);
        else {
            console.log(JSON.stringify(data, undefined, 2));

            const buf = Buffer.from(JSON.stringify(data));
            s3.putObject({
                Bucket : process.env.TRANSLATED_BUCKET_NAME,
                Key : targetLang + '/' + key,
                Body : buf
            }, (err) => {
                if (err)
                    console.log(err, err.stack);
                else {
                    console.log('Upload success');
                }
            });
        }
    });
}

exports.handler = function (event) {
    
    const key = event.Records[0].s3.object.key
    const arr = key.split('.');
    const ext = arr[arr.length - 1];

    if (ext == 'json') {
        console.log(JSON.stringify(event, undefined, 2));

        // Exctract transcript
        const params = {
            Bucket: process.env.TRANSCRIBED_BUCKET_NAME, 
            Key: key
        }
    
        s3.getObject(params, (err, data) => {
            if (err)
                console.log(err, err.stack);
            else {
                const objectData = JSON.parse(data.Body.toString('utf-8'));
                
                console.log(JSON.stringify(objectData));
                const transcript = objectData.results.transcripts[0].transcript;
                console.log(transcript);

                // Translate
                translator(key, transcript);
            }
        });
    }
}