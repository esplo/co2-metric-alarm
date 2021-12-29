import { aws_cloudwatch, aws_cloudwatch_actions, aws_iam, aws_lambda_event_sources, aws_lambda_nodejs, aws_sns, aws_ssm, CfnOutput, Duration, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class Co2MetricStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // create metrics
    const metric = new aws_cloudwatch.Metric({
      namespace: 'Home',
      metricName: 'CO2',
      dimensionsMap: {
        Position: 'LivingRoom'
      },
    });
    const alarm = new aws_cloudwatch.Alarm(this, 'CO2Alarm', {
      metric,
      threshold: 1000,
      evaluationPeriods: 2,
    });

    // create actions
    const notificationParameters = new aws_ssm.StringParameter(this, 'notificationParameters', {
      stringValue: 'REPLACE_THIS_DISCORD_WEBHOOK_URL',
      tier: aws_ssm.ParameterTier.STANDARD,
    });
    const topic = new aws_sns.Topic(this, 'CO2AlarmTopic');
    alarm.addAlarmAction(
      new aws_cloudwatch_actions.SnsAction(topic)
    );
    alarm.addOkAction(
      new aws_cloudwatch_actions.SnsAction(topic)
    );
    const lambda = new aws_lambda_nodejs.NodejsFunction(this, 'notifier', {
      memorySize: 256,
      timeout: Duration.seconds(30),
      environment: {
        'ParamName': notificationParameters.parameterName
      },
    });
    notificationParameters.grantRead(lambda);
    lambda.addEventSource(new aws_lambda_event_sources.SnsEventSource(topic));

    // create IAM user
    const iamUserForIoT = new aws_iam.User(this, 'PutCO2User', {
    });
    iamUserForIoT.attachInlinePolicy(new aws_iam.Policy(this, 'PutCO2MetricDataPolicy', {
      statements: [new aws_iam.PolicyStatement({
        resources: [
          '*'
        ],
        actions: [
          'cloudwatch:PutMetricData',
        ],
        conditions: {
          "StringEquals": {
            "cloudwatch:namespace": metric.namespace,
          }
        }
      })],
    }));

    const key = new aws_iam.CfnAccessKey(this, `IAMUserKey`, { userName: iamUserForIoT.userName });
    new CfnOutput(this, `AccessKey`, { value: key.ref });
    new CfnOutput(this, `SecretAccessKey`, { value: key.attrSecretAccessKey });
  }
}
