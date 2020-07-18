const cdk = require('@aws-cdk/core');
const iam = require('@aws-cdk/aws-iam');
const s3 = require('@aws-cdk/aws-s3');
const s3_notif = require('@aws-cdk/aws-s3-notifications');
const lambda = require('@aws-cdk/aws-lambda');
const logs = require('@aws-cdk/aws-logs');

class VideoAnalysisStack extends cdk.Stack {
  /**
   *
   * @param {cdk.Construct} scope
   * @param {string} id
   * @param {cdk.StackProps=} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);

    // Input
    const inputBucket = new s3.Bucket(this, 'InputBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    // Transcribe
    const transcribedBucket = new s3.Bucket(this, 'TranscribedBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    const logsPolicy = new iam.PolicyStatement({
      resources: [
        'arn:aws:logs:' + props.env.region + ':' + props.env.account + ':log-group:/aws/lambda/*'
      ],
      actions: [
        'logs:CreateLogStream',
        'logs:PutLogEvents',
        'logs:CreateLogGroup'
      ]
    });

    const transcribeS3Policy = new iam.PolicyStatement({
      resources: [
        inputBucket.bucketArn + '/*',
        transcribedBucket.bucketArn + '/*',
      ],
      actions: [
        's3:GetObject',
        's3:PutObject'
      ]
    });

    const transcribePolicy = new iam.PolicyStatement({
      resources: ['*'],
      actions: [
        'transcribe:StartTranscriptionJob'
      ]
    });

    const transcribeRole = new iam.Role(this, 'TranscribeRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com')
    });
    transcribeRole.addToPolicy(logsPolicy);
    transcribeRole.addToPolicy(transcribeS3Policy);
    transcribeRole.addToPolicy(transcribePolicy);

    const transcribeFn = new lambda.Function(this, 'TranscribeFunction', {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.asset('lambda'),
      handler: 'transcribe.handler',

      role: transcribeRole,
      logRetention: logs.RetentionDays.ONE_DAY,

      environment: {
        INPUT_BUCKET_NAME: inputBucket.bucketName,
        TRANSCRIBED_BUCKET_NAME: transcribedBucket.bucketName
      }
    });

    inputBucket.addEventNotification(s3.EventType.OBJECT_CREATED_PUT, new s3_notif.LambdaDestination(transcribeFn));
    // transcribedBucket.grantPut(transcribeFn);

    // Translate
    const translatedBucket = new s3.Bucket(this, 'TranslatedBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    const translateS3Policy = new iam.PolicyStatement({
      resources: [
        transcribedBucket.bucketArn + '/*',
        translatedBucket.bucketArn + '/*'
      ],
      actions: [
        's3:GetObject',
        's3:PutObject'
      ]
    });

    const translatePolicy = new iam.PolicyStatement({
      resources: ['*'],
      actions: [
        'translate:TranslateText',
        'comprehend:DetectDominantLanguage'
      ]
    });

    const translateRole = new iam.Role(this, 'TranslateRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com')
    });
    translateRole.addToPolicy(logsPolicy);
    translateRole.addToPolicy(translateS3Policy);
    translateRole.addToPolicy(translatePolicy);

    const translateFn = new lambda.Function(this, 'TranslateFunction', {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.asset('lambda'),
      handler: 'translate.handler',

      role: translateRole,
      logRetention: logs.RetentionDays.ONE_DAY,

      environment: {
        TRANSCRIBED_BUCKET_NAME: transcribedBucket.bucketName,
        TRANSLATED_BUCKET_NAME: translatedBucket.bucketName
      }
    });

    transcribedBucket.addEventNotification(s3.EventType.OBJECT_CREATED_PUT, new s3_notif.LambdaDestination(translateFn));
    // translatedBucket.grantPut(translateFn);

  }
}

module.exports = { VideoAnalysisStack }
