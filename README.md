# CO2 CloudWatch Metrics

## Usage

1. deploy this CDK (`cdk deploy`) whatever region you like
    - if your account are new for CDK, run `cdk bootstrap` before running the deploy command
1. set Discord Webhook URL to SSM parameter
1. send your CO2 data via `put-metric-data`
    - On your IoT machine, install and setup AWS CLI or boto3

## Example Setup for Raspberry Pi 4

1. install AWS CLI by building from the source code
    - `sudo pip3 install git+https://github.com/aws/aws-cli.git@v2 --upgrade`
    - `aws configure` and set ACCESS_KEY and SECRET in Outputs of CloudFormation
1. install requirements
    - `sudo pip3 install mh-z19`
    - `sudo apt install -y jq`
1. set cron to send metric data

```bash
cat <<EOF > /tmp/cronsetting.txt
*/1 * * * * /usr/local/bin/aws cloudwatch put-metric-data --namespace "Home" --metric-name "CO2" --dimensions Position=LivingRoom --value \$(sudo python3 -m mh_z19 | jq -r .co2)
EOF
crontab /tmp/cronsetting.txt
```
