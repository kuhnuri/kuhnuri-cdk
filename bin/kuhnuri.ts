#!/usr/bin/env node
import { App } from "@aws-cdk/core";
import { KuhnuriStack } from "../lib/kuhnuri-stack";
import config from "../config";

new KuhnuriStack(new App(), "KuhnuriStack", {
  env: {
    ...config
  }
});
