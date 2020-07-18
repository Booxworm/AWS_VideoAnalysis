#!/usr/bin/env node

const cdk = require('@aws-cdk/core');
const { VideoAnalysisStack } = require('../lib/video_analysis-stack');

const app = new cdk.App();
new VideoAnalysisStack(app, 'VideoAnalysisStack', {
    env : {
        account : '917066274413',
        region : 'ap-southeast-1'
    }
});

