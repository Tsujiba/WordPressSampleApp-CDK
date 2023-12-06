#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CdkWeb3AppStack } from '../lib/cdk-web3app-stack';

const app = new cdk.App();
new CdkWeb3AppStack(app, 'CdkWeb3AppStack');
