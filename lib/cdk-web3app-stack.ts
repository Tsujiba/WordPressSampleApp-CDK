import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as rds from 'aws-cdk-lib/aws-rds'
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as targets from "aws-cdk-lib/aws-elasticloadbalancingv2-targets";
import { WebServerInstance } from './constructs/web-server-instance';

export class CdkWeb3AppStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // VPCの定義（デフォルト2AZ、各2つのPrivateとPublicサブネット）
    const vpc = new ec2.Vpc(this, 'BlogVPC', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16')
    })


    // EC2の定義
    const webserver1 = new WebServerInstance(this, 'WebServer1', {
      vpc
    })

    // RDS for MySQLの定義
    const dbinstance = new rds.DatabaseInstance(this, "MySQLDB", {
      vpc,
      engine: rds.DatabaseInstanceEngine.mysql({version: rds.MysqlEngineVersion.VER_8_0_31}),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.SMALL),
      databaseName: "wordpress",
      // multiAz: true,
    });

    // DBの通信をEC2へ限定
    dbinstance.connections.allowDefaultPortFrom(webserver1.instance);

    // ALBの定義
    const alb = new elbv2.ApplicationLoadBalancer(this, "LoadBalancer", {
      vpc,
      internetFacing: true,
    });

    // リスナーの追加
    const listener = alb.addListener("Listener", {
      port: 80,
    });

    // インスタンスをターゲットを追加
    listener.addTargets("ApplicationFleet", {
      port: 80,
      targets: [new targets.InstanceTarget(webserver1.instance, 80)],
      healthCheck: {
        path: "/wp-includes/images/blank.gif",
      }
    });

    // ALBからEC2へアクセス許可
    webserver1.instance.connections.allowFrom(alb, ec2.Port.tcp(80));

  }
}
