const { expect, matchTemplate, MatchStyle } = require('@aws-cdk/assert');
const cdk = require('@aws-cdk/core');
const VideoAnalysis = require('../lib/video_analysis-stack');

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new VideoAnalysis.VideoAnalysisStack(app, 'MyTestStack');
    // THEN
    expect(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
