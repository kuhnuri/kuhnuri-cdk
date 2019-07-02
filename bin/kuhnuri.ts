#!/usr/bin/env node
import cdk = require('@aws-cdk/core');
import { KuhnuriStack } from '../lib/kuhnuri-stack';

const app = new cdk.App();
new KuhnuriStack(app, 'KuhnuriStack');
